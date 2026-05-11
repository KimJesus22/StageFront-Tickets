// ============================================================================
// 🧪 MOCK PAYMENT STRATEGY — Pasarela simulada (desarrollo/demo)
// ============================================================================
//
// Implementación actual que simula un procesamiento de pago exitoso.
// Inserta tickets y órdenes en la base de datos real (InsForge).
// Simula un delay de 2 segundos para emular latencia de pasarela.
//
// ============================================================================


import {
  PaymentStrategy,
  PaymentFormData,
  PaymentRequest,
  PaymentResult,
} from "./PaymentStrategy";
import { insforge } from "@/lib/insforge";
import { getSession } from "@/lib/actions/auth";

export class MockPaymentStrategy extends PaymentStrategy {
  getName(): string {
    return "MockPayment";
  }

  getProvider(): string {
    return "mock";
  }

  validatePaymentData(data: PaymentFormData): void {
    // En mock, validamos formato básico sin rechazar por valores inválidos
    const cardDigits = data.cardNumber.replace(/\s/g, "");

    if (cardDigits.length < 13 || cardDigits.length > 19) {
      throw new Error(
        "Número de tarjeta inválido. Debe tener entre 13 y 19 dígitos."
      );
    }

    if (!/^\d{2}\/\d{2}$/.test(data.expiry)) {
      throw new Error("Fecha de vencimiento inválida. Formato: MM/YY");
    }

    if (data.cvc.length < 3 || data.cvc.length > 4) {
      throw new Error("CVC inválido. Debe tener 3 o 4 dígitos.");
    }
  }

  protected async processPayment(
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // 1. Verificar sesión del usuario
    const session = await getSession();
    if (!session?.email || !session?.name) {
      return {
        success: false,
        orderId: null,
        transactionId: null,
        errorMessage: "Usuario no autenticado",
        metadata: {},
      };
    }

    // 2. Simular latencia de pasarela real (1.5–2.5s)
    const simulatedDelay = 1500 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

    // 3. Generar transaction ID simulado
    const transactionId = `mock_txn_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // 4. Insertar tickets y órdenes en la base de datos
    let firstOrderId: string | null = null;

    for (const seat of request.seats) {
      const uniqueSeatNumber = `${seat.label} - ${Math.floor(
        Math.random() * 1000000
      )}`;

      // Insertar ticket
      const { data: ticket, error: ticketError } = await insforge.database
        .from("tickets_inventory")
        .insert({
          event_id: request.eventId,
          zone: seat.zona,
          seat_number: uniqueSeatNumber,
          price: seat.precio,
          status: "vendido",
        })
        .select("id")
        .single();

      if (ticketError || !ticket) {
        console.error("[MockPayment] Error insertando ticket:", ticketError);
        return {
          success: false,
          orderId: null,
          transactionId,
          errorMessage: "Error al registrar el boleto en inventario",
          metadata: { dbError: ticketError?.message },
        };
      }

      // Insertar orden
      const { data: order, error: orderError } = await insforge.database
        .from("orders")
        .insert({
          user_name: session.name,
          user_email: session.email,
          ticket_id: ticket.id,
          amount_paid: seat.precio,
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("[MockPayment] Error insertando orden:", orderError);
        return {
          success: false,
          orderId: null,
          transactionId,
          errorMessage: "Error al registrar la orden de compra",
          metadata: { dbError: orderError?.message },
        };
      }

      if (!firstOrderId) {
        firstOrderId = order.id;
      }
    }

    return {
      success: true,
      orderId: firstOrderId,
      transactionId,
      errorMessage: null,
      metadata: {
        seatsProcessed: request.seats.length,
        userName: session.name,
        simulatedDelay: Math.round(simulatedDelay),
      },
    };
  }
}
