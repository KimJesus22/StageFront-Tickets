import { getArtists } from "@/lib/actions/artists";
import ArtistClient from "./ArtistClient";

export default async function AdminArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ArtistClient initialArtists={artists} />
    </div>
  );
}
