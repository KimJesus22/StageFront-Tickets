"use server";

import { insforge } from "@/lib/insforge";
import type { Event, Artist, EventWithArtist } from "@/lib/types/database";
import { getArtistBySlug } from "./artists";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "./auth";

/**
 * Obtiene todos los eventos programados para un artista basado en su slug.
 */
export async function getEventsByArtistSlug(
  slug: string
): Promise<{ artist: Artist | null; events: Event[] }> {
  // 1. Obtener el artista por su slug
  const artist = await getArtistBySlug(slug);

  if (!artist) {
    return { artist: null, events: [] };
  }

  // 2. Obtener los eventos de ese artista
  const { data, error } = await insforge.database
    .from("events")
    .select("*")
    .eq("artist_id", artist.id)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error al obtener eventos del artista:", error);
    return { artist, events: [] };
  }

  return { artist, events: (data as Event[]) ?? [] };
}

/**
 * Obtiene todos los eventos futuros (activos) con su artista correspondiente.
 * Se usa para la página de cartelera /events.
 */
export async function getAllUpcomingEvents(): Promise<EventWithArtist[]> {
  const { data, error } = await insforge.database
    .from("events")
    .select(`
      *,
      artists (*)
    `)
    .in("status", ["en_venta", "programado", "agotado"])
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true });

  if (error) {
    console.error("Error al obtener la cartelera de eventos:", error);
    return [];
  }

  return (data as EventWithArtist[]) ?? [];
}

/**
 * Obtiene eventos filtrados basados en SearchParams de URL.
 */
export async function getFilteredEvents(params: {
  status?: string;
  min_price?: string;
  max_price?: string;
  q?: string;
  date?: string;
}): Promise<EventWithArtist[]> {
  // Construimos la base, si hay filtro de precio necesitamos inner join con zones
  const hasPriceFilter = params.min_price || params.max_price;
  
  let query = insforge.database
    .from("events")
    .select(
      hasPriceFilter
        ? "*, artists!inner (*), zones!inner(price)"
        : "*, artists!inner (*)"
    );

  // Estatus
  if (params.status === 'ON_SALE') {
    query = query.eq("status", "en_venta");
  } else if (params.status === 'UPCOMING') {
    query = query.eq("status", "programado");
  } else {
    query = query.in("status", ["en_venta", "programado", "agotado"]);
  }

  // Texto (Ciudad/Artista)
  if (params.q && params.q.trim() !== '') {
    const term = `%${params.q.trim()}%`;
    query = query.or(`city.ilike.${term},artists.name.ilike.${term}`);
  }

  // Fecha
  if (params.date) {
    query = query.gte("date", params.date);
  } else {
    query = query.gte("date", new Date().toISOString());
  }

  // Precio (BETWEEN) usando foreign table filtering
  if (params.min_price) {
    query = query.gte("zones.price", params.min_price);
  }
  if (params.max_price) {
    query = query.lte("zones.price", params.max_price);
  }

  const { data, error } = await query.order("date", { ascending: true });

  if (error) {
    console.error("[getFilteredEvents] Error:", error);
    return [];
  }

  // Si cruzamos con zones, PostgreSQL puede devolver filas duplicadas por cada zona. 
  // Deduplicamos los eventos en memoria por ID (O(n)).
  if (hasPriceFilter && data) {
    const uniqueEvents = new Map();
    for (const item of (data as any[])) {
      if (!uniqueEvents.has(item.id)) {
        uniqueEvents.set(item.id, item);
      }
    }
    return Array.from(uniqueEvents.values()) as EventWithArtist[];
  }

  return (data as any as EventWithArtist[]) ?? [];
}

/**
 * Obtiene los eventos destacados para la landing page.
 * Como no existe columna is_featured, usamos los más próximos (limit 4)
 * con su artista embebido.
 */
