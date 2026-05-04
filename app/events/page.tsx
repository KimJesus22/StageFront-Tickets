import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllUpcomingEvents } from "@/lib/actions/events";

export const metadata = {
  title: "StageFront — Próximos Eventos",
  description:
    "Descubre las fechas de tus artistas favoritos. Vive la experiencia desde la primera fila. Compra tus boletos de forma segura.",
};

export default async function EventsPage() {
  const events = await getAllUpcomingEvents();

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

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 md:pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-screen">
        {/* ─── Header Section ─── */}
        <header className="mb-stack-lg flex flex-col gap-stack-sm text-center md:text-left mt-8 md:mt-12">
          <h1 className="font-display-xl text-display-xl text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Próximos Eventos
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Descubre las fechas de tus artistas favoritos. Vive la experiencia
            desde la primera fila.
          </p>
        </header>

        {events.length === 0 ? (
          /* ─── Estado Vacío ─── */
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
              Próximamente anunciaremos nuevas fechas
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mb-10 leading-relaxed">
              En este momento no tenemos eventos programados. Vuelve pronto o
              explora nuestros artistas para no perderte ninguna novedad.
            </p>

            <Link
              href="/"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-full font-label-caps text-label-caps tracking-widest uppercase hover:bg-white/90 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                explore
              </span>
              Descubrir Artistas
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        ) : (
          /* ─── Event Cards Grid ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const formattedDate = shortDateFormatter
                .format(eventDate)
                .toUpperCase();
              const formattedTime = timeFormatter.format(eventDate);
              const imageUrl =
                event.image_url || event.artists?.image_url || null;
              const isSoldOut = event.status === "agotado";

              return (
                <article
                  key={event.id}
                  className="group relative flex flex-col rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)] transition-all duration-500 ease-out"
                >
                  {/* ─── Image Section ─── */}
                  <div className="relative h-64 w-full overflow-hidden">
                    {/* Gradient overlay from bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141313] via-transparent to-transparent z-10" />

                    {/* Concert image */}
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
                      <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />
                    )}

                    {/* Status Badge — top right */}
                    <div className="absolute top-4 right-4 z-20">
                      {isSoldOut ? (
                        <span className="inline-flex items-center justify-center font-label-caps text-label-caps px-3 py-1 rounded-full bg-[#141313]/80 backdrop-blur-md border border-error/50 text-error shadow-[0_0_12px_rgba(255,180,171,0.1)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-error mr-2" />
                          Agotado
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center font-label-caps text-label-caps px-3 py-1 rounded-full bg-[#141313]/80 backdrop-blur-md border border-white/20 text-primary shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                          Disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ─── Content Section (overlaps image by -mt-12) ─── */}
                  <div className="p-6 flex flex-col flex-grow z-20 -mt-12">
                    {/* Date & Time */}
                    <p className="font-label-caps text-label-caps text-primary tracking-widest mb-2 opacity-80">
                      {formattedDate} • {formattedTime}
                    </p>

                    {/* Artist Name */}
                    <h2 className="font-headline-md text-headline-md text-primary mb-1">
                      {event.artists?.name ?? "Artista"}
                    </h2>

                    {/* Venue */}
                    <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        location_on
                      </span>
                      {event.venue}, {event.city}
                    </p>

                    {/* CTA Button */}
                    <div className="mt-auto pt-4 border-t border-white/5">
                      {isSoldOut ? (
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-lg bg-surface-variant/50 border border-transparent text-on-surface-variant font-label-caps text-label-caps cursor-not-allowed"
                        >
                          Lista de Espera
                        </button>
                      ) : (
                        <Link
                          href={`/event/${event.id}/queue`}
                          className="block w-full py-3 px-4 rounded-lg bg-transparent backdrop-blur-xl border border-white/20 text-primary font-label-caps text-label-caps text-center hover:bg-white hover:text-black transition-all duration-300"
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
        )}
      </main>
      <Footer />
    </>
  );
}
