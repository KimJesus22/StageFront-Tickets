"use server";

import { insforge } from "@/lib/insforge";
import type { Event, Artist, EventWithArtist } from "@/lib/types/database";
import { getArtistBySlug } from "./artists";

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
