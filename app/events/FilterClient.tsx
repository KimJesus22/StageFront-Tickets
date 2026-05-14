"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function FilterClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado local para los inputs antes de aplicar
  const [cityOrArtist, setCityOrArtist] = useState(searchParams.get("q") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");

  const currentStatus = searchParams.get("status") || "ALL";

  // Función núcleo de actualización de URL
  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const handleSearchBlur = () => {
    updateFilters("q", cityOrArtist);
  };

  const handlePriceBlur = () => {
    updateFilters("min_price", minPrice);
    updateFilters("max_price", maxPrice);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDate(val);
    updateFilters("date", val);
  };

  const resetFilters = () => {
    setCityOrArtist("");
    setMinPrice("");
    setMaxPrice("");
    setDate("");
    router.push(pathname);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 md:p-4 w-full flex flex-col md:flex-row items-center gap-6 relative z-20 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
      {/* State Filters (Quick Tabs) */}
      <div className="flex p-1 bg-surface-container-high rounded-lg border border-white/5 w-full md:w-auto flex-shrink-0">
        <button 
          onClick={() => updateFilters("status", "ON_SALE")}
          className={`flex-1 md:flex-none px-6 py-2 rounded-md font-label-caps text-label-caps transition-all ${
            currentStatus === "ON_SALE" 
            ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-emerald-500 bg-emerald-500/10 border" 
            : "text-on-surface-variant hover:text-white"
          }`}
        >
          En Venta
        </button>
        <button 
          onClick={() => updateFilters("status", "UPCOMING")}
          className={`flex-1 md:flex-none px-6 py-2 rounded-md font-label-caps text-label-caps transition-all ${
            currentStatus === "UPCOMING" 
            ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-emerald-500 bg-emerald-500/10 border" 
            : "text-on-surface-variant hover:text-white"
          }`}
        >
          Próximamente
        </button>
      </div>

      {/* Vertical Divider (Desktop) */}
      <div className="hidden md:block w-px h-10 bg-white/10 mx-2"></div>

      <div className="flex flex-col lg:flex-row w-full gap-6 lg:gap-6 items-center">
        {/* City/Artist Selector with Internal Search */}
        <div className="relative w-full lg:w-48 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline-variant text-sm">location_on</span>
          </div>
          <input 
            value={cityOrArtist}
            onChange={(e) => setCityOrArtist(e.target.value)}
            onBlur={handleSearchBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchBlur()}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-transparent group-focus-within:border-emerald-500 group-focus-within:shadow-[0_1px_0_0_#10b981] transition-all rounded-none font-body-md text-white placeholder-outline-variant focus:ring-0 focus:outline-none" 
            placeholder="Ciudad o Artista..." 
            type="text"
          />
        </div>

        {/* Price Range Inputs */}
        <div className="flex items-center space-x-2 w-full lg:w-auto group">
          <span className="material-symbols-outlined text-outline-variant text-sm">payments</span>
          <input 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={handlePriceBlur}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
            className="w-20 px-2 py-2 bg-transparent border-b border-transparent focus:border-emerald-500 focus:shadow-[0_1px_0_0_#10b981] transition-all text-center font-body-md text-white placeholder-outline-variant focus:ring-0 focus:outline-none" 
            min="0" 
            placeholder="Min" 
            type="number"
          />
          <span className="text-outline-variant">-</span>
          <input 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={handlePriceBlur}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
            className="w-20 px-2 py-2 bg-transparent border-b border-transparent focus:border-emerald-500 focus:shadow-[0_1px_0_0_#10b981] transition-all text-center font-body-md text-white placeholder-outline-variant focus:ring-0 focus:outline-none" 
            min="0" 
            placeholder="Max" 
            type="number"
          />
        </div>

        {/* Calendar/Date Input */}
        <div className="relative w-full lg:w-40 group">
          <input 
            value={date}
            onChange={handleDateChange}
            className="w-full px-3 py-2 bg-transparent border-b border-transparent focus:border-emerald-500 focus:shadow-[0_1px_0_0_#10b981] transition-all rounded-none font-body-md text-on-surface-variant focus:text-white focus:ring-0 focus:outline-none appearance-none" 
            type="date"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="w-full md:w-auto flex justify-end flex-shrink-0 mt-4 md:mt-0">
        <button 
          onClick={resetFilters}
          className="flex items-center space-x-2 text-outline-variant hover:text-emerald-500 transition-colors font-label-caps text-label-caps px-4 py-2"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>Restablecer</span>
        </button>
      </div>
    </div>
  );
}
