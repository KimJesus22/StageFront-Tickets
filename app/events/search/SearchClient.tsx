"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { searchEvents } from "@/lib/actions/search";

export default function SearchClient({ initialEvents }: { initialEvents: any[] }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<any[]>(initialEvents);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Debounce en el Cliente (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 2. Modo Híbrido de Filtrado
  const localFilteredResults = useMemo(() => {
    if (!debouncedQuery) return initialEvents;
    
    const lowerQuery = debouncedQuery.toLowerCase();
    return initialEvents.filter(event => {
      return (
        (event.title && event.title.toLowerCase().includes(lowerQuery)) ||
        (event.artist_name && event.artist_name.toLowerCase().includes(lowerQuery)) ||
        (event.city && event.city.toLowerCase().includes(lowerQuery)) ||
        (event.venue_name && event.venue_name.toLowerCase().includes(lowerQuery)) ||
        (event.artists && event.artists.name && event.artists.name.toLowerCase().includes(lowerQuery))
      );
    });
  }, [debouncedQuery, initialEvents]);

  // Si la búsqueda local no arroja resultados o queremos garantizar datos frescos,
  // disparamos la consulta a PostgreSQL
  const performServerSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setResults(initialEvents);
      return;
    }

    setIsSearching(true);
    try {
      const serverResults = await searchEvents(searchQuery);
      setResults(serverResults);
    } catch (error) {
      console.error("Error al buscar en el servidor", error);
    } finally {
      setIsSearching(false);
    }
  }, [initialEvents]);

  useEffect(() => {
    if (debouncedQuery && localFilteredResults.length === 0) {
      // Fallback al servidor si no hay coincidencias locales
      performServerSearch(debouncedQuery);
    } else {
      // Usar resultados locales instantáneos
      setResults(debouncedQuery ? localFilteredResults : initialEvents);
    }
  }, [debouncedQuery, localFilteredResults, performServerSearch, initialEvents]);

  return (
    <main className="relative min-h-screen flex flex-col justify-center items-center px-4 md:px-12 pt-[100px] pb-12 bg-[#0e0e0e] text-[#e5e2e1] overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#474649]/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#e2e2e2]/10 rounded-full blur-[80px]"></div>
        {/* Grid Pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[800px] flex flex-col items-center gap-12">
        <div className="text-center space-y-2">
          <h1 className="font-['Space_Grotesk'] text-5xl md:text-[64px] font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] tracking-tight">
            FIND YOUR VIBE
          </h1>
          <p className="font-['Inter'] text-lg text-zinc-400">Global access to exclusive events.</p>
        </div>

        {/* Search Container */}
        <div className="w-full relative group">
          <div className={`relative flex items-center w-full h-[72px] bg-white/5 backdrop-blur-2xl border ${isFocused ? 'border-[#39FF14]/50 bg-white/10' : 'border-white/10'} rounded-xl overflow-hidden transition-all duration-300`}>
            <span className={`material-symbols-outlined text-[32px] ml-6 transition-colors ${isFocused ? 'text-[#39FF14]' : 'text-zinc-500'}`}>
              search
            </span>
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full h-full bg-transparent border-none text-white font-['Space_Grotesk'] text-2xl px-4 placeholder:text-zinc-600 focus:outline-none focus:ring-0" 
              placeholder="Search artists, venues, cities..." 
              type="text"
            />
            {/* Date Picker Trigger */}
            <button className="h-full px-6 border-l border-white/10 flex items-center gap-2 hover:bg-white/5 transition-colors hidden sm:flex">
              <span className="material-symbols-outlined text-zinc-500">calendar_month</span>
              <span className="font-['Inter'] text-base text-white whitespace-nowrap">Any Date</span>
            </button>
          </div>

          {/* Autocomplete Dropdown (Glassmorphic) */}
          {query.trim() !== "" && (
            <div className={`absolute top-[80px] left-0 w-full bg-[#2a2a2a]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col z-40 transition-all duration-300 ${isFocused || results.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <span className="font-['Inter'] text-xs text-zinc-400 uppercase tracking-widest font-semibold">
                  {isSearching ? "Buscando en PostgreSQL..." : "Resultados"}
                </span>
                <span className="font-['Inter'] text-xs text-zinc-500">
                  {results.length} coincidencias
                </span>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((event) => (
                  <a key={event.id} href={`/event/${event.id}`} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-[#39FF14]">
                    <div className="w-12 h-12 rounded-lg bg-surface-variant overflow-hidden shrink-0">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                          <span className="material-symbols-outlined text-zinc-500">confirmation_number</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Space_Grotesk'] text-lg font-medium text-white">{event.title}</span>
                      <span className="font-['Inter'] text-sm text-zinc-400">
                        {event.artist_name || (event.artists && event.artists.name)} • {event.city || "Ciudad no especificada"}
                      </span>
                    </div>
                  </a>
                ))}

                {!isSearching && results.length === 0 && (
                  <div className="p-8 text-center text-zinc-500">
                    <p>No se encontraron resultados para "{query}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-4 w-full">
          {["Artistas", "Ciudades", "Recintos", "Eventos"].map(filter => (
            <button key={filter} className="px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md font-['Inter'] text-base text-white hover:bg-white/10 hover:border-white/40 transition-all shadow-[0_0_12px_rgba(255,255,255,0.05)]">
              {filter}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
