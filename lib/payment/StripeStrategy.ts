// ============================================================================
// 💰 STRIPE PAYMENT STRATEGY — Pasarela Stripe (preparada para producción)
// ============================================================================
//
// Estructura lista para integrar Stripe cuando se active en producción.
//
// Para activar:
//   1. npm install stripe @stripe/stripe-js
//   2. Configurar STRIPE_SECRET_KEY y STRIPE_PUBLISHABLE_KEY en .env.local
//   3. Cambiar la estrategia en PaymentContext
//
// ============================================================================


import {
  PaymentStrategy,
  PaymentFormData,
  PaymentRequest,
  PaymentResult,
} from "./PaymentStrategy";

/**
 * Stripe Payment Strategy.
 *
 * Actualmente es un stub que define la estructura exacta
 * de la integración con Stripe. Cuando se active, se debe:
 *
 * 1. Crear un PaymentIntent en el servidor con Stripe SDK
 * 2. Confirmar el pago en el cliente con Stripe Elements
 * 3. Verificar el resultado via webhook
 *
 * @see https://stripe.com/docs/payments/payment-intents
 */
export class StripeStrategy extends PaymentStrategy {
  // private stripe: Stripe;

  constructor() {
    super();
    // Descomentar cuando se instale stripe:
    // this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    //   apiVersion: '2024-04-10',
    // });
  }

  getName(): string {
    return "Stripe";
  }

  getProvider(): string {
    return "stripe";
  }

  validatePaymentData(data: PaymentFormData): void {
    // Stripe Elements maneja su propia validación en el cliente.
    // Aquí solo validamos que los campos no estén vacíos.
    if (!data.cardNumber || data.cardNumber.replace(/\s/g, "").length < 13) {
      throw new Error("Número de tarjeta requerido");
    }

    if (!data.expiry) {
      throw new Error("Fecha de expiración requerida");
    }

    if (!data.cvc || data.cvc.length < 3) {
      throw new Error("CVC requerido");
    }
  }

  protected async processPayment(
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // ───────────────────────────────────────────────────────────
    // IMPLEMENTACIÓN FUTURA — Stripe PaymentIntent Flow
    // ───────────────────────────────────────────────────────────
    //
    // El flujo completo será:
    //
    // 1. Crear PaymentIntent en el servidor:
    //    const paymentIntent = await this.stripe.paymentIntents.create({
    //      amount: Math.round(request.totalAmount * 100), // centavos
    //      currency: 'mxn',
    //      metadata: {
    //        eventId: request.eventId,
    //        seatCount: request.seats.length.toString(),
    //      },
    //    });
    //
    // 2. Confirmar en el cliente (vía Stripe.js):
    //    const { error, paymentIntent } = await stripe.confirmCardPayment(
    //      clientSecret, { payment_method: { card: elements.getElement('card') } }
    //    );
    //
    // 3. Verificar resultado:
    //    if (paymentIntent.status === 'succeeded') {
    //      // Insertar tickets y órdenes en la DB
    //      // ...similar a MockPaymentStrategy
    //    }
    //
    // 4. Webhook de respaldo (para pagos asíncronos):
    //    POST /api/webhooks/stripe → verificar firma → actualizar orden
    //
    // ───────────────────────────────────────────────────────────

    // Por ahora retornamos un error informativo
    return {
      success: false,
      orderId: null,
      transactionId: null,
      errorMessage:
        "Stripe no está configurado. Configura STRIPE_SECRET_KEY en .env.local para activar esta pasarela.",
      metadata: {
        hint: "Instala stripe con: npm install stripe @stripe/stripe-js",
        docsUrl: "https://stripe.com/docs/payments/payment-intents",
      },
    };
  }
}
