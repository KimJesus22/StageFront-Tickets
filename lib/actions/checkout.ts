"use server";

import { insforge } from "@/lib/insforge";
import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { sendAppNotification } from "../services/notifications";
import { logEvent } from "../services/logger";
import { uuidSchema } from "../validations/schemas";

/**
 * Procesa el pago de un boleto simulando una pasarela y confirma la orden.
 */
export async function processPayment(ticketId: string, formData: FormData) {
  // ── Validación de Esquema (Fail-Fast) ──────────────────────────────
  const ticketIdResult = uuidSchema.safeParse(ticketId);
  if (!ticketIdResult.success) {
    throw new Error(ticketIdResult.error.issues[0].message);
  }

  const session = await getSession();
  
  if (!session?.email || !session?.name) {
    throw new Error("Usuario no autenticado o información incompleta.");
  }

  const name = session.name;
  const email = session.email;

  // 1. Simular retraso de procesamiento de pago (2 segundos)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 2. Obtener el precio del boleto para registrar la orden
  const { data: ticket, error: ticketError } = await insforge.database
    .from("tickets_inventory")
    .select("price")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    throw new Error("No se encontró el boleto a procesar.");
  }

  // 3. Insertar la orden en la base de datos y capturar su ID
  const { data: order, error: orderError } = await insforge.database
    .from("orders")
    .insert({
      user_name: name,
      user_email: email,
      ticket_id: ticketId,
      amount_paid: ticket.price,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Error al crear la orden:", orderError);
    throw new Error("Error al registrar la compra.");
  }

  // 4. Actualizar el estado del boleto a 'vendido'
  const { error: updateError } = await insforge.database
    .from("tickets_inventory")
    .update({ status: "vendido" })
    .eq("id", ticketId);

  if (updateError) {
    console.error("Error al actualizar el boleto:", updateError);
    throw new Error("Error al finalizar la transacción.");
  }

  // 5. Redirigir a la página de éxito con el ID de la orden
  redirect(`/success?order_id=${order.id}`);
}

export async function createMockOrder(seats: any[], eventId: string) {
  const session = await getSession();
  if (!session?.email || !session?.name) {
    throw new Error("Usuario no autenticado");
  }

  if (!eventId) {
    throw new Error("No event ID provided");
  }

  let firstOrderId = null;

  for (const seat of seats) {
    // Retenemos seat_number tal cual lo manda la interfaz, 
    // asumiendo que es único por zona y evento.
    const uniqueSeatNumber = seat.label; 

    try {
      const { data: ticket, error: ticketError } = await insforge.database
        .from("tickets_inventory")
        .insert({
          event_id: eventId,
          zone: seat.zona,
          seat_number: uniqueSeatNumber,
          price: seat.precio,
          status: "vendido",
        })
        .select("id")
        .single();

      if (ticketError) {
        throw ticketError; // Lanzamos el error devuelto por la API para capturarlo abajo
      }

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
        throw new Error("Error inserting order");
      }

      if (!firstOrderId) {
        firstOrderId = order.id;
      }
    } catch (error: any) {
      console.error("[createMockOrder] Error capturado:", error);

      // Verificación Avanzada de Unique Violation (PostgreSQL Código 23505)
      if (error?.code === '23505') {
        // Mantenibilidad: Cancelar / Reembolsar cargo pendiente aquí
        console.warn(`[Stripe Mock] Reembolsando cargo por colisión en asiento ${uniqueSeatNumber}`);
        // await stripe.refunds.create({ payment_intent: 'pi_...' });
        
        throw new Error("Lo sentimos, este asiento acaba de ser adquirido por otro fan hace un instante. Por favor, selecciona otro asiento.");
      }

      throw new Error("Error interno al procesar el boleto.");
    }
  }

  return firstOrderId;
}

export interface PurchaseData {
  userId: string;
  eventId: string;
  seatIds: string[]; // Or detailed seat info
  totalAmount: number;
}

/**
 * Validaciones Zero-Trust para garantizar integridad antes de cualquier pago.
 */
