"use server";

import { insforge } from "@/lib/insforge";
import type { Artist } from "@/lib/types/database";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "./auth";

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

// ============================================================================
// Funciones Administrativas (CRUD)
// ============================================================================

export async function createArtist(formData: FormData) {
  try {
    await verifyAdmin();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const is_active = formData.get("is_active") === "true";

    if (!name || name.trim() === "") {
      return { success: false, message: "El nombre del artista es requerido." };
    }

    try {
      new URL(image_url);
    } catch {
      return { success: false, message: "La URL de la imagen no es válida." };
    }

    // Slug generation simple
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const { error } = await insforge.database
      .from("artists")
      .insert({
        name,
        slug,
        description,
        image_url,
        is_active,
      });

    if (error) {
      console.error("[createArtist] Error de DB:", error);
      return { success: false, message: "Error al crear el artista en la base de datos." };
    }

    revalidatePath("/admin/artists");
    return { success: true, message: "Artista creado exitosamente." };
  } catch (err) {
    return { success: false, message: "No autorizado." };
  }
}

export async function updateArtist(id: string, formData: FormData) {
  try {
    await verifyAdmin();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const is_active = formData.get("is_active") === "true";

    if (image_url) {
      try {
        new URL(image_url);
      } catch {
        return { success: false, message: "La URL de la imagen no es válida." };
      }
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (image_url) updates.image_url = image_url;
    if (formData.has("is_active")) updates.is_active = is_active;

    const { error } = await insforge.database
      .from("artists")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[updateArtist] Error de DB:", error);
      return { success: false, message: "Error al actualizar el artista." };
    }

    revalidatePath("/admin/artists");
    return { success: true, message: "Artista actualizado." };
  } catch (err) {
    return { success: false, message: "No autorizado." };
  }
}

export async function toggleArtistStatus(id: string, currentStatus: boolean) {
  try {
    await verifyAdmin();

    const newStatus = !currentStatus;

    const { error } = await insforge.database
      .from("artists")
      .update({ is_active: newStatus })
      .eq("id", id);

    if (error) {
      console.error("[toggleArtistStatus] Error:", error);
      return { success: false, message: "Error al cambiar el estado." };
    }

    revalidatePath("/admin/artists");
    return { success: true, message: "Estado actualizado." };
  } catch (err) {
    return { success: false, message: "No autorizado." };
  }
}
