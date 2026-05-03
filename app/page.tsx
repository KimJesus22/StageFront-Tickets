import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ArtistGrid from "@/components/ArtistGrid";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24">
        <HeroSection />
        <ArtistGrid />
      </main>
      <Footer />
    </>
  );
}
