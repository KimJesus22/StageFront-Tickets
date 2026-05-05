"use server";

import { insforgeAdmin } from "@/lib/insforge";

export async function getDashboardStats() {
  if (!insforgeAdmin) {
    throw new Error("Admin SDK not initialized");
  }

  // 1. Obtener todos los montos para calcular totales (Revenue & Count)
  // Nota: En producción masiva, se recomendaría usar una función RPC en PostgreSQL para el SUM.
  const { data: allOrders, error: statsError } = await insforgeAdmin.database
    .from("orders")
    .select("amount_paid");

  if (statsError) {
    console.error("Error fetching stats:", statsError);
    throw new Error("Error obteniendo estadísticas");
  }

  const totalTicketsSold = allOrders.length;
  const totalRevenue = allOrders.reduce((acc, order) => acc + (order.amount_paid || 0), 0);

  // 2. Obtener los 5 pedidos más recientes con JOIN
  const { data: recentOrders, error: recentError } = await insforgeAdmin.database
    .from("orders")
    .select(`
      *,
      tickets_inventory (
        zone,
        seat_number,
        events (
          title
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  // 3. Obtener eventos
  const { data: events, error: eventsError } = await insforgeAdmin.database
    .from("events")
    .select(`*, artists(name)`)
    .order("date", { ascending: false });

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
  }

  // 4. Conteo de usuarios
  const { count: usersCount } = await insforgeAdmin.database
    .from("users")
    .select("*", { count: "exact", head: true });

  const activeEventsCount = events?.filter(e => e.status !== "Past" && e.status !== "Cancelled").length || 0;

  return {
    totalTicketsSold,
    totalRevenue,
    recentOrders: recentOrders || [],
    events: events || [],
    activeEventsCount,
    usersCount: usersCount || 0,
  };
}

export async function createNewEvent(formData: FormData) {
  if (!insforgeAdmin) {
    return { error: "Admin SDK not initialized" };
  }

  const title = formData.get("title") as string;
  const artistName = formData.get("artist") as string;
  const venue = formData.get("venue") as string;
  const dateStr = formData.get("date") as string;
  const basePriceStr = formData.get("basePrice") as string;
  
  try {
    // 1. Find or create Artist
    let artistId = null;
    const { data: existingArtist } = await insforgeAdmin.database
      .from("artists")
      .select("id")
      .ilike("name", `%${artistName}%`)
      .limit(1)
      .single();

    if (existingArtist) {
      artistId = existingArtist.id;
    } else {
      const slug = artistName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data: newArtist, error: artistError } = await insforgeAdmin.database
        .from("artists")
        .insert({ name: artistName, slug, genre: "Various" })
        .select("id")
        .single();
      
      if (artistError) throw artistError;
      artistId = newArtist.id;
    }

    // 2. Insert Event
    // Parse venue format if it contains comma (e.g. "Arena, City")
    const venueParts = venue.split(",");
    const eventVenue = venueParts[0].trim();
    const eventCity = venueParts.length > 1 ? venueParts[1].trim() : "Unknown City";

    const { error: eventError } = await insforgeAdmin.database
      .from("events")
      .insert({
        title,
        artist_id: artistId,
        venue: eventVenue,
        city: eventCity,
        date: new Date(dateStr).toISOString(),
        status: "Published",
      });

    if (eventError) {
      throw eventError;
    }

    // Nota: en un flujo completo, aquí se generarían los tickets_inventory
    // base_price se usaría para crear los asientos.

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error al crear evento:", error);
    return { error: error.message || "Error al crear el evento" };
  }
}

