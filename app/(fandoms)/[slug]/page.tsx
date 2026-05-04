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

  // ── Accent color mapping per artist ──────────────────────────────
  // Each entry holds the Tailwind bg class for the radial glow,
  // the card accent, and the raw RGB tuple for inline rgba() styles.
  const accentMap: Record<string, { glow: string; card: string; rgb: string }> = {
    bts:                 { glow: "bg-purple-900/20",  card: "bg-purple-500/5",  rgb: "168,85,247"  },
    txt:                 { glow: "bg-cyan-900/20",    card: "bg-cyan-500/5",    rgb: "6,182,212"   },
    blackpink:           { glow: "bg-pink-900/20",    card: "bg-pink-500/5",    rgb: "236,72,153"  },
    "twenty-one-pilots": { glow: "bg-yellow-900/20",  card: "bg-yellow-500/5",  rgb: "234,179,8"   },
    stray_kids:          { glow: "bg-red-900/20",     card: "bg-red-500/5",     rgb: "239,68,68"   },
    ateez:               { glow: "bg-sky-900/20",     card: "bg-sky-500/5",     rgb: "14,165,233"  },
    enhypen:             { glow: "bg-orange-900/20",  card: "bg-orange-500/5",  rgb: "249,115,22"  },
  };

  const defaultAccent = { glow: "bg-zinc-800/20", card: "bg-zinc-500/5", rgb: "161,161,170" };
  const accent = accentMap[slug] ?? defaultAccent;

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
      
      {/* Hero Section */}
      <section className="relative h-[614px] min-h-[500px] w-full flex flex-col justify-end overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          {artist.image_url && (
            <Image 
              src={artist.image_url} 
              alt={artist.name} 
              fill
              className="object-cover object-top opacity-70"
              priority
              unoptimized
            />
          )}
          {/* Deep bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          {/* Dynamic radial glow — color follows artist accent */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 ${accent.glow} blur-[100px] rounded-full pointer-events-none`}></div>
        </div>
        <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-stack-lg">
          {artist.genre && (
            <span
              className="inline-block px-3 py-1 rounded-full bg-surface-variant/50 backdrop-blur-md border border-outline-variant text-on-surface font-label-caps text-label-caps mb-4"
              style={{ boxShadow: `0 0 12px rgba(${accent.rgb},0.3)` }}
            >
              {artist.genre}
            </span>
          )}
          <h1
            className="font-display-xl text-display-xl text-primary tracking-tighter"
            style={{ filter: `drop-shadow(0 0 40px rgba(${accent.rgb},0.4))` }}
          >
            {artist.name}
          </h1>
        </div>
      </section>

      {/* Content Canvas */}
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg min-h-screen">
        {/* Events Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Próximos Conciertos</h2>
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/50"></span>
            {events.length} {events.length === 1 ? "evento" : "eventos"}
          </div>
        </div>

        {/* Event Cards Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {events.map((event) => {
              const isActive = event.status === "en_venta" || event.status === "programado";
              const isEnVenta = event.status === "en_venta";
              
              return (
                <article key={event.id} className="group relative flex flex-col p-6 rounded-xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/50 hover:border-outline/80 transition-all duration-300 hover:bg-surface-container/60 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 z-10">
                    {isEnVenta ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                        <span className="font-label-caps text-label-caps text-green-400 tracking-widest uppercase">
                          {event.status.replace("_", " ")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant/50 border border-outline-variant">
                        <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                        <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
                          {event.status.replace("_", " ")}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-4 flex-grow relative z-10">
                    <div className="flex flex-col gap-1 mt-6">
                      <h3 className="font-headline-md text-headline-md text-primary">{event.title}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 capitalize">
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        {dateFormatter.format(new Date(event.date))}
                      </p>
                      <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        {event.venue}, {event.city}
                      </p>
                    </div>
                    <div className="mt-auto pt-6">
                      {isActive ? (
                        <Link href={`/event/${event.id}/queue`} className={`w-full py-4 px-6 font-body-md text-body-md font-semibold rounded-lg transition-colors flex justify-center items-center gap-2 ${isEnVenta ? "bg-primary text-on-primary hover:bg-primary-fixed group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-transparent border border-outline-variant text-primary hover:bg-surface-variant"}`}>
                          Seleccionar Asientos
                          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                        </Link>
                      ) : (
                        <div className="w-full py-4 px-6 bg-transparent border border-outline-variant text-zinc-500 font-body-md text-body-md font-semibold rounded-lg flex justify-center items-center gap-2 cursor-not-allowed">
                          No Disponible
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Subtle background accent — dynamic per artist */}
                  <div className={`absolute top-0 right-0 w-64 h-64 ${accent.card} blur-[80px] rounded-full pointer-events-none`}></div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/50 rounded-3xl mt-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/5">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                event_busy
              </span>
            </div>
            <h3 className="font-headline-md text-2xl text-primary mb-2">
              No hay fechas anunciadas por el momento
            </h3>
            <p className="font-body-md text-on-surface-variant max-w-md mx-auto mb-8">
              Sé el primero en saber cuándo anuncien nuevas fechas. Te notificaremos antes de que salgan a la venta general.
            </p>
            <button className="px-8 py-4 rounded-lg bg-transparent border border-outline-variant text-primary font-body-md font-semibold hover:bg-surface-variant transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined">notifications_active</span>
              Notificarme
            </button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
