"use server";

import { insforge } from "@/lib/insforge";

export async function searchEvents(query: string, filters: { startDate?: string; category?: string } = {}) {
  let dbQuery = insforge.database
    .from("v_search_events")
    .select("*")
    // Solo mostramos eventos válidos
    .in("status", ["en_venta", "programado", "agotado"]);

  // Algoritmo SQL: Búsqueda Multicriterio con ILIKE
  if (query && query.trim() !== "") {
    const q = `%${query.trim()}%`;
    dbQuery = dbQuery.or(`title.ilike.${q},artist_name.ilike.${q},city.ilike.${q},venue_name.ilike.${q}`);
  }

  // Filtro de Fecha: event_date >= startDate
  if (filters.startDate) {
    dbQuery = dbQuery.gte("date", filters.startDate);
  } else {
    // Por defecto ocultar eventos pasados
    dbQuery = dbQuery.gte("date", new Date().toISOString());
  }

  const { data, error } = await dbQuery.order("date", { ascending: true }).limit(20);

  if (error) {
    console.error("[searchEvents] Error:", error);
    return [];
  }

  return data ?? [];
}