export async function getFeaturedEvents(
  limit = 4
): Promise<EventWithArtist[]> {
  const { data, error } = await insforge.database
    .from("events")
    .select(`
      *,
      artists (*)
    `)
    .in("status", ["en_venta", "programado"])
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error al obtener eventos destacados:", error);
    return [];
  }

  return (data as EventWithArtist[]) ?? [];
}

// ============================================================================
// Funciones Administrativas (CRUD)
// ============================================================================

/**
 * Valida que el mapa de precios tenga un formato JSON correcto.
 * Se espera: { "NombreZona": PrecioNumerico, ... }
 */
function validatePriceMap(priceMapStr: string | null): Record<string, number> {
  if (!priceMapStr) return {};
  try {
    const parsed = JSON.parse(priceMapStr);
    const validated: Record<string, number> = {};
    
    // Verificar que sea un objeto
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      throw new Error("Formato de precios inválido");
    }

    // Verificar que cada llave sea string y cada valor sea numérico
    for (const [zone, price] of Object.entries(parsed)) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        throw new Error(`Precio inválido para la zona: ${zone}`);
      }
      validated[zone] = numericPrice;
    }
    return validated;
  } catch (err) {
    throw new Error("El mapa de precios debe ser un JSON válido con montos numéricos.");
  }
}

/**
 * Crea un nuevo evento en el sistema.
 */
export async function createEvent(formData: FormData) {
  // Seguridad: RBAC - Lanza error si no es admin
  await verifyAdmin();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string; // Fecha completa o ISO string
  const image_url = formData.get("image_url") as string;
  const is_active = formData.get("is_active") === "true";
  const priceMapStr = formData.get("price_map") as string;
  const artist_id = formData.get("artist_id") as string; // Requerido para relacionarlo

  const price_map = validatePriceMap(priceMapStr);

  const { data, error } = await insforge.database
    .from("events")
    .insert({
      title,
      description,
      date,
      image_url,
      is_active,
      price_map,
      artist_id,
      // Status fallback asumiendo el tipo anterior (opcional si es db fallback)
      status: is_active ? "en_venta" : "programado" 
    })
    .select()
    .single();

  if (error) {
    console.error("[createEvent] Error:", error);
    throw new Error("Error al crear el evento en la base de datos.");
  }

  // Caché: Revalidar ambas rutas para impacto inmediato
  revalidatePath("/admin/events");
  revalidatePath("/events");

  return data;
}

/**
 * Actualiza un evento existente.
 */
export async function updateEvent(eventId: string, formData: FormData) {
  // Seguridad: RBAC - Lanza error si no es admin
  await verifyAdmin();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const image_url = formData.get("image_url") as string;
  const is_active = formData.get("is_active") === "true";
  const priceMapStr = formData.get("price_map") as string;

  const updates: any = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (date) updates.date = date;
  if (image_url) updates.image_url = image_url;
  if (formData.has("is_active")) updates.is_active = is_active;
  if (priceMapStr) updates.price_map = validatePriceMap(priceMapStr);

  const { data, error } = await insforge.database
    .from("events")
    .update(updates)
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    console.error("[updateEvent] Error:", error);
    throw new Error("Error al actualizar el evento.");
  }

  // Caché y revalidación
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/event/${eventId}`);

  return data;
}

/**
 * Mutación rápida para alternar el estado activo/inactivo de un evento.
 */
export async function toggleEventStatus(eventId: string, currentStatus: boolean) {
  // Seguridad: RBAC - Lanza error si no es admin
  await verifyAdmin();

  const newStatus = !currentStatus;

  const { data, error } = await insforge.database
    .from("events")
    .update({ 
      is_active: newStatus,
      // Sincronizar campo enum legacy de ser necesario
      status: newStatus ? "en_venta" : "programado" 
    })
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    console.error("[toggleEventStatus] Error:", error);
    throw new Error("Error al cambiar el estado del evento.");
  }

  // Caché y revalidación inmediata
  revalidatePath("/admin/events");
  revalidatePath("/events");

  return data;
}
