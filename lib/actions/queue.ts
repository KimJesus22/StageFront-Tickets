"use server";

// ============================================================================
// 🎫 Queue Server Actions — Fila Virtual
// ============================================================================
//
// Todas las operaciones de la Fila Virtual se ejecutan aquí en el servidor.
// Esto evita:
//   1. Exposición del admin client al navegador
//   2. Errores "Failed to fetch" por llamadas SDK desde el cliente
//   3. Throws crudos que causan errores de red genéricos
//
// Cada función retorna un objeto { success, data?, error? } para que el
// frontend pueda mostrar mensajes amigables en lugar de errores de red.
// ============================================================================

import { cookies } from "next/headers";
import { insforge } from "@/lib/insforge";
import {
  joinQueue,
  getQueuePosition,
  executeCycle,
  reportLatency,
  isUserAdmitted,
} from "@/lib/queue-engine";
import { sendAppNotification } from "@/lib/services/notifications";

// ---------------------------------------------------------------------------
// Tipo de retorno unificado para todas las acciones
// ---------------------------------------------------------------------------

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Helper: obtener sesión del cookie (server-side)
// ---------------------------------------------------------------------------

async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("insforge_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Enviar OTP (resend verification email)
// ---------------------------------------------------------------------------
// Se extrae del client component para que la llamada al SDK se haga en el
// servidor, evitando el error "Failed to fetch" causado por restricciones
// CORS o problemas de red del SDK cuando se ejecuta en el navegador.
// ---------------------------------------------------------------------------

export async function sendQueueOtp(): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const session = await getSessionFromCookie();

    if (!session?.email) {
      return {
        success: false,
        error: "Debes iniciar sesión para continuar.",
      };
    }

    const { error } = await insforge.auth.resendVerificationEmail({
      email: session.email,
    });

    if (error) {
      console.error("[sendQueueOtp] SDK error:", error.message);
      return {
        success: false,
        error: error.message || "No se pudo enviar el código de verificación.",
      };
    }

    return { success: true, data: { sent: true } };
  } catch (err) {
    console.error("[sendQueueOtp] Error inesperado:", err);
    return {
      success: false,
      error: "Error interno del servidor. Intenta de nuevo en unos segundos.",
    };
  }
}

// ---------------------------------------------------------------------------
// 2. Verificar OTP y unirse a la fila
// ---------------------------------------------------------------------------

