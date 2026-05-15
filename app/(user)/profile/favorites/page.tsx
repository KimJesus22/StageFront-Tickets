import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserFavorites } from "@/lib/actions/favorites";
import ArtistGrid from "@/components/ArtistGrid";

export const metadata = {
  title: "Mis Favoritos — StageFront Tickets",
  description: "Revisa los artistas y festivales que has marcado.",
};

export default async function ProfileFavoritesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { artists } = await getUserFavorites(session.id);

  return (
    <>
      <header className="mb-8 flex flex-col gap-1">
        <h2 className="font-headline-lg text-3xl font-bold text-white">Mis Favoritos</h2>
        <p className="text-zinc-400">Revisa los artistas y festivales que has marcado para seguir su disponibilidad.</p>
      </header>
      
      {artists.length === 0 ? (
        <div className="p-12 text-center border border-white/10 rounded-xl bg-white/[0.02]">
          <p className="text-zinc-400">Aún no tienes artistas favoritos.</p>
        </div>
      ) : (
        <div className="-mx-4 md:-mx-12 -mt-12">
          {/* Usamos el ArtistGrid existente pero ajustando márgenes ya que tiene su propio layout */}
          <ArtistGrid artists={artists} />
        </div>
      )}
    </>
  );
}
