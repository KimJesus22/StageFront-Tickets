// ============================================================================
// 💀 TicketSkeleton — Skeleton loader para boletos digitales
// ============================================================================
//
// Replica la estructura visual del boleto skeuomórfico con:
//   - Muescas circulares laterales (punched hole effect)
//   - Thumbnail cuadrado a la izquierda
//   - Líneas de texto escalonadas a la derecha
//   - animate-pulse para señalizar carga activa
//
// Uso individual:
//   <TicketSkeleton />
//
// Uso en lista:
//   <TicketSkeletonList count={3} />
//
// ============================================================================

/**
 * Skeleton individual que replica la estructura de un boleto digital.
 * Incluye las muescas laterales características del diseño de ticket.
 */
export function TicketSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse flex flex-row items-center gap-6 h-[160px] relative overflow-hidden">
      {/* ── Muescas laterales (ticket punched holes) ── */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />

      {/* ── Thumbnail del evento ── */}
      <div className="w-24 h-24 bg-surface-variant rounded-lg shrink-0" />

      {/* ── Información del boleto ── */}
      <div className="flex flex-col justify-center w-full gap-2 border-l border-surface-variant/50 pl-6 py-2 h-full">
        {/* Nombre del evento */}
        <div className="h-5 bg-surface-bright rounded w-2/5 mb-2" />
        {/* Zona / Asiento */}
        <div className="h-4 bg-surface-variant rounded w-1/4" />
        {/* Fecha / Código */}
        <div className="h-4 bg-surface-variant rounded w-1/2 mt-auto" />
      </div>
    </div>
  );
}

/**
 * Lista vertical de N ticket skeletons.
 *
 * @param count — Número de skeletons a renderizar (default: 3)
 */
export function TicketSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: count }, (_, i) => (
        <TicketSkeleton key={i} />
      ))}
    </div>
  );
}
