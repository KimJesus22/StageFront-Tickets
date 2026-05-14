"use server";

import { insforge } from "@/lib/insforge";
import { getSession } from "./auth";

// ──────────────────────────────────────────────────────────────
// Tipos para la confirmación de orden
// ──────────────────────────────────────────────────────────────

export interface OrderConfirmation {
  id: string;
  user_name: string;
  user_email: string;
  amount_paid: number;
  created_at: string;
  ticket: {
    id: string;
    zone: string;
    seat_number: string;
    price: number;
    event: {
      id: string;
      title: string;
      venue: string;
      city: string;
      date: string;
      image_url: string | null;
      artist: {
        id: string;
        name: string;
        slug: string;
        genre: string | null;
        image_url: string | null;
      };
    };
  };
}

// ──────────────────────────────────────────────────────────────
// getUserTickets — billetera del usuario
// ──────────────────────────────────────────────────────────────

export async function getUserTickets() {
  const session = await getSession();
  if (!session?.id) {
    return [];
  }

  // Consulta Optimizada (Joins) y Seguridad (Server-Side)
  const { data, error } = await insforge.database
    .from("orders")
    .select(`
      id,
      tickets_inventory (
        id,
        seat_number,
        zone,
        status,
        events (
          id,
          title,
          date,
          venue,
          image_url
        )
      )
    `)
    .eq("user_id", session.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener los boletos del usuario:", error);
    return [];
  }

  return data || [];
}

// ──────────────────────────────────────────────────────────────
// getOrderConfirmation — datos de orden para la página de éxito
// ──────────────────────────────────────────────────────────────

/**
 * Obtiene los datos completos de una orden por su ID,
 * incluyendo el ticket → evento → artista anidados.
 * Se usa en la página /success?order_id=...
 */
export async function getOrderConfirmation(
  orderId: string
): Promise<OrderConfirmation | null> {
  const { data, error } = await insforge.database
    .from("orders")
    .select(`
      id,
      user_name,
      user_email,
      amount_paid,
      created_at,
      tickets_inventory (
        id,
        zone,
        seat_number,
        price,
        events (
          id,
          title,
          venue,
          city,
          date,
          image_url,
          artists (
            id,
            name,
            slug,
            genre,
            image_url
          )
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    console.error("Error al obtener confirmación de orden:", error);
    return null;
  }

  // Normalizamos la forma anidada de InsForge a nuestra interfaz plana
  const raw = data as Record<string, unknown>;
  const ticket = raw.tickets_inventory as Record<string, unknown> | null;
  if (!ticket) return null;

  const event = ticket.events as Record<string, unknown> | null;
  if (!event) return null;

  const artist = event.artists as Record<string, unknown> | null;
  if (!artist) return null;

  return {
    id: raw.id as string,
    user_name: raw.user_name as string,
    user_email: raw.user_email as string,
    amount_paid: raw.amount_paid as number,
    created_at: raw.created_at as string,
    ticket: {
      id: ticket.id as string,
      zone: ticket.zone as string,
      seat_number: ticket.seat_number as string,
      price: ticket.price as number,
      event: {
        id: event.id as string,
        title: event.title as string,
        venue: event.venue as string,
        city: event.city as string,
        date: event.date as string,
        image_url: (event.image_url as string) ?? null,
        artist: {
          id: artist.id as string,
          name: artist.name as string,
          slug: artist.slug as string,
          genre: (artist.genre as string) ?? null,
          image_url: (artist.image_url as string) ?? null,
        },
      },
    },
  };
}

/**
 * Busca TODAS las órdenes del mismo usuario creadas en la misma
 * sesión de compra (mismo user_email, creadas en los últimos 30s
 * respecto a la primera orden). Útil para compras multi-boleto.
 */
export async function getRelatedOrders(
  orderId: string
): Promise<OrderConfirmation[]> {
  // 1. Obtener la orden ancla
  const anchor = await getOrderConfirmation(orderId);
  if (!anchor) return [];

  // 2. Buscar órdenes del mismo usuario para el mismo evento
  const { data, error } = await insforge.database
    .from("orders")
    .select(`
      id,
      user_name,
      user_email,
      amount_paid,
      created_at,
      tickets_inventory (
        id,
        zone,
        seat_number,
        price,
        events (
          id,
          title,
          venue,
          city,
          date,
          image_url,
          artists (
            id,
            name,
            slug,
            genre,
            image_url
          )
        )
      )
    `)
    .eq("user_email", anchor.user_email)
    .order("created_at", { ascending: false });

  if (error || !data) return [anchor];

  // Filtrar solo las del mismo evento
  const eventId = anchor.ticket.event.id;
  const results: OrderConfirmation[] = [];

  for (const raw of data as Record<string, unknown>[]) {
    const ticket = raw.tickets_inventory as Record<string, unknown> | null;
    if (!ticket) continue;
    const event = ticket.events as Record<string, unknown> | null;
    if (!event) continue;
    if ((event.id as string) !== eventId) continue;
    const artist = event.artists as Record<string, unknown> | null;
    if (!artist) continue;

    results.push({
      id: raw.id as string,
      user_name: raw.user_name as string,
      user_email: raw.user_email as string,
      amount_paid: raw.amount_paid as number,
      created_at: raw.created_at as string,
      ticket: {
        id: ticket.id as string,
        zone: ticket.zone as string,
        seat_number: ticket.seat_number as string,
        price: ticket.price as number,
        event: {
          id: event.id as string,
          title: event.title as string,
          venue: event.venue as string,
          city: event.city as string,
          date: event.date as string,
          image_url: (event.image_url as string) ?? null,
          artist: {
            id: artist.id as string,
            name: artist.name as string,
            slug: artist.slug as string,
            genre: (artist.genre as string) ?? null,
            image_url: (artist.image_url as string) ?? null,
          },
        },
      },
    });
  }

  return results.length > 0 ? results : [anchor];
}