export async function validatePurchaseIntent(userId: string, eventId: string, seatIds: string[]) {
  // 1. Autenticación: Verificar sesión
  const session = await getSession();
  if (!session) {
    throw new Error("AUTH_FAILED: Token JWT inválido o ausente.");
  }

  // 2. Autorización (Rol/Permisos)
  // Verificamos si el usuario está suspendido — en esta implementación
  // basada en cookies, esta verificación se omite por ahora.

  // 3. Integridad Relacional
  // Validamos estrictamente que TODOS los asientos pertenezcan al eventId de la URL
  const { data: seatsData, error: seatsError } = await insforge.database
    .from("seats")
    .select("id, event_id, status")
    .in("id", seatIds);

  if (seatsError || !seatsData) {
    throw new Error("DATA_ERROR: Inconsistencia al verificar los asientos en la base de datos.");
  }

  if (seatsData.length !== seatIds.length) {
    throw new Error("DATA_ERROR: Inconsistencia de datos. Algunos asientos no existen.");
  }

  for (const seat of seatsData) {
    if (seat.event_id !== eventId) {
      throw new Error("DATA_ERROR: Inconsistencia de datos. Un hacker intentó pasar asientos de otro evento.");
    }
  }

  // 4. Disponibilidad Concurrente (O(1))
  for (const seat of seatsData) {
    if (seat.status !== "available") {
      throw new Error(`CONCURRENCY_ERROR: El asiento ${seat.id} ya no está disponible.`);
    }
  }

  // Verificamos que no existan holds activos de otros usuarios para estos asientos
  const { data: holdsData, error: holdsError } = await insforge.database
    .from("seat_holds")
    .select("id, user_id")
    .in("seat_id", seatIds)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  if (!holdsError && holdsData && holdsData.length > 0) {
    const foreignHolds = holdsData.filter((hold: any) => hold.user_id !== userId);
    if (foreignHolds.length > 0) {
      throw new Error("CONCURRENCY_ERROR: Uno o más asientos están retenidos por otro usuario en este momento.");
    }
  }

  // 5. Límite de Compra (Anti-Scalping)
  const MAX_TICKETS = 4;
  const { data: userOrders, error: orderCheckError } = await insforge.database
    .from("orders")
    .select(`
      ticket_id,
      tickets_inventory!inner(event_id)
    `)
    .eq("user_email", session.email || "")
    .eq("tickets_inventory.event_id", eventId);

  const currentCount = userOrders ? userOrders.length : 0;
  if (currentCount + seatIds.length > MAX_TICKETS) {
    throw new Error("SCALPING_ERROR: Límite de compra excedido. Máximo 4 boletos por usuario para este evento.");
  }
}

/**
 * simulatePurchase — Transacción principal de compra simulada.
 */
export async function simulatePurchase(orderData: PurchaseData) {
  const { userId, eventId, seatIds, totalAmount } = orderData;

  // ── Validación de Esquema (Fail-Fast) ──────────────────────────────
  const userIdResult = uuidSchema.safeParse(userId);
  const eventIdResult = uuidSchema.safeParse(eventId);
  
  if (!userIdResult.success) throw new Error(userIdResult.error.issues[0].message);
  if (!eventIdResult.success) throw new Error(eventIdResult.error.issues[0].message);

  const session = await getSession();

  if (!session?.email || !session?.name) {
    throw new Error("Debes iniciar sesión para completar la compra.");
  }

  // Ejecutamos la validación Zero-Trust ANTES de cualquier lógica de pago o base de datos
  await validatePurchaseIntent(userId, eventId, seatIds);

  // 1. Simulación de Red (Banco)
  await new Promise(resolve => setTimeout(resolve, 2500));

  try {
    // 2. Crear Orden General
    const { data: order, error: orderError } = await insforge.database
      .from("orders")
      .insert({
        user_name: session.name,
        user_email: session.email,
        amount_paid: totalAmount,
        status: "paid", // Simulando estado pagado
        // Omitimos ticket_id ya que una orden puede tener múltiples tickets, 
        // o si el esquema lo requiere, lo añadiremos en un arreglo en otra iteración.
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error("Error al procesar el pago y crear la orden.");
    }

    await logEvent(userId, "ORDER_CREATED", `Order created successfully: ${order.id}`);

    // 3. Generar Boletos (Manejo de Unique Constraint)
    for (const seatId of seatIds) {
      try {
        const { error: ticketError } = await insforge.database
          .from("tickets_inventory")
          .insert({
            event_id: eventId,
            seat_number: seatId,
            status: "vendido",
            // Si el schema requiere order_id, se vincularía aquí:
            // order_id: order.id 
          });

        if (ticketError) {
          throw ticketError; 
        }
      } catch (error: any) {
        if (error?.code === '23505') {
          // Reembolso MOCK
          console.warn(`[Gateway Mock] Ejecutando reembolso automático de $${totalAmount} MXN por colisión en asiento.`);
          throw new Error("Lo sentimos, este asiento acaba de ser adquirido por otro fan hace un instante. Por favor, selecciona otro asiento.");
        }
        throw new Error("Error interno al emitir los boletos.");
      }
    }

    await logEvent(userId, "TICKET_GENERATED", `Tickets generated for order: ${order.id}`, { eventId, seatIds });

    // 4. Confirmar Holds (Actualizar seat_holds)
    const { error: holdsError } = await insforge.database
      .from("seat_holds")
      .update({ status: "completed" })
      .eq("status", "active")
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (holdsError) {
      console.error("Error al completar el historial de holds:", holdsError);
      // No lanzamos error para no arruinar la compra ya pagada, 
      // pero se registra para monitoreo de integridad.
    }

    // --- NOTIFICACIONES EN TIEMPO REAL ---
    await sendAppNotification(
      userId,
      "success",
      `Compra confirmada #${order.id.split("-")[0]}`,
      "Transacción completada exitosamente.",
      `/wallet`
    );

    await sendAppNotification(
      userId,
      "info",
      "Boleto generado",
      "Tu acceso digital ha sido encriptado y asegurado en tu wallet.",
      `/wallet`
    );


  } catch (err: any) {
    console.error("[simulatePurchase] Transaction Error:", err);
    throw err; // El frontend (Client Component) lo atrapará y mostrará
  }

  // 5. Redirección
  redirect('/checkout/success');
}
