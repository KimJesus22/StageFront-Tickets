"use server";

import { insforge } from "@/lib/insforge";
import { redirect } from "next/navigation";
import { getSession } from "./auth";

/**
 * Procesa el pago de un boleto simulando una pasarela y confirma la orden.
 */
export async function processPayment(ticketId: string, formData: FormData) {
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
    const uniqueSeatNumber = `${seat.label} - ${Math.floor(Math.random() * 1000000)}`;

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

    if (ticketError || !ticket) {
      console.error(ticketError);
      throw new Error("Error inserting ticket");
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
      console.error(orderError);
      throw new Error("Error inserting order");
    }

    if (!firstOrderId) {
      firstOrderId = order.id;
    }
  }

  return firstOrderId;
}
