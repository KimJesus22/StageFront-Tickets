"use server";

import { insforge } from "@/lib/insforge";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "./auth";

// ============================================================================
// Funciones de Gestión de Zonas
// ============================================================================

export async function createZone(eventId: string, zoneData: { name: string; color: string; price: number }) {
  await verifyAdmin();

  // Se asume que la estructura de Zones o similar existe o se simula a nivel lógico en DB.
  // Aquí usamos "zones" como convención.
  const { data, error } = await insforge.database
    .from("zones")
    .insert({
      event_id: eventId,
      name: zoneData.name,
      color: zoneData.color,
      price: zoneData.price,
    })
    .select()
    .single();

  if (error) {
    console.error("[createZone] Error:", error);
    throw new Error("Error al crear la zona.");
  }

  revalidatePath(`/admin/inventory/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  return { success: true, data };
}

export async function updateZonePrice(zoneId: string, newPrice: number) {
  await verifyAdmin();

  const { data, error } = await insforge.database
    .from("zones")
    .update({ price: newPrice })
    .eq("id", zoneId)
    .select()
    .single();

  if (error) {
    console.error("[updateZonePrice] Error:", error);
    throw new Error("Error al actualizar el precio de la zona.");
  }

  // Si existe el event_id en el retorno, usamos ese
  if (data?.event_id) {
    revalidatePath(`/events/${data.event_id}`);
    revalidatePath(`/admin/inventory/${data.event_id}`);
  } else {
    // Fallback general
    revalidatePath("/", "layout"); 
  }

  return { success: true, message: "Precio actualizado correctamente" };
}

// ============================================================================
// Funciones de Gestión de Asientos
// ============================================================================

/**
 * Seeding masivo y atómico de asientos.
 * Genera N asientos para una zona y evento específico.
 */
export async function seedSeats(eventId: string, zoneId: string, rows: number, seatsPerRow: number) {
  await verifyAdmin();

  const seatsToInsert = [];

  for (let r = 1; r <= rows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      seatsToInsert.push({
        event_id: eventId,
        zone_id: zoneId,
        row_identifier: `R${r}`,
        seat_identifier: `S${s}`,
        status: "available",
      });
    }
  }

  // Insert masivo en una sola petición a InsForge
  const { error } = await insforge.database
    .from("seats")
    .insert(seatsToInsert);

  if (error) {
    console.error("[seedSeats] Error:", error);
    throw new Error("Error al realizar el seeding de asientos.");
  }

  revalidatePath(`/admin/inventory/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  
  return { success: true, message: `${seatsToInsert.length} asientos creados exitosamente.` };
}

/**
 * Mutación por lote: Bloquear asientos.
 * Ejecuta un UPDATE masivo en O(1) operaciones de red mediante .in().
 */
export async function blockSeats(seatIds: string[]) {
  await verifyAdmin();

  if (!seatIds || seatIds.length === 0) {
    return { success: false, message: "No se seleccionaron asientos." };
  }

  const { error } = await insforge.database
    .from("seats")
    .update({ status: "blocked" })
    .in("id", seatIds);

  if (error) {
    console.error("[blockSeats] Error:", error);
    throw new Error("Error al bloquear los asientos seleccionados.");
  }

  revalidatePath("/", "layout");

  return { success: true, message: `${seatIds.length} asientos bloqueados.` };
}

/**
 * Mutación por lote: Liberar asientos.
 * Ejecuta un UPDATE masivo en O(1) operaciones de red mediante .in().
 */
export async function releaseSeats(seatIds: string[]) {
  await verifyAdmin();

  if (!seatIds || seatIds.length === 0) {
    return { success: false, message: "No se seleccionaron asientos." };
  }

  const { error } = await insforge.database
    .from("seats")
    .update({ status: "available" })
    .in("id", seatIds);

  if (error) {
    console.error("[releaseSeats] Error:", error);
    throw new Error("Error al liberar los asientos seleccionados.");
  }

  revalidatePath("/", "layout");

  return { success: true, message: `${seatIds.length} asientos liberados.` };
}
