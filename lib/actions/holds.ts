"use server";

import { insforge } from "@/lib/insforge";

/**
 * 🔒 createHold — Algoritmo de Lazy Release
 * Intenta bloquear los asientos solicitados por 10 minutos.
 * Si alguno ya está bloqueado y vigente, lanza un error para evitar concurrencia.
 */
export async function createHold(userId: string, eventId: string, seatIds: string[]) {
  if (!seatIds || seatIds.length === 0) {
    throw new Error("No se proporcionaron asientos.");
  }

  const now = new Date();

  // 1. Validación (Lazy Release)
  const { data: activeHolds, error: checkError } = await insforge.database
    .from("seat_holds")
    .select("seat_id")
    .in("seat_id", seatIds)
    .eq("status", "active")
    .gt("expires_at", now.toISOString());

  if (checkError) {
    console.error("[createHold] Error al validar concurrencia:", checkError);
    throw new Error("Error interno al validar asientos.");
  }

  // Si hay algún resultado, significa que están bloqueados activamente por alguien más
  if (activeHolds && activeHolds.length > 0) {
    throw new Error("Uno o más asientos acaban de ser tomados");
  }

  // 2. Transacción de Inserción
  const expiresAt = new Date(now.getTime() + 10 * 60000).toISOString();
  
  const holdsToInsert = seatIds.map((seatId) => ({
    user_id: userId,
    event_id: eventId,
    seat_id: seatId,
    status: "active",
    expires_at: expiresAt,
  }));

  const { error: insertError } = await insforge.database
    .from("seat_holds")
    .insert(holdsToInsert);

  if (insertError) {
    console.error("[createHold] Error al insertar holds:", insertError);
    throw new Error("Error al bloquear los asientos temporalmente.");
  }

  return { success: true, expiresAt };
}

/**
 * 🧹 cleanExpiredHolds — Costo 0
 * Función perezosa (lazy) para liberar los locks expirados.
 * En lugar de cronjobs, corre justo antes de devolver los asientos del mapa.
 */
export async function cleanExpiredHolds() {
  const now = new Date().toISOString();

  try {
    const { error } = await insforge.database
      .from("seat_holds")
      .update({ status: "released" })
      .eq("status", "active")
      .lt("expires_at", now);

    if (error) {
      console.error("[cleanExpiredHolds] Error al limpiar expirados:", error);
    }
  } catch (err) {
    console.error("[cleanExpiredHolds] Excepción:", err);
  }
}

/**
 * ✅ confirmHold — Confirmación de compra
 * Cambia el estatus de los holds a 'completed' para el registro histórico,
 * una vez que el usuario completó el pago de manera exitosa.
 */
export async function confirmHold(userId: string, eventId: string) {
  try {
    const { error } = await insforge.database
      .from("seat_holds")
      .update({ status: "completed" })
      .eq("status", "active")
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (error) {
      console.error("[confirmHold] Error al confirmar:", error);
      throw new Error("No se pudieron confirmar los holds en el historial.");
    }

    return { success: true };
  } catch (err) {
    console.error("[confirmHold] Excepción:", err);
    throw err;
  }
}
