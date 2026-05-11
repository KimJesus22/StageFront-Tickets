// ============================================================================
// 🛡️ API: /api/integrity — Validación de integridad en el servidor
// ============================================================================
//
// Recibe un BehaviorFingerprint del cliente y ejecuta:
//   1. Re-clasificación independiente (no confiar en el cliente)
//   2. Validaciones adicionales imposibles en el cliente:
//      - Rate limiting por IP
//      - Historial de fingerprints similares
//      - Cross-check del checksum
//   3. Retorna el veredicto final
//
// POST /api/integrity
// Body: { fingerprint: BehaviorFingerprint }
// Response: ClassificationResult + serverFlags
//
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  classify,
  type ClassificationResult,
} from "@/lib/integrity/BotClassifier";
import type { BehaviorFingerprint } from "@/lib/integrity/BehaviorCollector";

// ---------------------------------------------------------------------------
// Rate limiter en memoria (ligero, por IP)
// ---------------------------------------------------------------------------
// Tracks: IP → { timestamps[] }
// Costo de memoria: ~100 bytes × IPs activas (se limpia cada 5 min)

interface RateEntry {
  timestamps: number[];
  fingerprintCount: number;
  lastFingerprint: string | null;
}

const rateLimiter = new Map<string, RateEntry>();

// Limpieza periódica cada 5 minutos
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const RATE_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10;
const DUPLICATE_FINGERPRINT_THRESHOLD = 3;

let lastCleanup = Date.now();

function cleanupRateLimiter() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  const cutoff = now - RATE_WINDOW * 2;
  for (const [ip, entry] of rateLimiter) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimiter.delete(ip);
    }
  }
  lastCleanup = now;
}

// ---------------------------------------------------------------------------
// Validaciones del servidor
// ---------------------------------------------------------------------------

interface ServerValidation {
  isRateLimited: boolean;
  isDuplicateFingerprint: boolean;
  isChecksumValid: boolean;
  ipRiskScore: number;
}

function validateOnServer(
  ip: string,
  fp: BehaviorFingerprint
): ServerValidation {
  cleanupRateLimiter();

  const now = Date.now();

  // Obtener o crear entrada del rate limiter
  let entry = rateLimiter.get(ip);
  if (!entry) {
    entry = { timestamps: [], fingerprintCount: 0, lastFingerprint: null };
    rateLimiter.set(ip, entry);
  }

  // Limpiar timestamps fuera de ventana
  entry.timestamps = entry.timestamps.filter((t) => t > now - RATE_WINDOW);
  entry.timestamps.push(now);

  // Rate limiting
  const isRateLimited = entry.timestamps.length > MAX_REQUESTS_PER_WINDOW;

  // Detección de fingerprints duplicados (posible replay attack)
  const currentChecksum = fp.checksum;
  const isDuplicateFingerprint =
    entry.lastFingerprint === currentChecksum &&
    entry.fingerprintCount >= DUPLICATE_FINGERPRINT_THRESHOLD;

  if (entry.lastFingerprint === currentChecksum) {
    entry.fingerprintCount++;
  } else {
    entry.fingerprintCount = 1;
    entry.lastFingerprint = currentChecksum;
  }

  // Verificar checksum (regenerar con FNV-1a)
  const fpWithoutChecksum = { ...fp };
  delete (fpWithoutChecksum as Record<string, unknown>)["checksum"];
  const raw = JSON.stringify(fpWithoutChecksum);
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  const expectedChecksum = hash.toString(16).padStart(8, "0");
  const isChecksumValid = fp.checksum === expectedChecksum;

  // IP risk score basado en frecuencia
  const requestFrequency = entry.timestamps.length / (RATE_WINDOW / 1000);
  const ipRiskScore = Math.min(100, Math.round(requestFrequency * 20));

  return {
    isRateLimited,
    isDuplicateFingerprint,
    isChecksumValid,
    ipRiskScore,
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Extraer IP del request
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  let body: { fingerprint?: BehaviorFingerprint };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido" },
      { status: 400 }
    );
  }

  const fp = body.fingerprint;
  if (!fp || typeof fp !== "object") {
    return NextResponse.json(
      { error: "Fingerprint requerido" },
      { status: 400 }
    );
  }

  // 1. Validaciones del servidor
  const serverValidation = validateOnServer(ip, fp);

  // 2. Re-clasificación independiente del fingerprint
  const classification = classify(fp);

  // 3. Elevar veredicto si hay señales del servidor
  let finalVerdict = classification.verdict;
  let finalScore = classification.totalScore;
  let finalMessage = classification.message;

  // Si está rate-limited → elevar a bot
  if (serverValidation.isRateLimited) {
    finalVerdict = "bot";
    finalScore = Math.max(finalScore, 80);
    finalMessage = "Demasiadas solicitudes detectadas. Acceso restringido.";
  }

  // Si el checksum es inválido → elevar a suspect mínimo
  if (!serverValidation.isChecksumValid) {
    if (finalVerdict === "human") {
      finalVerdict = "suspect";
      finalScore = Math.max(finalScore, 40);
      finalMessage =
        "Se detectó una anomalía en los datos. Verificación adicional requerida.";
    }
  }

  // Si hay fingerprints duplicados → elevar a suspect
  if (serverValidation.isDuplicateFingerprint) {
    if (finalVerdict === "human") {
      finalVerdict = "suspect";
      finalScore = Math.max(finalScore, 35);
      finalMessage = "Patrón repetitivo detectado. Verificación requerida.";
    }
  }

  // Agregar IP risk al score
  finalScore = Math.min(
    100,
    finalScore + Math.round(serverValidation.ipRiskScore * 0.1)
  );

  const response: ClassificationResult & {
    serverFlags: ServerValidation;
  } = {
    verdict: finalVerdict,
    totalScore: finalScore,
    rules: classification.rules,
    requiresOTP: finalVerdict === "suspect",
    message: finalMessage,
    classifiedAt: Date.now(),
    serverFlags: serverValidation,
  };

  // Log para auditoría
  console.log(
    `[Integrity] IP=${ip} | Verdict=${finalVerdict} | Score=${finalScore} | ` +
      `Checksum=${serverValidation.isChecksumValid ? "✅" : "❌"} | ` +
      `RateLimit=${serverValidation.isRateLimited ? "🚫" : "✅"}`
  );

  return NextResponse.json(response);
}
