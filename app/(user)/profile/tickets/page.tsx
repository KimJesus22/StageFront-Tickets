// ============================================================================
// 🎫 app/(user)/profile/tickets/page.tsx — Mis Boletos (con Suspense granular)
// ============================================================================
//
// ESTRATEGIA DE CARGA:
//
//   1. El header ("Mis Boletos" + descripción) carga INSTANTÁNEAMENTE
//      porque no depende de datos async — es contenido estático.
//
//   2. La lista de boletos (WalletClient) se envuelve en <Suspense>
//      con un TicketSkeletonList como fallback. Esto aísla la carga
//      lenta (getUserTickets → InsForge DB) solo al área de los boletos.
//
//   3. El resto de la interfaz (sidebar, navbar, nombre del usuario)
//      permanece interactiva mientras los boletos cargan en streaming.
//
// RENDERIZADO CONDICIONAL:
//
//   Después del fetch, si tickets.length === 0, se muestra
//   <WalletEmptyState /> en lugar del <WalletClient />.
//   Esto se evalúa en el Server Component (early return)
//   para evitar enviar JS innecesario al cliente.
//
// ============================================================================

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserTickets } from "@/lib/actions/orders";
import WalletClient from "@/app/(user)/wallet/WalletClient";
import WalletEmptyState from "@/components/empty-states/WalletEmptyState";
import { TicketSkeletonList } from "@/components/skeletons/TicketSkeleton";

export const metadata = {
  title: "Mis Boletos — StageFront Tickets",
  description: "Tu billetera digital segura con boletos protegidos.",
};

/**
 * Componente async interno que hace el fetching de boletos.
 * Aislado dentro de <Suspense> para no bloquear el header.
 *
 * RENDERIZADO CONDICIONAL:
 *   - tickets.length === 0 → <WalletEmptyState /> (Server-rendered, zero JS)
 *   - tickets.length > 0   → <WalletClient /> (Client Component con interacción)
 */
async function TicketsList() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const rawTickets = await getUserTickets();

  // ── Early return: billetera vacía ──
  if (!rawTickets || rawTickets.length === 0) {
    return <WalletEmptyState />;
  }

  // ── Render normal: lista de boletos interactiva ──
  return <WalletClient session={session} rawTickets={rawTickets} />;
}

export default async function ProfileTicketsPage() {
  // La sesión se verifica primero fuera del Suspense para redirect rápido
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      {/* ── Header estático — carga instantáneamente ── */}
      <header className="mb-8 flex flex-col gap-1">
        <h2 className="font-headline-lg text-3xl font-bold text-white">Mis Boletos</h2>
        <p className="text-zinc-400">Accede a tus pases digitales y códigos QR.</p>
      </header>

      {/* ── Lista de boletos con Suspense granular ── */}
      {/* El skeleton se muestra SOLO en esta área mientras getUserTickets() */}
      {/* resuelve la consulta a InsForge. El header ya está visible. */}
      <Suspense fallback={<TicketSkeletonList count={3} />}>
        <TicketsList />
      </Suspense>
    </>
  );
}
