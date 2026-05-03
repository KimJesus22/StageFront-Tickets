import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/types/database";

// ============================================================
// Configuración visual por artista (colores de acento, badges)
// ============================================================
// Estos datos son de presentación y no van en la DB.
// Se mapean por slug para que cada artista tenga su estética.

interface ArtistVisualConfig {
  badge: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
  gradientOverlay: string;
  hoverGradientOverlay: string;
  wide?: boolean;
}

const ARTIST_VISUALS: Record<string, ArtistVisualConfig> = {
  bts: {
    badge: "GIRA MUNDIAL",
    badgeColor: "text-purple-300",
    borderColor: "border border-purple-500/30",
    glowColor: "rgba(168,85,247,0.15)",
    description: "Pases en tendencia y tours de alta demanda",
    gradientOverlay: "bg-purple-500/10",
    hoverGradientOverlay: "group-hover:bg-purple-500/20",
  },
  txt: {
    badge: "NUEVA GIRA EN ARENAS",
    badgeColor: "text-teal-300",
    borderColor: "border border-teal-500/30",
    glowColor: "rgba(20,184,166,0.15)",
    description: "Múltiples recintos en Norteamérica y Asia",
    gradientOverlay: "bg-gradient-to-br from-teal-500/10 to-blue-500/10",
    hoverGradientOverlay:
      "group-hover:from-teal-500/20 group-hover:to-blue-500/20",
    wide: true,
  },
  blackpink: {
    badge: "CIERRE DE GIRA",
    badgeColor: "text-pink-300",
    borderColor: "border border-pink-500/30",
    glowColor: "rgba(236,72,153,0.15)",
    description: "Londres, París, Berlín",
    gradientOverlay: "bg-pink-500/10",
    hoverGradientOverlay: "group-hover:bg-pink-500/20",
  },
  "twenty-one-pilots": {
    badge: "TOUR CLANCY",
    badgeColor: "text-yellow-300",
    borderColor: "border border-yellow-500/30",
    glowColor: "rgba(234,179,8,0.15)",
    description: "Norteamérica",
    gradientOverlay: "bg-gradient-to-br from-yellow-500/10 to-red-500/10",
    hoverGradientOverlay:
      "group-hover:from-yellow-500/20 group-hover:to-red-500/20",
  },
};

// Fallback visual para artistas sin config personalizada
const DEFAULT_VISUAL: ArtistVisualConfig = {
  badge: "NUEVO",
  badgeColor: "text-zinc-300",
  borderColor: "border border-zinc-500/30",
  glowColor: "rgba(161,161,170,0.15)",
  description: "Próximamente",
  gradientOverlay: "bg-zinc-500/10",
  hoverGradientOverlay: "group-hover:bg-zinc-500/20",
};

// ============================================================
// Componente ArtistCard
// ============================================================

function ArtistCard({
  artist,
  visuals,
}: {
  artist: Artist;
  visuals: ArtistVisualConfig;
}) {
  return (
    <div
      className={`group relative h-[400px] rounded-xl overflow-hidden bg-surface-container-low border border-white/5 transition-all duration-500 hover:border-white/20 hover:-translate-y-1${
        visuals.wide ? " lg:col-span-2" : ""
      }`}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

      {/* Accent color backdrop */}
      <div
        className={`absolute inset-0 ${visuals.gradientOverlay} mix-blend-overlay ${visuals.hoverGradientOverlay} transition-colors duration-500 z-0`}
      />

      {/* Artist Image */}
      {artist.image_url && (
        <Image
          alt={`${artist.name} Event`}
          src={artist.image_url}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:blur-[2px] opacity-60 group-hover:opacity-40"
          sizes={
            visuals.wide
              ? "(max-width: 1024px) 100vw, 50vw"
              : "(max-width: 768px) 100vw, 25vw"
          }
          unoptimized
        />
      )}

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
        <div className="transform transition-transform duration-300 translate-y-8 group-hover:translate-y-0">
          <span
            className={`inline-block px-3 py-1 bg-surface-container-highest/80 backdrop-blur-md rounded-full font-label-caps text-label-caps ${visuals.badgeColor} ${visuals.borderColor} mb-3`}
            style={{ boxShadow: `0 0 12px ${visuals.glowColor}` }}
          >
            {visuals.badge}
          </span>
          <h3 className="font-headline-md text-headline-md text-primary mb-1 drop-shadow-md">
            {artist.name}
          </h3>
          <p className="font-body-md text-sm text-on-surface-variant mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            {visuals.description}
          </p>
          <Link
            href={`/${artist.slug}`}
            className={`block ${
              visuals.wide
                ? "w-full sm:w-auto sm:inline-block px-8"
                : "w-full"
            } py-3 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 text-white font-body-md font-medium text-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:border-white/40 delay-150`}
          >
            Explorar
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Componente ArtistGrid (recibe artistas desde la DB)
// ============================================================

interface ArtistGridProps {
  artists: Artist[];
}

export default function ArtistGrid({ artists }: ArtistGridProps) {
  return (
    <section className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
            Artistas Exclusivos
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Pases en tendencia y tours de alta demanda
          </p>
        </div>
        <button className="hidden md:flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body-md text-sm">
          Ver Todo{" "}
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {artists.map((artist) => {
          const visuals = ARTIST_VISUALS[artist.slug] ?? DEFAULT_VISUAL;
          return (
            <ArtistCard key={artist.id} artist={artist} visuals={visuals} />
          );
        })}
      </div>

      {/* Mobile: View All */}
      <button className="md:hidden mt-6 w-full flex items-center justify-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body-md text-sm py-4 border border-white/5 rounded-lg">
        Ver Todos los Eventos{" "}
        <span className="material-symbols-outlined text-sm">
          arrow_forward
        </span>
      </button>
    </section>
  );
}
