// ============================================================================
// ⏳ app/events/loading.tsx — Skeleton global de la ruta /events
// ============================================================================
//
// CÓMO FUNCIONA (Next.js 16 App Router):
//
//   Next.js envuelve automáticamente el contenido de page.tsx en un
//   <Suspense> boundary usando este archivo loading.tsx como fallback.
//
//   Cuando un usuario navega a /events, Next.js:
//     1. Renderiza loading.tsx INSTANTÁNEAMENTE (es un componente estático)
//     2. En paralelo, ejecuta el Server Component de page.tsx que hace
//        la consulta a la base de datos de InsForge (getFilteredEvents)
//     3. Cuando la promesa resuelve, Next.js hace streaming del HTML real
//        y reemplaza el skeleton con los datos reales
//
//   Esto significa que el usuario NUNCA ve una pantalla en blanco —
//   siempre ve la estructura del catálogo llenando la pantalla.
//
// ============================================================================

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventCardSkeletonGrid } from "@/components/skeletons/EventCardSkeleton";

export default function EventsLoading() {
  return (
    <div className="bg-[#141313] min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 md:pb-24 px-4 md:px-12 max-w-[1280px] mx-auto min-h-screen">
        {/* ── Header (estático, carga instantáneamente) ── */}
        <header className="mb-12 flex flex-col gap-2 text-center md:text-left mt-8 md:mt-12">
          <h1 className="font-['Space_Grotesk'] text-5xl md:text-[64px] font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] tracking-tight">
            Cartelera de Eventos
          </h1>
          <p className="font-['Inter'] text-lg text-zinc-400 max-w-2xl">
            Descubre las fechas de tus artistas favoritos. Filtra por ciudad, fecha o precio.
          </p>
        </header>

        {/* ── Filter Bar Skeleton ── */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-4 animate-pulse">
            <div className="h-10 w-32 bg-white/5 border border-white/10 rounded-lg" />
            <div className="h-10 w-40 bg-white/5 border border-white/10 rounded-lg" />
            <div className="h-10 w-36 bg-white/5 border border-white/10 rounded-lg" />
            <div className="h-10 w-48 bg-white/5 border border-white/10 rounded-lg ml-auto" />
          </div>
        </div>

        {/* ── Grid de 8 Event Card Skeletons ── */}
        <EventCardSkeletonGrid count={8} />
      </main>
      <Footer />
    </div>
  );
}