export async function verifyOtpAndJoinQueue(
  eventId: string,
  otpCode: string
): Promise<ActionResult<{
  position: number;
  batchNumber: number;
  totalInQueue: number;
  estimatedWaitSeconds: number;
  statusMessage: string;
  cycleState: {
    currentK: number;
    secondsUntilNextCycle: number;
    healthStatus: string;
    lastBatchSize: number;
  };
}>> {
  try {
    const session = await getSessionFromCookie();

    if (!session?.email || !session?.id) {
      return {
        success: false,
        error: "Debes iniciar sesión para continuar.",
      };
    }

    if (!eventId) {
      return {
        success: false,
        error: "ID de evento no proporcionado.",
      };
    }

    if (!otpCode || otpCode.length < 6) {
      return {
        success: false,
        error: "Código de verificación inválido.",
      };
    }

    const IS_DEV = process.env.NODE_ENV === "development";
    const DEV_MASTER_CODE = "741963";
    const DEV_FAST_CODE = "111222";
    
    const isDevBypass = IS_DEV && otpCode === DEV_MASTER_CODE;
    const isFastBypass = IS_DEV && otpCode === DEV_FAST_CODE;

    if (!isDevBypass && !isFastBypass) {
      // Verificar OTP via SDK
      const { error: verifyError } = await insforge.auth.verifyEmail({
        email: session.email,
        otp: otpCode,
      });

      if (verifyError) {
        return {
          success: false,
          error: verifyError.message || "Código inválido. Intenta de nuevo.",
        };
      }
    }

    // OTP válido → unirse a la fila
    const position = joinQueue(eventId, session.id, session.email);

    return {
      success: true,
      data: {
        position: position.position,
        batchNumber: position.batchNumber,
        totalInQueue: position.totalInQueue,
        estimatedWaitSeconds: position.estimatedWaitSeconds,
        statusMessage: position.statusMessage,
        cycleState: {
          currentK: position.cycleState.currentK,
          secondsUntilNextCycle: position.cycleState.secondsUntilNextCycle,
          healthStatus: position.cycleState.healthStatus,
          lastBatchSize: position.cycleState.lastBatchSize,
        },
      },
    };
  } catch (err) {
    console.error("[verifyOtpAndJoinQueue] Error inesperado:", err);
    return {
      success: false,
      error: "Error interno del servidor. Intenta de nuevo.",
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Consultar posición en la fila
// ---------------------------------------------------------------------------

export async function getQueueStatus(
  eventId: string
): Promise<ActionResult<{
  admitted: boolean;
  position: number;
  batchNumber: number;
  totalInQueue: number;
  estimatedWaitSeconds: number;
  statusMessage: string;
  cycleState: {
    currentK: number;
    secondsUntilNextCycle: number;
    healthStatus: string;
    lastBatchSize: number;
  };
}>> {
  try {
    const session = await getSessionFromCookie();

    if (!session?.id) {
      return {
        success: false,
        error: "No autorizado.",
      };
    }

    if (!eventId) {
      return {
        success: false,
        error: "ID de evento no proporcionado.",
      };
    }

    // Verificar si ya fue admitido
    const admitted = isUserAdmitted(eventId, session.id);
    if (admitted) {
      return {
        success: true,
        data: {
          admitted: true,
          position: 0,
          batchNumber: 0,
          totalInQueue: 0,
          estimatedWaitSeconds: 0,
          statusMessage: "¡Es tu turno! Redirigiendo al mapa de asientos...",
          cycleState: {
            currentK: 150,
            secondsUntilNextCycle: 0,
            healthStatus: "optimal",
            lastBatchSize: 0,
          },
        },
      };
    }

    const position = getQueuePosition(eventId, session.id);

    return {
      success: true,
      data: {
        admitted: false,
        position: position.position,
        batchNumber: position.batchNumber,
        totalInQueue: position.totalInQueue,
        estimatedWaitSeconds: position.estimatedWaitSeconds,
        statusMessage: position.statusMessage,
        cycleState: {
          currentK: position.cycleState.currentK,
          secondsUntilNextCycle: position.cycleState.secondsUntilNextCycle,
          healthStatus: position.cycleState.healthStatus,
          lastBatchSize: position.cycleState.lastBatchSize,
        },
      },
    };
  } catch (err) {
    console.error("[getQueueStatus] Error inesperado:", err);
    return {
      success: false,
      error: "Error al consultar el estado de la fila.",
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Ejecutar ciclo de desfogue
// ---------------------------------------------------------------------------

export async function triggerQueueCycle(
  eventId: string
): Promise<ActionResult<{ cycleExecuted: boolean; admittedCount: number }>> {
  try {
    if (!eventId) {
      return { success: false, error: "ID de evento no proporcionado." };
    }

    // Simular latencia (en producción esto sería una query real)
    const simulatedLatency = Math.floor(Math.random() * 300) + 50;
    reportLatency(eventId, simulatedLatency);

    const admittedIds = executeCycle(eventId);

    // Enviar notificaciones sin bloquear
    for (const admittedId of admittedIds) {
      sendAppNotification(
        admittedId,
        "warning",
        "¡Tu turno está cerca!",
        "Prepárate, eres el siguiente en la fila para la zona VIP.",
        `/event/${eventId}/seats`
      );
    }

    return {
      success: true,
      data: {
        cycleExecuted: true,
        admittedCount: admittedIds.length,
      },
    };
  } catch (err) {
    console.error("[triggerQueueCycle] Error inesperado:", err);
    return {
      success: false,
      error: "Error al ejecutar el ciclo de desfogue.",
    };
  }
}
