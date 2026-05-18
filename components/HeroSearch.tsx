"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Barra de búsqueda del Hero — Client Component.
 * Al hacer submit redirige a /events?q=<término>.
 */
export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/events?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl glass-panel rounded-full p-2 flex items-center gap-2 transition-all duration-300 focus-within:border-white/30 focus-within:bg-white/10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant ml-4 shrink-0">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-transparent border-none text-white font-body-lg text-body-lg focus:ring-0 placeholder:text-on-surface-variant/50 h-12"
        placeholder="Busca artistas, eventos o venues..."
        type="text"
      />
      <button
        type="submit"
        className="bg-primary text-on-primary px-8 py-3 rounded-full font-headline-md text-[16px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap active:scale-95"
      >
        Buscar
      </button>
    </form>
  );
}
