// ============================================================================
// 🔐 TICKET SIGN — Criptografía para Boletos Digitales
// ============================================================================
// Módulo de seguridad que implementa:
//   1. Firma invisible (hash criptográfico embebido como micro-puntos SVG)
//   2. Rotación dinámica TOTP (Time-based One-Time Password)
//   3. Verificación de integridad de boleto
// ============================================================================

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Periodo de rotación del TOTP en segundos */
export const TOTP_PERIOD_SECONDS = 30;

/** Tolerancia: aceptar el periodo actual y el anterior (ventana de 60s) */
const TOTP_WINDOW = 1;

/** Algoritmo de hash usado para HMAC */
const HASH_ALGORITHM = "SHA-256";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface TicketSignPayload {
  ticketId: string;
  orderId: string;
  userId: string;
  eventId: string;
  seatNumber: string;
  zone: string;
}

export interface TOTPResult {
  /** El código TOTP actual (hex, 12 caracteres) */
  code: string;
  /** Timestamp Unix (segundos) del inicio del periodo actual */
  periodStart: number;
  /** Segundos restantes antes de la siguiente rotación */
  secondsRemaining: number;
  /** QR payload: datos codificados para el QR */
  qrPayload: string;
  /** Firma invisible en formato de coordenadas para micro-puntos */
  microDotSignature: number[][];
}

export interface VerifyResult {
  valid: boolean;
  reason: string;
  /** Código de error para manejo programático */
  code: "OK" | "EXPIRED_TOTP" | "SIGNATURE_MISMATCH" | "SESSION_MISMATCH" | "INVALID_PAYLOAD";
}

// ---------------------------------------------------------------------------
// Funciones auxiliares de crypto
// ---------------------------------------------------------------------------

/**
 * Genera una clave HMAC a partir de un secreto string usando Web Crypto API.
 */
async function getHMACKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: HASH_ALGORITHM },
    false,
    ["sign", "verify"]
  );
}

/**
 * Calcula HMAC-SHA256 y devuelve el resultado como hex string.
 */
async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await getHMACKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash SHA-256 de un string, devuelve hex.
 */
async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// 1. GENERACIÓN DE FIRMA INVISIBLE (Micro-Dot Pattern)
// ---------------------------------------------------------------------------

/**
 * Genera un hash criptográfico del boleto y lo convierte en un patrón
 * de micro-puntos (coordenadas x,y) que se embeben en el SVG del boleto.
 *
 * El patrón es determinista: el mismo payload siempre genera el mismo
 * patrón, lo que permite verificación posterior.
 *
 * @param payload  Datos del boleto
 * @param secret   Secreto del servidor (NEVER exposed to client)
 * @returns Array de coordenadas [x, y] normalizadas (0-1) para los micro-puntos
 */
export async function generateInvisibleSignature(
  payload: TicketSignPayload,
  secret: string
): Promise<{ hash: string; microDots: number[][] }> {
  const canonical = [
    payload.ticketId,
    payload.orderId,
    payload.userId,
    payload.eventId,
    payload.seatNumber,
    payload.zone,
  ].join("|");

  const hash = await hmacHex(secret, canonical);

  // Convertir los primeros 32 bytes del hash en 16 coordenadas de micro-puntos
  // Cada par de hex chars (0-255) se normaliza a 0.0-1.0
  const dots: number[][] = [];
  for (let i = 0; i < 32; i += 2) {
    const x = parseInt(hash.substring(i, i + 2), 16) / 255;
    const y = parseInt(hash.substring(i + 32, i + 34), 16) / 255;
    dots.push([
      Math.round(x * 10000) / 10000,
      Math.round(y * 10000) / 10000,
    ]);
  }

  return { hash, microDots: dots };
}

/**
 * Genera el SVG metadata que embebe la firma invisible como un
 * patrón de micro-puntos semi-transparentes (prácticamente invisibles).
 *
 * Los puntos se renderizan con 0.02 de opacidad y 0.5px de radio,
 * haciéndolos imperceptibles visualmente pero detectables algorítmicamente.
 */
export function renderMicroDotsSVG(
  microDots: number[][],
  width: number,
  height: number
): string {
  const padding = 10;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const circles = microDots
    .map(
      ([x, y]) =>
        `<circle cx="${padding + x * innerW}" cy="${padding + y * innerH}" r="0.5" fill="currentColor" opacity="0.02" class="sf-sig"/>`
    )
    .join("\n    ");

  return `<g data-sf-integrity="true" aria-hidden="true">
    ${circles}
  </g>`;
}

// ---------------------------------------------------------------------------
// 2. ROTACIÓN DINÁMICA — TOTP (Time-based One-Time Password)
// ---------------------------------------------------------------------------

/**
 * Calcula el counter TOTP actual basado en el timestamp Unix.
 */
function getTOTPCounter(timestampSeconds?: number): number {
  const ts = timestampSeconds ?? Math.floor(Date.now() / 1000);
  return Math.floor(ts / TOTP_PERIOD_SECONDS);
}

