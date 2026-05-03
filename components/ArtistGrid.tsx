import Image from "next/image";
import Link from "next/link";

interface ArtistCardProps {
  name: string;
  slug: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
  imageSrc: string;
  gradientOverlay: string;
  hoverGradientOverlay: string;
  wide?: boolean;
}

function ArtistCard({
  name,
  slug,
  badge,
  badgeColor,
  borderColor,
  glowColor,
  description,
  imageSrc,
  gradientOverlay,
  hoverGradientOverlay,
  wide = false,
}: ArtistCardProps) {
  return (
    <div
      className={`group relative h-[400px] rounded-xl overflow-hidden bg-surface-container-low border border-white/5 transition-all duration-500 hover:border-white/20 hover:-translate-y-1${
        wide ? " lg:col-span-2" : ""
      }`}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

      {/* Accent color backdrop */}
      <div
        className={`absolute inset-0 ${gradientOverlay} mix-blend-overlay ${hoverGradientOverlay} transition-colors duration-500 z-0`}
      />

      {/* Artist Image */}
      <Image
        alt={`${name} Event`}
        src={imageSrc}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:blur-[2px] opacity-60 group-hover:opacity-40"
        sizes={wide ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
        unoptimized
      />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
        <div className="transform transition-transform duration-300 translate-y-8 group-hover:translate-y-0">
          <span
            className={`inline-block px-3 py-1 bg-surface-container-highest/80 backdrop-blur-md rounded-full font-label-caps text-label-caps ${badgeColor} ${borderColor} mb-3`}
            style={{ boxShadow: `0 0 12px ${glowColor}` }}
          >
            {badge}
          </span>
          <h3 className="font-headline-md text-headline-md text-primary mb-1 drop-shadow-md">
            {name}
          </h3>
          <p className="font-body-md text-sm text-on-surface-variant mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            {description}
          </p>
          <Link
            href={`/${slug}`}
            className={`block ${
              wide ? "w-full sm:w-auto sm:inline-block px-8" : "w-full"
            } py-3 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 text-white font-body-md font-medium text-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:border-white/40 delay-150`}
          >
            Explorar
          </Link>
        </div>
      </div>
    </div>
  );
}

const ARTISTS: ArtistCardProps[] = [
  {
    name: "BTS",
    slug: "bts",
    badge: "GIRA MUNDIAL",
    badgeColor: "text-purple-300",
    borderColor: "border border-purple-500/30",
    glowColor: "rgba(168,85,247,0.15)",
    description: "Pases en tendencia y tours de alta demanda",
    imageSrc: "https://prismic-images.tmol.io/ticketmaster-tm-global/aWZmqwIvOtkhBc5Z_EADP-Desktop-Header-updated.png?auto=format%2Ccompress&rect=1%2C0%2C2425%2C1023&w=2048&h=864",
    gradientOverlay: "bg-purple-500/10",
    hoverGradientOverlay: "group-hover:bg-purple-500/20",
  },
  {
    name: "TXT",
    slug: "txt",
    badge: "NUEVA GIRA EN ARENAS",
    badgeColor: "text-teal-300",
    borderColor: "border border-teal-500/30",
    glowColor: "rgba(20,184,166,0.15)",
    description: "Múltiples recintos en Norteamérica y Asia",
    imageSrc: "https://media.ticketmaster.com/tm/en-us/dam/a/c83/ef56ac43-2fb0-4ad1-ab6a-fd9295810c83_CUSTOM.jpg",
    gradientOverlay: "bg-gradient-to-br from-teal-500/10 to-blue-500/10",
    hoverGradientOverlay:
      "group-hover:from-teal-500/20 group-hover:to-blue-500/20",
    wide: true,
  },
  {
    name: "Blackpink",
    slug: "blackpink",
    badge: "CIERRE DE GIRA",
    badgeColor: "text-pink-300",
    borderColor: "border border-pink-500/30",
    glowColor: "rgba(236,72,153,0.15)",
    description: "Londres, París, Berlín",
    imageSrc: "https://media.ticketmaster.com/tm/en-us/dam/a/f1a/9f9df134-17b4-4a88-9122-ea21ebda0f1a_CUSTOM.jpg",
    gradientOverlay: "bg-pink-500/10",
    hoverGradientOverlay: "group-hover:bg-pink-500/20",
  },
  {
    name: "Twenty One Pilots",
    slug: "twenty-one-pilots",
    badge: "TOUR CLANCY",
    badgeColor: "text-yellow-300",
    borderColor: "border border-yellow-500/30",
    glowColor: "rgba(234,179,8,0.15)",
    description: "Norteamérica",
    imageSrc:
      "https://media.ticketmaster.com/tm/en-us/dam/a/948/63086554-6a06-4b5a-bb00-991e45c25948_CUSTOM.jpg",
    gradientOverlay: "bg-gradient-to-br from-yellow-500/10 to-red-500/10",
    hoverGradientOverlay:
      "group-hover:from-yellow-500/20 group-hover:to-red-500/20",
  },
];

export default function ArtistGrid() {
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
        {ARTISTS.map((artist) => (
          <ArtistCard key={artist.slug} {...artist} />
        ))}
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
