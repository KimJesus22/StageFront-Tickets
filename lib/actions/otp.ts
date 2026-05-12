"use server";

// ============================================================================
// 🔑 OTP Service — Generación segura de códigos para fila virtual
// ============================================================================
//
// Genera códigos OTP de 6 dígitos criptográficamente seguros para validar
// la posición de un usuario en la fila virtual de un evento.
//
// Seguridad:
//   • crypto.randomInt() — CSPRNG del kernel del SO (no Math.random())
//   • SHA-256 hash — el texto plano NUNCA se almacena en la DB
//   • Expiración a 5 minutos — ventana temporal reducida
//   • Invalidación de OTPs previos — solo 1 código activo por (user, event)
//
// ============================================================================

import crypto from "crypto";
import { insforge } from "@/lib/insforge";

// ── Constantes ──────────────────────────────────────────────────────────────
const OTP_EXPIRY_MINUTES = 5;
const OTP_MIN = 100000; // 6 dígitos: rango [100000, 999999]
const OTP_MAX = 999999;
const MAX_OTP_ATTEMPTS = 5;

// ============================================================================
// 🎲 generateAndSendOTP — Genera, hashea, almacena y "envía" un OTP
// ============================================================================
//
// Flujo:
//   1. Invalida cualquier OTP activo previo para el par (userId, eventId).
//   2. Genera un código de 6 dígitos con crypto.randomInt (CSPRNG).
//   3. Hashea el código con SHA-256 (nunca se guarda el texto plano).
//   4. Calcula expiración: now + 5 minutos.
//   5. Inserta el registro hasheado en event_otps.
//   6. Simula el envío del código en texto plano (console.log / email).
//   7. Retorna { success: true } al frontend.
//
// @param userId  — ID del usuario autenticado
// @param eventId — ID del evento para el que se solicita el OTP
// @returns { success: boolean; error?: string }
// ============================================================================

export async function generateAndSendOTP(
  userId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  // ── Validación de entrada ─────────────────────────────────────────────
  if (!userId || !eventId) {
    return { success: false, error: "Datos incompletos para generar el OTP." };
  }

  try {
    // ── 1. Invalidar OTPs previos activos ─────────────────────────────────
    // Garantiza que solo exista 1 código válido por (user, event).
    // Marcamos used_at = NOW() en vez de DELETE para mantener el audit trail.
    await insforge.database
      .from("event_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .is("used_at", null);

    // ── 2. Generar código de 6 dígitos (CSPRNG) ──────────────────────────
    const otpPlaintext = crypto.randomInt(OTP_MIN, OTP_MAX + 1).toString();

    // ── 3. Hashear con SHA-256 (nunca almacenar texto plano) ─────────────
    const otpHash = crypto
      .createHash("sha256")
      .update(otpPlaintext)
      .digest("hex");

    // ── 4. Calcular expiración (now + 5 minutos) ────────────────────────
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // ── 5. Insertar registro hasheado en la DB ──────────────────────────
    const { error: insertError } = await insforge.database
      .from("event_otps")
      .insert({
        user_id: userId,
        event_id: eventId,
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("[OTP] Error al insertar:", insertError.message);
      return { success: false, error: "No se pudo generar el código. Inténtalo de nuevo." };
    }

    // ── 6. "Envío" del código en texto plano ────────────────────────────
    // TODO: Reemplazar con proveedor de email real (SendGrid, Resend, etc.)
    console.log(
      `[OTP] 📧 Código para usuario=${userId} evento=${eventId}: ${otpPlaintext} (expira en ${OTP_EXPIRY_MINUTES} min)`
    );

    // ── 7. Retorno exitoso ──────────────────────────────────────────────
    return { success: true };
  } catch (err) {
    console.error("[OTP] Error inesperado:", err);
    return { success: false, error: "Error al generar el código de verificación." };
  }
}

// ============================================================================
// 🛡️ OTPValidator — Encapsulación y Reglas de Negocio (POO)
// ============================================================================
interface OTPRecord {
  id: number;
  otp_hash: string;
  expires_at: string;
  attempts: number;
}

class OTPValidator {
  private record: OTPRecord;

  constructor(record: OTPRecord) {
    this.record = record;
  }

  // Complejidad O(1) en acceso a propiedad
  public isLocked(): boolean {
    return this.record.attempts >= MAX_OTP_ATTEMPTS;
  }

  public isExpired(): boolean {
    return new Date(this.record.expires_at) < new Date();
  }

  public verifyHash(inputCode: string): boolean {
    const inputHash = crypto
      .createHash("sha256")
      .update(inputCode.trim())
      .digest("hex");
    return inputHash === this.record.otp_hash;
  }

  public async burnCode(): Promise<void> {
    await insforge.database
      .from("event_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", this.record.id);
  }

  // Incremento atómico simulado (en una única llamada a update) y verificación
  public async handleFailedAttempt(): Promise<{ locked: boolean; remaining: number }> {
    const newAttempts = this.record.attempts + 1;
    const isNowLocked = newAttempts >= MAX_OTP_ATTEMPTS;
    
    // Si falla y llega a 5 intentos, quemamos el código inmediatamente
    const updatePayload: any = { attempts: newAttempts };
    if (isNowLocked) {
      updatePayload.used_at = new Date().toISOString();
    }

    await insforge.database
      .from("event_otps")
      .update(updatePayload)
      .eq("id", this.record.id);

    return {
      locked: isNowLocked,
      remaining: Math.max(0, MAX_OTP_ATTEMPTS - newAttempts)
    };
  }
}

// ============================================================================
// ✅ validateOTP — Validación delegada a la clase OTPValidator
// ============================================================================
export async function validateOTP(
  userId: string,
  eventId: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !eventId || !inputCode) {
    return { success: false, error: "Datos incompletos para la verificación." };
  }

  try {
    // ── 1. BÚSQUEDA — O(1) por índice ────────────────────────────────────
    const { data, error: selectError } = await insforge.database
      .from("event_otps")
      .select("id, otp_hash, expires_at, attempts")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectError) {
      console.error("[OTP] Error en búsqueda:", selectError.message);
      return { success: false, error: "Error al verificar el código." };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "No hay un código activo." };
    }

    // Instanciamos nuestra clase de seguridad
    const validator = new OTPValidator(data[0] as OTPRecord);

    // ── 2. EXPIRACIÓN ────────────────────────────────────────────────────
    if (validator.isExpired()) {
      await validator.burnCode();
      return {
        success: false,
        error: "El código ha expirado tras 5 minutos. Solicita uno nuevo.",
      };
    }

    // ── 3. BLOQUEO PREVIO ────────────────────────────────────────────────
    if (validator.isLocked()) {
      return {
        success: false,
        error: "Has agotado tus 5 intentos permitidos. Por seguridad, este código ha sido invalidado. Solicita uno nuevo.",
      };
    }

    // ── 4. VERIFICACIÓN DE HASH ──────────────────────────────────────────
    if (!validator.verifyHash(inputCode)) {
      const { locked, remaining } = await validator.handleFailedAttempt();
      
      if (locked) {
        return {
          success: false,
          error: "Has agotado tus 5 intentos permitidos. Por seguridad, este código ha sido invalidado. Solicita uno nuevo.",
        };
      }

      return {
        success: false,
        error: `Código incorrecto. ${remaining} intento${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}.`,
      };
    }

    // ── 5. CORRECTO → QUEMAR (anti-replay) ───────────────────────────────
    await validator.burnCode();

    return { success: true };
  } catch (err) {
    console.error("[OTP] Error inesperado en validateOTP:", err);
    return { success: false, error: "Error al verificar el código." };
  }
}
