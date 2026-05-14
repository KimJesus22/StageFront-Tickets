import { searchEvents } from "@/lib/actions/search";
import SearchClient from "./SearchClient";

export const metadata = {
  title: "Search Events - StageFront",
};

export default async function SearchPage() {
  // Pre-cargar eventos destacados/próximos para el modo híbrido
  const initialEvents = await searchEvents("");

  return (
    <>
      <SearchClient initialEvents={initialEvents} />
    </>
  );
}
