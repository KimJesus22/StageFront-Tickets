import { createClient } from "@insforge/sdk";

// ============================================================================
// 🔒 TIPADO DE BASE DE DATOS
// ============================================================================
//
// Cuando tengas tablas creadas en InsForge, define aquí tus tipos para
// obtener autocompletado y seguridad de tipos en todas las operaciones CRUD.
//
// Ejemplo de cómo definir los tipos de tu base de datos:
//
//   export interface Database {
//     events: {
//       id: string;
//       artist_id: string;
//       title: string;
//       venue: string;
//       city: string;
//       date: string;
//       price_min: number;
//       price_max: number;
//       total_seats: number;
//       available_seats: number;
//       image_url: string | null;
//       created_at: string;
//     };
//     artists: {
//       id: string;
//       name: string;
//       slug: string;
//       genre: string;
//       image_url: string | null;
//     };
//     tickets: {
//       id: string;
//       event_id: string;
//       user_id: string;
//       seat_number: string;
//       status: "reserved" | "paid" | "cancelled";
//       purchased_at: string;
//     };
//   }
//
// Luego, al hacer consultas puedes tipar los resultados:
//
//   const { data } = await insforge.database
//     .from("events")
//     .select() as { data: Database["events"][] | null; error: Error | null };
//
// ============================================================================

// ---------------------------------------------------------------------------
// Validación de variables de entorno
// ---------------------------------------------------------------------------

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!insforgeUrl) {
  throw new Error(
    "❌ Falta la variable de entorno NEXT_PUBLIC_INSFORGE_URL.\n" +
      "   Asegúrate de que exista en tu archivo .env.local"
  );
}

if (!insforgeAnonKey) {
  throw new Error(
    "❌ Falta la variable de entorno NEXT_PUBLIC_INSFORGE_ANON_KEY.\n" +
      "   Genera tu anon key con la herramienta MCP: get-anon-key"
  );
}

// ---------------------------------------------------------------------------
// Cliente público (Anon Key)
// ---------------------------------------------------------------------------
// ✅ Úsalo en: Server Components, Client Components, Route Handlers
// ⚠️ Las operaciones están limitadas por las políticas RLS de tu base de datos
//
// Ejemplo de uso:
//   import { insforge } from "@/lib/insforge";
//
//   const { data, error } = await insforge.database
//     .from("events")
//     .select()
//     .eq("artist_slug", "bts");

export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});

// ---------------------------------------------------------------------------
// Cliente administrativo (API Key)
// ---------------------------------------------------------------------------
// 🔐 SOLO para uso en el SERVIDOR (Route Handlers, Server Actions)
// ❌ NUNCA importar en Client Components ("use client")
//
// Ejemplo de uso:
//   import { insforgeAdmin } from "@/lib/insforge";
//
//   // Dentro de un Route Handler (app/api/...)
//   const { data, error } = await insforgeAdmin.database
//     .from("tickets")
//     .insert({ user_id: "...", event_id: "...", seat_number: "A12" })
//     .select();

const insforgeAdminKey = process.env.INSFORGE_ADMIN_API_KEY;

export const insforgeAdmin = insforgeAdminKey
  ? createClient({
      baseUrl: insforgeUrl,
      anonKey: insforgeAdminKey,
    })
  : null;
