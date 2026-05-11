// ============================================================================
// 🎯 PAYMENT CONTEXT — Orquestador del patrón Strategy
// ============================================================================
//
// Este módulo es el ÚNICO punto de contacto entre el componente de checkout
// y el sistema de pagos. El componente no sabe ni necesita saber qué
// pasarela se está usando internamente.
//
// Para cambiar de pasarela en producción:
//   → Solo modifica getDefaultStrategy() o configura PAYMENT_PROVIDER en .env
//
// ============================================================================

import {
  PaymentStrategy,
  PaymentRequest,
  PaymentResult,
  SeatData,
  PaymentFormData,
} from "./PaymentStrategy";
import { MockPaymentStrategy } from "./MockPaymentStrategy";
// import { StripeStrategy } from "./StripeStrategy";  // Descomentar para producción

// ---------------------------------------------------------------------------
// Factory: Seleccionar estrategia según configuración
// ---------------------------------------------------------------------------

/**
 * Retorna la estrategia de pago según la variable de entorno PAYMENT_PROVIDER.
 *
 * Valores soportados:
 *   - "mock" (default) → MockPaymentStrategy
 *   - "stripe"         → StripeStrategy
 *
 * Para añadir una nueva pasarela:
 *   1. Crea una clase que extienda PaymentStrategy
 *   2. Añade un case aquí
 *   3. Configura PAYMENT_PROVIDER en .env.local
 */
function getDefaultStrategy(): PaymentStrategy {
  const provider = process.env.PAYMENT_PROVIDER || "mock";

  switch (provider) {
    case "stripe":
      // return new StripeStrategy();
      // Mientras no esté configurado, fallback a mock con warning:
      console.warn(
        "[PaymentContext] Stripe solicitado pero no implementado aún. Usando MockPayment."
      );
      return new MockPaymentStrategy();

    case "mock":
    default:
      return new MockPaymentStrategy();
  }
}

// ---------------------------------------------------------------------------
// Core function: processCheckoutInternal
// ---------------------------------------------------------------------------

/**
 * Procesa el pago completo usando la estrategia configurada.
 * This is the internal implementation — called from the server action wrapper.
 */
export async function processCheckoutInternal(
  seats: SeatData[],
  eventId: string,
  formData: PaymentFormData
): Promise<PaymentResult> {
  // Validaciones de negocio (independientes de la pasarela)
  if (!seats || seats.length === 0) {
    return {
      success: false,
      orderId: null,
      transactionId: null,
      errorMessage: "No se seleccionaron asientos",
      metadata: { phase: "pre-validation" },
    };
  }

  if (!eventId) {
    return {
      success: false,
      orderId: null,
      transactionId: null,
      errorMessage: "ID de evento no proporcionado",
      metadata: { phase: "pre-validation" },
    };
  }

  // Calcular total del lado del servidor (no confiar en el cliente)
  const totalAmount = seats.reduce((sum, s) => sum + s.precio, 0);
  const serviceFee = totalAmount * 0.15;
  const grandTotal = totalAmount + serviceFee;

  // Construir request estandarizado
  const request: PaymentRequest = {
    seats,
    eventId,
    formData,
    totalAmount: grandTotal,
  };

  // Obtener estrategia y procesar
  const strategy = getDefaultStrategy();

  console.log(
    `[PaymentContext] Usando estrategia: ${strategy.getName()} | ` +
      `Provider: ${strategy.getProvider()} | ` +
      `Boletos: ${seats.length} | Total: $${grandTotal.toFixed(2)}`
  );

  return strategy.process(request);
}
