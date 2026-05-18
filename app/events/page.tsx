import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getFilteredEvents } from "@/lib/actions/events";
import FilterClient from "./FilterClient";
import { Suspense } from "react";
import { EventCardSkeletonGrid } from "@/components/skeletons/EventCardSkeleton";

export const metadata = {
  title: "StageFront — Cartelera y Filtrado",
  description: "Descubre las fechas de tus artistas favoritos. Vive la experiencia desde la primera fila.",
};

// Formatter: "SÁB, 24 NOV • 20:30"
const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

async function EventsGrid({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const events = await getFilteredEvents({
    status: searchParams.status,
    min_price: searchParams.min_price,
    max_price: searchParams.max_price,
    q: searchParams.q,
    date: searchParams.date,
  });

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24">
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-surface-container-high/40 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.05)]">
            <span
              className="material-symbols-outlined text-6xl text-on-surface-variant/60"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              event_busy
            </span>
          </div>
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10" />
        </div>

        <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
          No hay eventos que coincidan con tu búsqueda
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mb-10 leading-relaxed">
          Intenta ajustar los filtros de precio, fecha o ciudad para encontrar lo que buscas.
        </p>

        <Link
          href="/events"
          className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-full font-label-caps text-label-caps tracking-widest uppercase hover:bg-white/90 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            refresh
          </span>
          Limpiar Filtros
          <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {events.map((event) => {
        const eventDate = new Date(event.date);
        const formattedDate = shortDateFormatter.format(eventDate).toUpperCase();
        const formattedTime = timeFormatter.format(eventDate);
        const imageUrl = event.image_url || event.artists?.image_url || null;
        const isSoldOut = event.status === "agotado";

        return (
          <article
            key={event.id}
            className="group relative flex flex-col rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)] transition-all duration-500 ease-out h-[420px]"
          >
            {/* ─── Image Section ─── */}
            <div className="relative h-64 w-full overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-[#141313] via-transparent to-transparent z-10" />
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={`${event.artists?.name ?? "Evento"} — ${event.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
              )}
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-20">
                {isSoldOut ? (
                  <span className="inline-flex items-center justify-center font-['Inter'] text-[10px] font-semibold tracking-widest px-3 py-1 rounded-full bg-[#141313]/80 backdrop-blur-md border border-error/50 text-error shadow-[0_0_12px_rgba(255,180,171,0.1)] uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-error mr-2" />
                    Agotado
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center font-['Inter'] text-[10px] font-semibold tracking-widest px-3 py-1 rounded-full bg-[#141313]/80 backdrop-blur-md border border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.1)] uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    Disponible
                  </span>
                )}
              </div>
            </div>

            {/* ─── Content Section ─── */}
            <div className="p-6 flex flex-col flex-grow z-20 -mt-12">
              <p className="font-['Inter'] text-xs font-semibold tracking-widest text-white mb-2 opacity-80">
                {formattedDate} • {formattedTime}
              </p>
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white mb-1 truncate">
                {event.artists?.name ?? "Artista"}
              </h2>
              <p className="font-['Inter'] text-sm text-zinc-400 mb-6 flex items-center gap-2 truncate">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {event.venue}, {event.city}
              </p>

              <div className="mt-auto pt-4 border-t border-white/5">
                {isSoldOut ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg bg-zinc-800/50 border border-transparent text-zinc-500 font-['Inter'] text-xs font-semibold tracking-widest uppercase cursor-not-allowed"
                  >
                    Lista de Espera
                  </button>
                ) : (
                  <Link
                    href={`/event/${event.id}/queue`}
                    className="block w-full py-3 px-4 rounded-lg bg-transparent backdrop-blur-xl border border-white/20 text-white font-['Inter'] text-xs font-semibold tracking-widest uppercase text-center hover:bg-white hover:text-black transition-all duration-300"
                  >
                    Comprar Boletos
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// GridSkeleton ahora importado como EventCardSkeletonGrid desde @/components/skeletons/EventCardSkeleton

export default async function EventsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;

  // Construimos una llave para el Suspense basada en los parámetros para forzar re-render y loader
  const suspenseKey = new URLSearchParams(searchParams as any).toString();

  return (
    <div className="bg-[#141313] min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 md:pb-24 px-4 md:px-12 max-w-[1280px] mx-auto min-h-screen">
        <header className="mb-12 flex flex-col gap-2 text-center md:text-left mt-8 md:mt-12">
          <h1 className="font-['Space_Grotesk'] text-5xl md:text-[64px] font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] tracking-tight">
            Cartelera de Eventos
          </h1>
          <p className="font-['Inter'] text-lg text-zinc-400 max-w-2xl">
            Descubre las fechas de tus artistas favoritos. Filtra por ciudad, fecha o precio.
          </p>
        </header>

        {/* ─── Filter Bar Component ─── */}
        <div className="mb-12">
          <FilterClient />
        </div>

        {/* ─── Suspense Grid with Skeleton ─── */}
        <Suspense key={suspenseKey} fallback={<EventCardSkeletonGrid count={8} />}>
          <EventsGrid searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
