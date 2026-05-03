"use server";

import { insforge } from "@/lib/insforge";
import { redirect } from "next/navigation";

/**
 * Procesa el pago de un boleto simulando una pasarela y confirma la orden.
 */
export async function processPayment(ticketId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  
  if (!name || !email) {
    throw new Error("Nombre y correo son requeridos.");
  }

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

  // 3. Insertar la orden en la base de datos
  const { error: orderError } = await insforge.database
    .from("orders")
    .insert({
      user_name: name,
      user_email: email,
      ticket_id: ticketId,
      amount_paid: ticket.price,
    });

  if (orderError) {
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

  // 5. Redirigir a la página de éxito
  redirect("/success");
}
