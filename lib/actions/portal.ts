"use server";

import { insforgeAdmin } from "@/lib/insforge";

export async function getArtistDashboardData(artistId: string) {
  if (!insforgeAdmin) throw new Error("InsForge admin client not configured");

  // 1. Get events for this artist
  const { data: events, error: eventsError } = await insforgeAdmin.database
    .from("events")
    .select("*")
    .eq("artist_id", artistId)
    .order("date", { ascending: true });

  if (eventsError) throw eventsError;

  if (!events || events.length === 0) {
    return {
      totalIncome: 0,
      soldTickets: 0,
      availableTickets: 0,
      totalTickets: 0,
      soldPercentage: 0,
      events: []
    };
  }

  const eventIds = events.map((e) => e.id);

  // 2. Get all tickets for these events
  const { data: tickets, error: ticketsError } = await insforgeAdmin.database
    .from("tickets_inventory")
    .select("id, status, price, event_id")
    .in("event_id", eventIds);

  if (ticketsError) throw ticketsError;

  const ticketIds = tickets?.map((t) => t.id) || [];

  // 3. Get all orders for these tickets to calculate exact income
  let totalIncome = 0;
  if (ticketIds.length > 0) {
    const { data: orders, error: ordersError } = await insforgeAdmin.database
      .from("orders")
      .select("amount_paid")
      .in("ticket_id", ticketIds);

    if (!ordersError && orders) {
      totalIncome = orders.reduce((sum, order) => sum + Number(order.amount_paid || 0), 0);
    }
  }

  // 4. Calculate ticket counts and percentages
  const soldTickets = tickets?.filter((t) => t.status === "vendido").length || 0;
  const availableTickets = tickets?.filter((t) => t.status === "disponible").length || 0;
  const totalTickets = tickets?.length || 0;
  const soldPercentage = totalTickets === 0 ? 0 : Math.round((soldTickets / totalTickets) * 100);

  // 5. Build per-event stats
  const eventsWithStats = events.map((event) => {
    const eventTickets = tickets?.filter((t) => t.event_id === event.id) || [];
    const eventTotal = eventTickets.length;
    const eventSold = eventTickets.filter((t) => t.status === "vendido").length;
    const eventPercentage = eventTotal === 0 ? 0 : Math.round((eventSold / eventTotal) * 100);
    
    return {
      ...event,
      totalTickets: eventTotal,
      soldTickets: eventSold,
      soldPercentage: eventPercentage,
    };
  });

  return {
    totalIncome,
    soldTickets,
    availableTickets,
    totalTickets,
    soldPercentage,
    events: eventsWithStats,
  };
}
