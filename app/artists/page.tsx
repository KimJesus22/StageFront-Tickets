import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getArtists } from "@/lib/actions/artists";

export const metadata = {
  title: "Artistas Exclusivos — StageFront Tickets",
  description:
    "Explora el universo de tus ídolos y descubre sus próximas fechas.",
};

const ARTIST_COLORS: Record<string, string> = {
  bts: "#8b5cf6",
  txt: "#06b6d4",
  blackpink: "#ec4899",
  "twenty-one-pilots": "#eab308",
};

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24 pb-32 md:pt-32 md:pb-margin-desktop px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full min-h-screen">
        <section className="text-center mb-stack-lg flex flex-col items-center">
          <h1 className="font-display-xl text-display-xl text-primary mb-stack-sm">
            Artistas Exclusivos
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Explora el universo de tus ídolos y descubre sus próximas fechas
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter gap-y-24 mt-20">
          {artists.map((artist) => {
            const glowColor = ARTIST_COLORS[artist.slug] || "#353434";
            // convert hex to rgba for the shadow
            let shadowColor = "rgba(255,255,255,0.1)";
            if (glowColor === "#8b5cf6") shadowColor = "rgba(139,92,246,0.3)";
            else if (glowColor === "#06b6d4") shadowColor = "rgba(6,182,212,0.3)";
            else if (glowColor === "#ec4899") shadowColor = "rgba(236,72,153,0.3)";
            else if (glowColor === "#eab308") shadowColor = "rgba(234,179,8,0.3)";

            return (
              <article
                key={artist.id}
                className="relative mt-16 bg-surface-container/30 backdrop-blur-2xl border border-outline-variant/30 rounded-xl p-6 pt-20 flex flex-col items-center transition-all hover:bg-surface-container/50 hover:border-outline/50 group"
              >
                <div className="absolute -top-16 w-32 h-32 z-10 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60"
                    style={{ backgroundColor: glowColor }}
                  />
                  {artist.image_url ? (
                    <Image
                      src={artist.image_url}
                      alt={artist.name}
                      fill
                      className="rounded-full object-cover border-4 border-surface-container z-10 relative"
                      sizes="(max-width: 768px) 128px, 128px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full rounded-full border-4 border-surface-container z-10 relative bg-surface-container-high" />
                  )}
                </div>
                
                <h2 className="font-headline-md text-headline-md text-primary mt-4 text-center">
                  {artist.name}
                </h2>
                
                {artist.fandom_name && (
                  <div
                    className="font-label-caps text-label-caps text-on-surface-variant bg-surface-variant/50 px-4 py-1.5 rounded-full mt-3"
                    style={{ boxShadow: `0 0 12px ${shadowColor}` }}
                  >
                    {artist.fandom_name}
                  </div>
                )}
                
                <Link
                  href={`/${artist.slug}`}
                  className="mt-stack-md w-full py-3 bg-primary/5 border border-primary/10 rounded-lg font-label-caps text-label-caps text-primary hover:bg-primary/15 transition-colors backdrop-blur-md text-center block"
                >
                  Ver Perfil y Eventos
                </Link>
              </article>
            );
          })}
        </section>
      </main>
      <Footer />
    </>
  );
}
