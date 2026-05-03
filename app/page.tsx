import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ArtistGrid from "@/components/ArtistGrid";
import Footer from "@/components/Footer";
import { getArtists } from "@/lib/actions/artists";

export default async function Home() {
  const artists = await getArtists();

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24">
        <HeroSection />
        <ArtistGrid artists={artists} />
      </main>
      <Footer />
    </>
  );
}
