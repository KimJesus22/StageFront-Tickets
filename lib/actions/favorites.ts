"use server";

import { insforge } from "@/lib/insforge";
import { revalidatePath } from "next/cache";

/**
 * Alterna el estado de favorito para una entidad.
 * Si existe, la borra (DELETE). Si no, la crea (INSERT).
 * Funciona de manera atómica silenciando violaciones UNIQUE por doble clic rápido.
 */
export async function toggleFavorite(entityType: "artist" | "event" | "venue", entityId: string) {
  // 1. Verificación de sesión del usuario
  const { data: { user }, error: authError } = await insforge.auth.getUser();
  
  if (authError || !user) {
    throw new Error("No estás autenticado. Por favor inicia sesión.");
  }

  // 2. Consulta para ver si ya existe
  const { data: existing, error: findError } = await insforge.database
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .single();

  if (existing) {
    // 3. Existe: Hacemos un DELETE
    const { error: deleteError } = await insforge.database
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      console.error("[toggleFavorite] Error al borrar:", deleteError);
      throw new Error("No se pudo quitar de favoritos");
    }

    revalidatePath("/favorites");
    return { success: true, isFavorite: false };
  } else {
    // 4. No existe: Hacemos un INSERT envuelto en try/catch para colisiones
    try {
      const { error: insertError } = await insforge.database
        .from("favorites")
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
        });

      // El error de unicidad es 23505 en PostgreSQL
      if (insertError) {
        if (insertError.code === "23505") {
           // Violación unique_user_favorite ignorada silenciosamente
           return { success: true, isFavorite: true };
        }
        console.error("[toggleFavorite] Error al insertar:", insertError);
        throw new Error("No se pudo agregar a favoritos");
      }

      revalidatePath("/favorites");
      return { success: true, isFavorite: true };
    } catch (e) {
      console.error("[toggleFavorite] Excepción:", e);
      throw new Error("Error inesperado en el servidor");
    }
  }
}

/**
 * Obtiene todos los favoritos del usuario uniendo (JOIN) con eventos y artistas.
 */
export async function getUserFavorites(userId?: string) {
  let targetUserId = userId;
  
  if (!targetUserId) {
    const { data } = await insforge.auth.getUser();
    targetUserId = data?.user?.id;
  }

  if (!targetUserId) return { artists: [], events: [] };

  // Obtener todos los favoritos raw
  const { data: favs, error } = await insforge.database
    .from("favorites")
    .select("*")
    .eq("user_id", targetUserId);

  if (error || !favs) return { artists: [], events: [] };

  const artistIds = favs.filter(f => f.entity_type === "artist").map(f => f.entity_id);
  const eventIds = favs.filter(f => f.entity_type === "event").map(f => f.entity_id);

  // Obtener detalles de Artistas
  let artists = [];
  if (artistIds.length > 0) {
    const { data: artistsData } = await insforge.database
      .from("artists")
      .select("*")
      .in("id", artistIds);
    artists = artistsData || [];
  }

  // Obtener detalles de Eventos
  let events = [];
  if (eventIds.length > 0) {
    const { data: eventsData } = await insforge.database
      .from("events")
      .select("*, artists(*)")
      .in("id", eventIds);
    events = eventsData || [];
  }

  return { artists, events };
}
