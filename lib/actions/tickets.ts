"use server";

import { insforge } from "@/lib/insforge";
import type { TicketInventory, Event } from "@/lib/types/database";
import { logEvent } from "@/lib/services/logger";
import { getSession } from "./auth";

/**
 * Obtiene la información del evento por su ID.
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await insforge.database
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error al obtener evento:", error);
    return null;
  }

  return (data as Event) ?? null;
}

/**
 * Obtiene todos los boletos para un evento específico.
 */
export async function getTicketsByEventId(eventId: string): Promise<TicketInventory[]> {
  const { data, error } = await insforge.database
    .from("tickets_inventory")
    .select("*")
    .eq("event_id", eventId)
    .order("zone", { ascending: true })
    .order("seat_number", { ascending: true });

  if (error) {
    console.error("Error al obtener boletos:", error);
    return [];
  }

  return (data as TicketInventory[]) ?? [];
}

/**
 * Intenta bloquear un boleto para evitar compras duplicadas.
 * Verifica de forma segura (concurrencia) que el boleto siga disponible.
 */
export async function lockTicket(ticketId: string): Promise<{ success: boolean; message: string; ticket?: TicketInventory }> {
  // Para evitar condiciones de carrera, hacemos el UPDATE condicionando a que siga "disponible"
  const { data, error } = await insforge.database
    .from("tickets_inventory")
    .update({ status: "bloqueado" })
    .eq("id", ticketId)
    .eq("status", "disponible")
    .select()
    .single();

  if (error || !data) {
    console.error("Error al bloquear el boleto (o ya no está disponible):", error);
    return { 
      success: false, 
      message: "¡Lo sentimos! Este asiento ya no está disponible. Alguien más lo reservó." 
    };
  }

  const session = await getSession();
  if (session?.id) {
    await logEvent(session.id, "SEAT_RESERVED", `Seat reserved successfully: ${ticketId}`);
  }

  return { 
    success: true, 
    message: "Asiento bloqueado exitosamente. Tienes 5 minutos para completar el pago.",
    ticket: data as TicketInventory
  };
}
