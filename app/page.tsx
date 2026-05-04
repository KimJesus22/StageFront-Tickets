import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import { getArtists } from "@/lib/actions/artists";
import { getFeaturedEvents } from "@/lib/actions/events";
import type { EventWithArtist, Artist } from "@/lib/types/database";

// ──────────────────────────────────────────────────────────────
// Metadata
// ──────────────────────────────────────────────────────────────
export const metadata = {
  title: "StageFront — Tu acceso a la primera fila",
  description:
    "Descubre y asegura boletos para los eventos más exclusivos del mundo. Una experiencia premium de inicio a fin.",
};

// ──────────────────────────────────────────────────────────────
// Helpers — formateador de fechas reutilizable
// ──────────────────────────────────────────────────────────────
const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
});

const dateTimeFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ──────────────────────────────────────────────────────────────
// Accent config por artista (reutiliza el pattern del ArtistGrid)
// ──────────────────────────────────────────────────────────────
const ARTIST_GLOW: Record<string, string> = {
  bts: "rgba(168,85,247,0.15)",
  txt: "rgba(6,182,212,0.15)",
  blackpink: "rgba(236,72,153,0.15)",
  "twenty-one-pilots": "rgba(234,179,8,0.15)",
  stray_kids: "rgba(239,68,68,0.15)",
  ateez: "rgba(14,165,233,0.15)",
  enhypen: "rgba(249,115,22,0.15)",
};

const ARTIST_GLOW_HOVER: Record<string, string> = {
  bts: "rgba(168,85,247,0.3)",
  txt: "rgba(6,182,212,0.3)",
  blackpink: "rgba(236,72,153,0.3)",
  "twenty-one-pilots": "rgba(234,179,8,0.3)",
  stray_kids: "rgba(239,68,68,0.3)",
  ateez: "rgba(14,165,233,0.3)",
  enhypen: "rgba(249,115,22,0.3)",
};

// ──────────────────────────────────────────────────────────────
// Sub-componentes internos
// ──────────────────────────────────────────────────────────────

