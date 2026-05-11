import { createClient } from "@insforge/sdk";

// ============================================================================
// 🔒 SINGLETON DATABASE CONNECTION — Patrón Singleton via globalThis
// ============================================================================
//
// PROBLEMA:
//   En Next.js, cada hot-reload en desarrollo y cada invocación serverless
//   en producción re-evalúa los módulos, creando NUEVAS instancias del
//   cliente de base de datos. Esto acumula conexiones hasta provocar el
//   error "Too many connections" en planes gratuitos.
//
// SOLUCIÓN:
//   Usar `globalThis` como almacén persistente que sobrevive a:
//     1. Hot Module Replacement (HMR) en desarrollo
//     2. Re-evaluaciones de módulos en serverless (mismo proceso)
//     3. Múltiples imports desde distintos archivos
//
// GARANTÍA:
//   Solo existirá UNA instancia de cada cliente (anon + admin)
//   durante todo el ciclo de vida del proceso Node.js.
//
// COMPLEJIDAD DE MEMORIA:
//   ~0 overhead — solo se reusan los mismos objetos en lugar de crear nuevos.
//
// ============================================================================

// ---------------------------------------------------------------------------
// Tipo para el almacenamiento global (typesafe)
// ---------------------------------------------------------------------------

/**
 * Extendemos globalThis con un símbolo privado para almacenar
 * nuestros singletons sin contaminar el namespace global.
 *
 * El uso de `var` dentro de `declare global` es intencional —
 * es la forma estándar de extender globalThis en TypeScript.
 */
type InsforgeClient = ReturnType<typeof createClient>;

interface InsforgeGlobalStore {
  /** Cliente público (anon key) — para Server/Client Components y Route Handlers */
  anonClient: InsforgeClient | undefined;
  /** Cliente administrativo (API key) — SOLO para el servidor */
  adminClient: InsforgeClient | undefined;
}

// Símbolo único para evitar colisiones con otros módulos
const GLOBAL_KEY = "__stagefront_insforge_singleton__" as const;

// ---------------------------------------------------------------------------
// Acceso al store global (typesafe)
// ---------------------------------------------------------------------------

function getGlobalStore(): InsforgeGlobalStore {
  const g = globalThis as unknown as Record<string, InsforgeGlobalStore | undefined>;

  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      anonClient: undefined,
      adminClient: undefined,
    };
  }

  return g[GLOBAL_KEY];
}

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
// 1. SINGLETON: Cliente público (Anon Key)
// ---------------------------------------------------------------------------
// ✅ Úsalo en: Server Components, Client Components, Route Handlers
// ⚠️ Las operaciones están limitadas por las políticas RLS
//
// Ejemplo:
//   import { insforge } from "@/lib/insforge";
//
//   const { data, error } = await insforge.database
//     .from("events")
//     .select()
//     .eq("artist_slug", "bts");
// ---------------------------------------------------------------------------

function getAnonClient(): InsforgeClient {
  const store = getGlobalStore();

  if (!store.anonClient) {
    store.anonClient = createClient({
      baseUrl: insforgeUrl!,
      anonKey: insforgeAnonKey!,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("🔌 [Singleton] Instancia ANON creada (única por proceso)");
    }
  }

  return store.anonClient;
}

/**
 * Cliente público de la base de datos — Singleton garantizado.
 *
 * Esta exportación siempre retorna la MISMA instancia, sin importar
 * cuántas veces se importe o desde cuántos archivos.
 *
 * @example
 * ```ts
 * import { insforge } from "@/lib/insforge";
 * const { data } = await insforge.database.from("events").select();
 * ```
 */
export const insforge: InsforgeClient = getAnonClient();

// ---------------------------------------------------------------------------
// 2. SINGLETON: Cliente administrativo (API Key) — Lazy initialization
// ---------------------------------------------------------------------------
// 🔐 SOLO para uso en el SERVIDOR (Route Handlers, Server Actions)
// ❌ NUNCA importar en Client Components ("use client")
//
// Se inicializa LAZILY: la conexión admin no se crea hasta que alguien
// la solicite por primera vez. Esto ahorra una conexión si el proceso
// nunca necesita operaciones admin.
//
// Ejemplo:
//   import { insforgeAdmin } from "@/lib/insforge";
//
//   // Dentro de un Route Handler
//   const admin = insforgeAdmin();
//   const { data } = await admin.database
//     .from("tickets")
//     .insert({ ... })
//     .select();
// ---------------------------------------------------------------------------

const insforgeAdminKey = process.env.INSFORGE_ADMIN_API_KEY;

function getAdminClient(): InsforgeClient | null {
  if (!insforgeAdminKey) return null;

  const store = getGlobalStore();

  if (!store.adminClient) {
    store.adminClient = createClient({
      baseUrl: insforgeUrl!,
      anonKey: insforgeAdminKey,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("🔐 [Singleton] Instancia ADMIN creada (única por proceso)");
    }
  }

  return store.adminClient;
}

/**
 * Cliente administrativo — Singleton con inicialización lazy.
 *
 * Retorna `null` si `INSFORGE_ADMIN_API_KEY` no está configurada.
 *
 * @example
 * ```ts
 * import { insforgeAdmin } from "@/lib/insforge";
 * if (!insforgeAdmin) throw new Error("Admin not configured");
 * const { data } = await insforgeAdmin.database.from("users").select();
 * ```
 */
export const insforgeAdmin: InsforgeClient | null = getAdminClient();
