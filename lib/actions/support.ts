"use server";

import { insforgeAdmin } from "@/lib/insforge";

export async function submitSupportTicket(formData: FormData) {
  if (!insforgeAdmin) throw new Error("InsForge admin client no configurado");

  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const mensaje = formData.get("mensaje") as string;

  if (!nombre || !email || !mensaje) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }

  const { error } = await insforgeAdmin.database
    .from("support_tickets")
    .insert([{ nombre, email, mensaje, estado: "pendiente" }]);

  if (error) {
    console.error("Error submitting support ticket:", error);
    return { success: false, error: "Ocurrió un error al enviar tu solicitud. Intenta nuevamente." };
  }

  return { success: true };
}
