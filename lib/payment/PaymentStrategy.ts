// ============================================================================
// 💳 PAYMENT STRATEGY — Patrón Strategy para pasarelas de pago
// ============================================================================
//
// Arquitectura:
//   PaymentStrategy (abstract)
//     ├── MockPaymentStrategy   ← actual (desarrollo/demo)
//     ├── StripeStrategy         ← preparada (producción)
//     └── [futuras]              ← PayPal, MercadoPago, etc.
//
// El componente de checkout NO sabe cómo se paga; solo llama process().
//
// ============================================================================

// ---------------------------------------------------------------------------
// Tipos compartidos
// ---------------------------------------------------------------------------

/** Datos de un asiento seleccionado */
export interface SeatData {
  id: string;
  zona: string;
  label: string;
  tipo: string;
  precio: number;
}

/** Datos del formulario de pago capturados en la UI */
export interface PaymentFormData {
  cardNumber: string;
  expiry: string;
  cvc: string;
  country: string;
  state: string;
}

/** Resultado estandarizado del procesamiento de pago */
export interface PaymentResult {
  /** Si el pago fue exitoso */
  success: boolean;
  /** ID de la orden generada (si fue exitoso) */
  orderId: string | null;
  /** ID de transacción de la pasarela */
  transactionId: string | null;
  /** Mensaje de error (si falló) */
  errorMessage: string | null;
  /** Metadata adicional de la pasarela */
  metadata: Record<string, unknown>;
}

/** Configuración necesaria para procesar un pago */
export interface PaymentRequest {
  seats: SeatData[];
  eventId: string;
  formData: PaymentFormData;
  /** Monto total pre-calculado (por validación del servidor) */
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Clase abstracta: PaymentStrategy
// ---------------------------------------------------------------------------

/**
 * Clase base abstracta que define el contrato para cualquier pasarela de pago.
 *
 * Todas las implementaciones concretas deben:
 *  1. Implementar `processPayment()` con la lógica específica de la pasarela
 *  2. Implementar `validatePaymentData()` para validación pre-procesamiento
 *  3. Implementar `getName()` para identificación en logs y UI
 *
 * @example
 * ```ts
 * const strategy = new MockPaymentStrategy();
 * const result = await strategy.process(request);
 * ```
 */
export abstract class PaymentStrategy {
  /**
   * Nombre legible de la estrategia (para logs y UI).
   */
  abstract getName(): string;

  /**
   * Identificador de la pasarela (para analytics y persistencia).
   */
  abstract getProvider(): string;

  /**
   * Valida los datos del formulario de pago ANTES de procesarlo.
   * Lanza un error descriptivo si la validación falla.
   *
   * @throws Error si la validación falla
   */
  abstract validatePaymentData(data: PaymentFormData): void;

  /**
   * Lógica interna de procesamiento — implementada por cada estrategia.
   *
   * @internal Solo se llama desde `process()`, nunca directamente.
   */
  protected abstract processPayment(
    request: PaymentRequest
  ): Promise<PaymentResult>;

  /**
   * Método público que orquesta el flujo completo de pago:
   *  1. Validación de datos
   *  2. Log de inicio
   *  3. Procesamiento (delegado a la implementación concreta)
   *  4. Log de resultado
   *
   * Este es el ÚNICO método que el componente de checkout debe llamar.
   */
  async process(request: PaymentRequest): Promise<PaymentResult> {
    const startTime = Date.now();

    // 1. Validación previa
    try {
      this.validatePaymentData(request.formData);
    } catch (err) {
      return {
        success: false,
        orderId: null,
        transactionId: null,
        errorMessage:
          err instanceof Error ? err.message : "Datos de pago inválidos",
        metadata: { provider: this.getProvider(), phase: "validation" },
      };
    }

    // 2. Log de inicio
    console.log(
      `[${this.getName()}] Procesando pago de $${request.totalAmount} para ${request.seats.length} boleto(s)...`
    );

    // 3. Procesamiento
    try {
      const result = await this.processPayment(request);

      // 4. Log de resultado
      const elapsed = Date.now() - startTime;
      if (result.success) {
        console.log(
          `[${this.getName()}] ✅ Pago exitoso en ${elapsed}ms — Orden: ${result.orderId}`
        );
      } else {
        console.warn(
          `[${this.getName()}] ❌ Pago fallido en ${elapsed}ms — ${result.errorMessage}`
        );
      }

      // Enriquecer metadata
      result.metadata = {
        ...result.metadata,
        provider: this.getProvider(),
        processingTimeMs: elapsed,
      };

      return result;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      console.error(
        `[${this.getName()}] 💥 Error inesperado en ${elapsed}ms:`,
        err
      );

      return {
        success: false,
        orderId: null,
        transactionId: null,
        errorMessage:
          err instanceof Error
            ? err.message
            : "Error inesperado al procesar el pago",
        metadata: {
          provider: this.getProvider(),
          phase: "processing",
          processingTimeMs: elapsed,
        },
      };
    }
  }
}