/** Tarjeta grande (8-col) para el primer evento destacado. */
function FeaturedLargeCard({ event }: { event: EventWithArtist }) {
  const artist = event.artists;
  return (
    <Link
      href={`/event/${event.id}/queue`}
      className="md:col-span-8 relative rounded-xl overflow-hidden group cursor-pointer block"
    >
      {event.image_url ? (
        <Image
          src={event.image_url}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
          unoptimized
        />
      ) : artist.image_url ? (
        <Image
          src={artist.image_url}
          alt={artist.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-surface-container" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

      {/* Badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {event.status === "en_venta" && (
          <span className="glass-panel px-3 py-1 rounded-full text-xs font-label-caps text-white flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-error">
              local_fire_department
            </span>
            Alta Demanda
          </span>
        )}
        {artist.genre && (
          <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-label-caps text-white border border-white/10">
            {artist.genre}
          </span>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 p-6 w-full glass-panel border-x-0 border-b-0 rounded-b-xl z-10">
        <h3 className="font-headline-lg text-[28px] font-bold text-white mb-1">
          {event.title}
        </h3>
        <p className="text-on-surface-variant font-body-md mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">
            location_on
          </span>
          {event.venue}, {event.city} • {dateFmt.format(new Date(event.date))}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-white font-headline-md">Ver Boletos</span>
          <span className="bg-white text-black px-6 py-2 rounded-full font-body-md font-semibold hover:bg-white/90 transition-colors">
            Comprar
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Tarjeta mediana (4-col) para eventos secundarios. */
function FeaturedMediumCard({ event }: { event: EventWithArtist }) {
  const artist = event.artists;
  return (
    <Link
      href={`/event/${event.id}/queue`}
      className="md:col-span-4 relative rounded-xl overflow-hidden group cursor-pointer block"
    >
      {event.image_url ? (
        <Image
          src={event.image_url}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      ) : artist.image_url ? (
        <Image
          src={artist.image_url}
          alt={artist.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-surface-container" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

      <div className="absolute top-4 left-4 z-10">
        {event.status === "en_venta" ? (
          <span className="glass-panel px-3 py-1 rounded-full text-xs font-label-caps text-white flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-error">
              local_fire_department
            </span>
            Últimos Boletos
          </span>
        ) : artist.genre ? (
          <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-label-caps text-white border border-white/10">
            {artist.genre}
          </span>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 p-6 w-full glass-panel border-x-0 border-b-0 rounded-b-xl z-10">
        <h3 className="font-headline-md text-white mb-1">{event.title}</h3>
        <p className="text-on-surface-variant font-body-md text-sm mb-4">
          {event.venue} • {dateFmt.format(new Date(event.date))}
        </p>
        <span className="block w-full glass-panel text-white py-2 rounded-full font-body-md text-center hover:bg-white/10 transition-colors border-white/20">
          Ver Fechas
        </span>
      </div>
    </Link>
  );
}

/** Tarjeta horizontal ancha (8-col) para el cuarto evento. */
function FeaturedHorizontalCard({ event }: { event: EventWithArtist }) {
  const artist = event.artists;
  return (
    <Link
      href={`/event/${event.id}/queue`}
      className="md:col-span-8 relative rounded-xl overflow-hidden group cursor-pointer bg-surface-container-high flex flex-col sm:flex-row items-center border border-white/5 hover:border-white/10 transition-colors block"
    >
      <div className="w-full sm:w-2/5 h-48 sm:h-full relative overflow-hidden min-h-[200px]">
        {(event.image_url || artist.image_url) && (
          <Image
            src={event.image_url || artist.image_url!}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
        )}
      </div>
      <div className="p-6 w-full sm:w-3/5 flex flex-col justify-center h-full">
        {artist.genre && (
          <div className="flex gap-2 mb-3">
            <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-label-caps text-white border border-white/10">
              {artist.genre}
            </span>
          </div>
        )}
        <h3 className="font-headline-lg text-[24px] font-bold text-white mb-2">
          {event.title}
        </h3>
        <p className="text-on-surface-variant font-body-md mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">
            calendar_month
          </span>
          {dateTimeFmt.format(new Date(event.date))}
        </p>
        <p className="text-on-surface-variant font-body-md text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">
            location_on
          </span>
          {event.venue}, {event.city}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-white font-body-md font-medium border-b border-white pb-1 hover:text-white/80 transition-colors">
            Más Información
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Círculo de artista del directorio. */
function ArtistCircle({ artist }: { artist: Artist }) {
  const glow = ARTIST_GLOW[artist.slug] ?? "rgba(161,161,170,0.15)";
  const glowHover = ARTIST_GLOW_HOVER[artist.slug] ?? "rgba(161,161,170,0.3)";

  return (
    <Link
      href={`/${artist.slug}`}
      className="group cursor-pointer flex flex-col items-center"
    >
      <div
        className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden mb-4 relative transition-all duration-300 artist-glow-circle"
        style={
          {
            "--glow": glow,
            "--glow-hover": glowHover,
          } as React.CSSProperties
        }
      >
        {artist.image_url ? (
          <Image
            src={artist.image_url}
            alt={artist.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 128px, 192px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              person
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-transparent transition-colors" />
      </div>
      <h4 className="text-white font-headline-md text-lg">{artist.name}</h4>
      {artist.genre && (
        <p className="text-on-surface-variant font-body-md text-sm">
          {artist.genre}
        </p>
      )}
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────
// Página principal (Server Component)
// ──────────────────────────────────────────────────────────────

export default async function Home() {
  const [featuredEvents, artists] = await Promise.all([
    getFeaturedEvents(4),
    getArtists(),
  ]);

  return (
    <>
      <Navbar />

      <main className="flex-grow">
        {/* ════════ Hero Section ════════ */}
        <section className="relative min-h-[921px] flex flex-col items-center justify-center pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdZ5n5DGk5I55ZddyXseu86UinnbD6O2lWmJQL_9WxQpmXq9mMSO5-3fYd6Aypy-_4xGOXHpzPA32AOYuXiv6KPKw0hjT5n5UCzBEHorACFId5883BB_el-WjZ__FbVI83Ogs0kh83yW7Rx8qBmtMlQulZzz93_8Zc79fp8azWwuPRY2xiXnVsx2gD__t1hSrFAYp4WSsrLs7t51XzBG21TsmGi6k6TrZ0Qd-hd9d3p2pKEHYU60tW99194Iz5YqF_H_P97l__BQw"
              alt="Concierto épico en un estadio masivo con luces láser y neblina atmosférica"
              fill
              className="object-cover object-center"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-background" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full max-w-container-max mx-auto flex flex-col items-center text-center mt-stack-lg">
            <h1 className="font-display-xl text-display-xl text-white max-w-4xl mb-stack-md leading-tight">
              Tu acceso a la primera fila
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-stack-lg">
              Descubre y asegura boletos para los eventos más exclusivos del
              mundo. Una experiencia premium de inicio a fin.
            </p>

            {/* Search Bar — Client Component */}
            <div className="mb-stack-lg w-full flex justify-center">
              <HeroSearch />
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/events"
                className="px-6 py-2 rounded-full bg-white text-black font-body-md font-medium"
              >
                Todos
              </Link>
              <Link
                href="/events?q=K-Pop"
                className="px-6 py-2 rounded-full glass-panel text-white font-body-md hover:bg-white/10 transition-colors"
              >
                K-Pop
              </Link>
              <Link
                href="/events?q=Festival"
                className="px-6 py-2 rounded-full glass-panel text-white font-body-md hover:bg-white/10 transition-colors"
              >
                Festivales
              </Link>
              <Link
                href="/events?q=Rock"
                className="px-6 py-2 rounded-full glass-panel text-white font-body-md hover:bg-white/10 transition-colors"
              >
                Rock
              </Link>
              <Link
                href="/events?q=Electrónica"
                className="px-6 py-2 rounded-full glass-panel text-white font-body-md hover:bg-white/10 transition-colors"
              >
                Electrónica
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ Eventos Destacados (Bento Grid) ════════ */}
        <section className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-end justify-between mb-stack-md">
            <h2 className="font-headline-lg text-headline-lg text-white">
              Eventos Destacados
            </h2>
            <Link
              href="/events"
              className="text-on-surface-variant hover:text-white font-body-md flex items-center gap-1 transition-colors"
            >
              Ver todos{" "}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </Link>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px]">
              {/* Primera tarjeta: grande (8-col) */}
              <FeaturedLargeCard event={featuredEvents[0]} />

              {/* Segunda y tercera: medianas (4-col cada una) */}
              {featuredEvents.slice(1, 3).map((ev) => (
                <FeaturedMediumCard key={ev.id} event={ev} />
              ))}

              {/* Cuarta: horizontal (8-col) */}
              {featuredEvents[3] && (
                <FeaturedHorizontalCard event={featuredEvents[3]} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center glass-panel rounded-xl">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">
                event_busy
              </span>
              <h3 className="font-headline-md text-white mb-2">
                No hay eventos próximos
              </h3>
              <p className="font-body-md text-on-surface-variant max-w-md">
                Pronto anunciaremos nuevas fechas. ¡Mantente al pendiente!
              </p>
            </div>
          )}
        </section>

        {/* ════════ Directorio de Artistas ════════ */}
        <section className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto border-t border-white/5">
          <div className="flex items-end justify-between mb-stack-md">
            <h2 className="font-headline-lg text-headline-lg text-white">
              Artistas Top
            </h2>
            <Link
              href="/artists"
              className="text-on-surface-variant hover:text-white font-body-md flex items-center gap-1 transition-colors"
            >
              Ver todos{" "}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </Link>
          </div>

          {artists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {artists.map((artist) => (
                <ArtistCircle key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant font-body-md text-center py-12">
              No se encontraron artistas.
            </p>
          )}
        </section>

        {/* ════════ Trust Banner ════════ */}
        <section className="border-t border-white/5 bg-zinc-950 py-12">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-white opacity-80">
                verified_user
              </span>
              <h4 className="font-headline-md text-white">
                Boletos 100% Verificados
              </h4>
              <p className="text-on-surface-variant font-body-md text-sm max-w-xs">
                Garantía de autenticidad en cada compra mediante tecnología
                blockchain.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-white opacity-80">
                security
              </span>
              <h4 className="font-headline-md text-white">
                Fila Virtual Segura
              </h4>
              <p className="text-on-surface-variant font-body-md text-sm max-w-xs">
                Sistema anti-bots que garantiza un acceso justo a los eventos
                más demandados.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-white opacity-80">
                support_agent
              </span>
              <h4 className="font-headline-md text-white">Soporte 24/7</h4>
              <p className="text-on-surface-variant font-body-md text-sm max-w-xs">
                Asistencia premium disponible en todo momento para tu
                tranquilidad.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
