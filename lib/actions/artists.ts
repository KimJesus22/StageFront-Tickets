"use server";

import { insforge } from "@/lib/insforge";
import type { Artist } from "@/lib/types/database";

/**
 * Obtiene la lista completa de artistas desde InsForge.
 * Se usa como Server Action en Server Components.
 */
export async function getArtists(): Promise<Artist[]> {
  const { data, error } = await insforge.database
    .from("artists")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error al obtener artistas:", error);
    return [];
  }

  return (data as Artist[]) ?? [];
}

/**
 * Obtiene un artista por su slug.
 */
export async function getArtistBySlug(
  slug: string
): Promise<Artist | null> {
  const { data, error } = await insforge.database
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener artista:", error);
    return null;
  }

  return (data as Artist) ?? null;
}
