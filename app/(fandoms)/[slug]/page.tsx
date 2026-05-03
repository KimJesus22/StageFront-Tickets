import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventsByArtistSlug } from "@/lib/actions/events";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArtistProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const { artist, events } = await getEventsByArtistSlug(slug);

  if (!artist) {
    notFound();
  }

  // Formateador de fechas
  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-20">
        {/* Hero Header */}
        <section className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
          {/* Fondo borroso con la imagen del artista */}
          {artist.image_url && (
            <>
              <div className="absolute inset-0 z-0">
                <Image
                  src={artist.image_url}
                  alt={artist.name}
                  fill
                  className="object-cover opacity-30 blur-xl scale-110"
                  priority
                  unoptimized
                />
              </div>
              <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
            </>
          )}

          {/* Contenido del Hero */}
          <div className="relative z-10 text-center px-6">
            {artist.genre && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 font-label-caps text-xs tracking-widest text-zinc-300 mb-4">
                {artist.genre}
              </span>
            )}
            <h1 className="font-display-xl text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-2">
              {artist.name}
            </h1>
            <p className="font-body-lg text-zinc-400 max-w-2xl mx-auto">
              Descubre los próximos eventos y asegura tu lugar en la historia.
            </p>
          </div>
        </section>

        {/* Lista de Eventos */}
        <section className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-lg text-3xl font-semibold text-white">
              Próximos Conciertos
            </h2>
            <div className="text-sm text-zinc-400 font-body-md bg-white/5 px-4 py-2 rounded-full border border-white/10">
              {events.length} {events.length === 1 ? "evento" : "eventos"}
            </div>
          </div>

          {events.length > 0 ? (
            <div className="flex flex-col gap-4">
              {events.map((event) => {
                const isActive = event.status === "en_venta" || event.status === "programado";
                
                return (
                  <div
                    key={event.id}
                    className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-surface-container-low border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 gap-6 group"
                  >
                    <div className="flex flex-col flex-grow w-full md:w-auto">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary text-xl">
                          calendar_month
                        </span>
                        <p className="font-body-md text-sm text-primary font-medium capitalize">
                          {dateFormatter.format(new Date(event.date))}
                        </p>
                      </div>
                      <h3 className="font-headline-md text-xl text-white font-semibold mb-1 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-400 text-sm font-body-md">
                        <span className="material-symbols-outlined text-sm">
                          location_on
                        </span>
                        <span>{event.venue}, {event.city}</span>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 shrink-0 border-t border-white/5 md:border-0 pt-4 md:pt-0 mt-2 md:mt-0">
                      <div className="text-xs font-label-caps uppercase tracking-widest text-zinc-500">
                        {event.status.replace("_", " ")}
                      </div>
                      {isActive ? (
                        <Link
                          href={`/event/${event.id}`}
                          className="px-8 py-3 rounded-full font-body-md font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap bg-primary text-on-primary hover:bg-white/90 hover:scale-105"
                        >
                          Seleccionar Asientos
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward
                          </span>
                        </Link>
                      ) : (
                        <div
                          className="px-8 py-3 rounded-full font-body-md font-semibold flex items-center gap-2 whitespace-nowrap bg-surface-container-highest text-zinc-500 cursor-not-allowed border border-white/5"
                          aria-disabled="true"
                        >
                          Seleccionar Asientos
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-surface-container-low border border-white/5 rounded-3xl">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-zinc-500">
                  event_busy
                </span>
              </div>
              <h3 className="font-headline-md text-2xl text-white mb-2">
                No hay eventos programados
              </h3>
              <p className="font-body-md text-zinc-400 max-w-md mx-auto mb-8">
                El artista no tiene conciertos próximos por el momento. Únete a la lista de espera para ser el primero en saber.
              </p>
              <button className="px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-body-md font-medium hover:bg-white/20 transition-all duration-300">
                Avisarme cuando haya eventos
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
