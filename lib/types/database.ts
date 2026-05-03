// ============================================================
// Tipos de la base de datos de StageFront Tickets
// ============================================================
// Estos tipos reflejan el esquema SQL de InsForge.
// Actualízalos si modificas las tablas.

export type TicketStatus = "disponible" | "bloqueado" | "vendido";
export type EventStatus =
  | "programado"
  | "en_venta"
  | "agotado"
  | "cancelado"
  | "finalizado";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  genre: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
}

export interface Event {
  id: string;
  artist_id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  status: EventStatus;
  image_url: string | null;
  created_at: string;
}

export interface TicketInventory {
  id: string;
  event_id: string;
  zone: string;
  seat_number: string;
  price: number;
  status: TicketStatus;
  created_at: string;
}

// ============================================================
// Tipos con relaciones (para queries con JOINs)
// ============================================================

export interface EventWithArtist extends Event {
  artists: Artist;
}

export interface TicketWithEvent extends TicketInventory {
  events: EventWithArtist;
}