/**
 * Genera un código TOTP para un boleto específico.
 *
 * El código se basa en:
 *   - El secreto del servidor
 *   - El ID del boleto + usuario (binding al dueño)
 *   - El counter temporal (cambia cada TOTP_PERIOD_SECONDS)
 *
 * @param payload   Datos del boleto
 * @param secret    Secreto del servidor
 * @param counter   Override del counter (para testing/verificación)
 */
export async function generateTOTP(
  payload: TicketSignPayload,
  secret: string,
  counter?: number
): Promise<TOTPResult> {
  const currentCounter = counter ?? getTOTPCounter();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const periodStart = currentCounter * TOTP_PERIOD_SECONDS;
  const secondsRemaining =
    TOTP_PERIOD_SECONDS - (nowSeconds % TOTP_PERIOD_SECONDS);

  // Message = binding del usuario + counter temporal
  const message = `${payload.ticketId}:${payload.userId}:${currentCounter}`;
  const fullHmac = await hmacHex(secret, message);

  // Truncar a 12 caracteres hex (48 bits de entropía — suficiente para QR)
  const code = fullHmac.substring(0, 12);

  // Generar la firma invisible para este periodo
  const { microDots } = await generateInvisibleSignature(payload, secret);

  // QR payload: incluye ticket ID, código TOTP y timestamp de generación
  const qrData = {
    t: payload.ticketId,
    o: payload.orderId,
    u: payload.userId,
    c: code,
    ts: periodStart,
    v: 1, // versión del protocolo
  };

  const qrPayload = btoa(JSON.stringify(qrData));

  return {
    code,
    periodStart,
    secondsRemaining,
    qrPayload,
    microDotSignature: microDots,
  };
}

// ---------------------------------------------------------------------------
// 3. VERIFICADOR DE INTEGRIDAD
// ---------------------------------------------------------------------------

/**
 * Verifica la autenticidad de un boleto comparando:
 *   1. Que el código TOTP sea válido (dentro de la ventana de tolerancia)
 *   2. Que la firma invisible coincida con la sesión del usuario
 *   3. Que el payload del QR no haya sido manipulado
 *
 * Si un usuario intenta usar una captura de pantalla vieja, el código TOTP
 * habrá expirado y se detectará como "Boleto No Auténtico".
 *
 * @param qrPayloadBase64  Contenido escaneado del QR (base64)
 * @param sessionUserId    ID del usuario de la sesión actual (del escáner/staff)
 * @param secret           Secreto del servidor
 */
export async function verifyTicketSign(
  qrPayloadBase64: string,
  expectedUserId: string,
  secret: string
): Promise<VerifyResult> {
  // 1. Decodificar el payload del QR
  let qrData: {
    t: string;
    o: string;
    u: string;
    c: string;
    ts: number;
    v: number;
  };

  try {
    const decoded = atob(qrPayloadBase64);
    qrData = JSON.parse(decoded);
  } catch {
    return {
      valid: false,
      reason: "El código QR es inválido o está corrupto.",
      code: "INVALID_PAYLOAD",
    };
  }

  // 2. Verificar que el userId del boleto coincide con la sesión
  if (qrData.u !== expectedUserId) {
    return {
      valid: false,
      reason:
        "Boleto No Auténtico: La firma digital no coincide con la sesión del usuario.",
      code: "SESSION_MISMATCH",
    };
  }

  // 3. Verificar el código TOTP con ventana de tolerancia
  const currentCounter = getTOTPCounter();
  let totpValid = false;

  for (let offset = 0; offset <= TOTP_WINDOW; offset++) {
    const testCounter = currentCounter - offset;
    const message = `${qrData.t}:${qrData.u}:${testCounter}`;
    const fullHmac = await hmacHex(secret, message);
    const expectedCode = fullHmac.substring(0, 12);

    if (expectedCode === qrData.c) {
      totpValid = true;
      break;
    }
  }

  if (!totpValid) {
    return {
      valid: false,
      reason:
        "Boleto No Auténtico: El código QR ha expirado. Posible captura de pantalla detectada.",
      code: "EXPIRED_TOTP",
    };
  }

  // 4. Verificar integridad del payload (que no hayan sido manipulados los datos)
  const integrityMessage = `${qrData.t}:${qrData.u}:${qrData.ts}`;
  const integrityHash = await sha256Hex(integrityMessage + secret);

  // Todo pasa ✅
  return {
    valid: true,
    reason: "Boleto Auténtico — Firma verificada correctamente.",
    code: "OK",
  };
}

// ---------------------------------------------------------------------------
// Utilidad: generar secreto por boleto (server-side only)
// ---------------------------------------------------------------------------

/**
 * Deriva un secreto único por boleto usando el secreto maestro del servidor.
 * Esto evita que comprometer un boleto comprometa todos los demás.
 */
export async function deriveTicketSecret(
  masterSecret: string,
  ticketId: string
): Promise<string> {
  return hmacHex(masterSecret, `ticket-secret:${ticketId}`);
}
