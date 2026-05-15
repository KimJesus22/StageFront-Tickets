// ============================================================================
// 💀 EventCardSkeleton — Skeleton loader para tarjetas de evento
// ============================================================================
//
// Componente de presentación puro que simula la estructura visual de una
// tarjeta de evento mientras los datos se cargan desde InsForge.
//
// Sigue el sistema de diseño "Ethereal Tech":
//   - Glass shell: bg-white/5 + border-white/10
//   - Inner blocks: surface-variant / surface-bright (tonal zinc)
//   - animate-pulse: efecto "breathing" para señalizar carga activa
//
// Uso individual:
//   <EventCardSkeleton />
//
// Uso en grid (recomendado):
//   <EventCardSkeletonGrid count={8} />
//
// ============================================================================

/**
 * Skeleton individual que replica la estructura exacta de una EventCard.
 * Altura fija de 420px para evitar layout shift cuando los datos reales lleguen.
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-pulse flex flex-col h-[420px]">
      {/* Imagen placeholder */}
      <div className="bg-surface-variant h-64 w-full rounded-t-xl shrink-0" />

      {/* Content area */}
      <div className="p-6 flex flex-col flex-grow -mt-12 z-20">
        {/* Fecha */}
        <div className="h-3 bg-surface-bright rounded w-24 mb-4" />
        {/* Título del artista */}
        <div className="h-6 bg-surface-bright rounded w-3/4 mb-2" />
        {/* Venue + Ciudad */}
        <div className="h-4 bg-surface-variant rounded w-1/2 mb-6" />
        {/* Botón CTA */}
        <div className="mt-auto h-10 bg-surface-bright/50 rounded w-full" />
      </div>
    </div>
  );
}

/**
 * Grid de N skeletons que llena la pantalla simulando el catálogo completo.
 * Usa el mismo grid layout que EventsGrid para evitar layout shift.
 *
 * @param count — Número de skeletons a renderizar (default: 8)
 */
export function EventCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
