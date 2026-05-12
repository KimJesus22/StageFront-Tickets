"use server";

import { insforge } from "@/lib/insforge";

// ============================================================================
// 🎟️ Módulo de Concurrencia de Asientos (Lazy Release)
// ============================================================================

const LOCK_MINUTES = 10;

/**
 * 🔒 lockSeats — Algoritmo de Lazy Release
 * Intenta reservar temporalmente un grupo de asientos.
 * Si alguien más los tomó milisegundos antes, hace un rollback.
 */
export async function lockSeats(
  seatIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!seatIds || seatIds.length === 0) {
    return { success: false, error: "No se proporcionaron asientos." };
  }

  const now = new Date();
  const lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60000);

  try {
    // ── 1. Intento Atómico de Bloqueo ─────────────────────────────────────
    // Condición: status = 'disponible' O (status = 'reservado_temporal' Y expirado)
    const orCondition = `status.eq.disponible,and(status.eq.reservado_temporal,locked_until.lt.${now.toISOString()})`;

    const { data: updatedSeats, error: updateError } = await insforge.database
      .from("tickets_inventory")
      .update({
        status: "reservado_temporal",
        locked_until: lockedUntil.toISOString(),
      })
      .in("id", seatIds)
      .or(orCondition)
      .select("id");

    if (updateError) {
      console.error("[lockSeats] Error de BD:", updateError.message);
      return { success: false, error: "Error interno al procesar los asientos." };
    }

    // ── 2. Verificación de Concurrencia (Rollback) ────────────────────────
    if (!updatedSeats || updatedSeats.length !== seatIds.length) {
      // Alguien nos ganó uno o más asientos. Debemos liberar los que sí logramos bloquear.
      const acquiredIds = updatedSeats?.map((s) => s.id) || [];
      
      if (acquiredIds.length > 0) {
        await insforge.database
          .from("tickets_inventory")
          .update({
            status: "disponible",
            locked_until: null,
          })
          .in("id", acquiredIds);
      }

      return {
        success: false,
        error: "Algunos asientos ya no están disponibles. Alguien más los acaba de reservar.",
      };
    }

    // ── 3. Éxito ──────────────────────────────────────────────────────────
    return { success: true };
  } catch (err) {
    console.error("[lockSeats] Error inesperado:", err);
    return { success: false, error: "Error al asegurar tus asientos." };
  }
}

/**
 * ✅ confirmPurchase — Pago completado
 * Marca los asientos como ocupados de forma permanente.
 */
export async function confirmPurchase(
  seatIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!seatIds || seatIds.length === 0) return { success: false };

  try {
    const { error } = await insforge.database
      .from("tickets_inventory")
      .update({
        status: "ocupado",
        locked_until: null, // Ya no necesita lock
      })
      .in("id", seatIds);

    if (error) {
      console.error("[confirmPurchase] Error:", error.message);
      return { success: false, error: "No se pudo confirmar la compra en el inventario." };
    }

    return { success: true };
  } catch (err) {
    console.error("[confirmPurchase] Error:", err);
    return { success: false, error: "Error al confirmar la compra." };
  }
}

/**
 * 📡 getSeats — Fetch inteligente con Lazy Mapping
 * Retorna todos los asientos de un evento. Si encuentra un asiento bloqueado
 * cuyo tiempo ya expiró, lo manda al frontend como 'disponible'.
 * Esto evita CRON jobs pesados en la base de datos (Optimización O(n) al vuelo).
 */
export async function getSeats(
  eventId: string
) {
  try {
    const { data, error } = await insforge.database
      .from("tickets_inventory")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      throw error;
    }

    if (!data) return [];

    const now = new Date();

    // Mapeo Inteligente (Lazy Mapping)
    const mappedSeats = data.map((seat: any) => {
      if (
        seat.status === "reservado_temporal" &&
        seat.locked_until &&
        new Date(seat.locked_until) < now
      ) {
        // En la BD sigue como 'reservado_temporal', pero lógicamente
        // para el frontend (y para nuestro lockSeats) ya está 'disponible'.
        return { ...seat, status: "disponible" };
      }
      return seat;
    });

    return mappedSeats;
  } catch (err) {
    console.error("[getSeats] Error:", err);
    return [];
  }
}
