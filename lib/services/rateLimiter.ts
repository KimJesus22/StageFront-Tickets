// ============================================================================
// 🛡️ RATE LIMITER — Servicio Anti Fuerza Bruta
// ============================================================================
//
// Mitiga ataques de fuerza bruta contra la autenticación usando una tabla
// PostgreSQL (auth_attempts) como backend de conteo.
//
// Algoritmo:
//   1. Extrae la IP del cliente desde los headers HTTP.
//   2. Busca el par (ip, email) en auth_attempts.
//   3. Si no existe → INSERT con intentos=1.
//   4. Si existe y intentos >= MAX_ATTEMPTS dentro de la ventana → THROW.
//   5. Si existe y intentos < MAX_ATTEMPTS → UPDATE intentos+1.
//
// Complejidad:
//   • Búsqueda: O(1) — índice compuesto (ip_address, email).
//   • Insert/Update: O(1) — operación directa por PK implícito.
//
// Constantes:
//   • MAX_ATTEMPTS = 5 intentos fallidos permitidos.
//   • WINDOW_MINUTES = 15 minutos de ventana de bloqueo.
//
// ============================================================================

import { insforge } from "@/lib/insforge";
import { headers } from "next/headers";

// ── Constantes de configuración ─────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

// ── Tipos internos ──────────────────────────────────────────────────────────
interface AuthAttemptRow {
  id: number;
  ip_address: string;
  email: string;
  intentos: number;
  ultimo_intento: string;
}

// ============================================================================
// 🔍 getClientIP — Extracción segura de la IP del cliente
// ============================================================================
// En producción detrás de un reverse proxy (Vercel, Cloudflare, Nginx),
// la IP real del cliente viene en x-forwarded-for (primera IP de la cadena).
// Si no hay proxy, usamos x-real-ip como fallback.
// ============================================================================

export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // x-forwarded-for puede contener múltiples IPs: "client, proxy1, proxy2"
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // La primera IP es la del cliente real
    return forwardedFor.split(",")[0].trim();
  }

  // Fallback: algunos proxies usan x-real-ip
  const realIP = headersList.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  // Último recurso: IP desconocida (desarrollo local sin proxy)
  return "127.0.0.1";
}

// ============================================================================
// 🔒 checkRateLimit — Verificación de intentos antes de autenticar
// ============================================================================
//
// DEBE ejecutarse como la PRIMERA línea en la Server Action de login.
// Si lanza un error, la ejecución se detiene y la DB de usuarios
// NUNCA es tocada — protegiendo contra fuerza bruta.
//
// Flujo:
//   1. Busca registro existente para el par (ip, email).
//   2. Si no existe → crea uno con intentos=1 (primer intento).
//   3. Si existe:
//      a. Calcula si el último intento fue dentro de la ventana de 15 min.
//      b. Si fuera de ventana → resetea contador a 1 (nueva ventana).
//      c. Si dentro de ventana y intentos >= 5 → THROW (bloqueado).
//      d. Si dentro de ventana y intentos < 5 → incrementa +1.
//
// @throws Error si el usuario excede MAX_ATTEMPTS en la ventana
// ============================================================================

export async function checkRateLimit(
  ip: string,
  email: string
): Promise<void> {
  const sanitizedEmail = email.trim().toLowerCase();

  try {
    // ── 1. Buscar registro existente ──────────────────────────────────────
    const { data, error: selectError } = await insforge.database
      .from("auth_attempts")
      .select("id, intentos, ultimo_intento")
      .eq("ip_address", ip)
      .eq("email", sanitizedEmail)
      .limit(1);

    if (selectError) {
      // Si la tabla no responde, dejar pasar (fail-open para no bloquear
      // login legítimo por error de infraestructura).
      console.error("[RateLimiter] Error en SELECT:", selectError.message);
      return;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);

    // ── 2. No existe registro → primer intento ───────────────────────────
    if (!data || data.length === 0) {
      await insforge.database
        .from("auth_attempts")
        .insert({
          ip_address: ip,
          email: sanitizedEmail,
          intentos: 1,
          ultimo_intento: now.toISOString(),
        });
      return;
    }

    const record = data[0] as AuthAttemptRow;
    const ultimoIntento = new Date(record.ultimo_intento);

    // ── 3. Fuera de ventana → resetear contador ──────────────────────────
    if (ultimoIntento < windowStart) {
      await insforge.database
        .from("auth_attempts")
        .update({
          intentos: 1,
          ultimo_intento: now.toISOString(),
        })
        .eq("id", record.id);
      return;
    }

    // ── 4. Dentro de ventana — verificar límite ──────────────────────────
    if (record.intentos >= MAX_ATTEMPTS) {
      const minutosRestantes = Math.ceil(
        (WINDOW_MINUTES * 60 * 1000 - (now.getTime() - ultimoIntento.getTime())) / 60000
      );

      throw new Error(
        `Demasiados intentos. Tu cuenta ha sido bloqueada temporalmente por ${minutosRestantes} minuto${minutosRestantes !== 1 ? "s" : ""} por razones de seguridad.`
      );
    }

    // ── 5. Dentro de ventana, bajo el límite → incrementar ───────────────
    await insforge.database
      .from("auth_attempts")
      .update({
        intentos: record.intentos + 1,
        ultimo_intento: now.toISOString(),
      })
      .eq("id", record.id);

  } catch (err) {
    // Re-throw rate limit errors (son intencionales)
    if (err instanceof Error && err.message.includes("Demasiados intentos")) {
      throw err;
    }
    // Otros errores → fail-open (log y dejar pasar)
    console.error("[RateLimiter] Error inesperado:", err);
  }
}

// ============================================================================
// ✅ clearRateLimit — Reseteo tras login exitoso
// ============================================================================
// Cuando el usuario se autentica correctamente, borramos su registro
// de auth_attempts para resetear el contador.
// Esto evita que un usuario legítimo quede bloqueado después de
// varios intentos previos fallidos (ej. olvidó la contraseña).
// ============================================================================

export async function clearRateLimit(
  ip: string,
  email: string
): Promise<void> {
  const sanitizedEmail = email.trim().toLowerCase();

  try {
    await insforge.database
      .from("auth_attempts")
      .delete()
      .eq("ip_address", ip)
      .eq("email", sanitizedEmail);
  } catch (err) {
    // Silencioso — no bloquear el flujo de login exitoso por un error aquí
    console.error("[RateLimiter] Error en clearRateLimit:", err);
  }
}
