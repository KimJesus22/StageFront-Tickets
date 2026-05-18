"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex fixed left-0 top-0 h-full z-40 flex-col p-6 w-64 border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl">
      <div className="mb-12">
        <h1 className="text-xl font-bold text-white tracking-tighter font-headline-md">
          Portal Artista
        </h1>
        <p className="text-surface-tint font-label-caps text-label-caps mt-1">
          Premium Access
        </p>
      </div>
      <ul className="flex flex-col gap-2 flex-grow">
        <li>
          <Link
            href="/portal"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 scale-95 active:scale-90 font-label-caps text-label-caps ${
              pathname === "/portal"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white hover:bg-white/5 hover:backdrop-blur-md"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 hover:backdrop-blur-md transition-colors rounded-lg font-label-caps text-label-caps"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            Mis Eventos
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 hover:backdrop-blur-md transition-colors rounded-lg font-label-caps text-label-caps"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
            </svg>
            Ventas
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 hover:backdrop-blur-md transition-colors rounded-lg font-label-caps text-label-caps"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Configuración
          </Link>
        </li>
      </ul>
      <div className="mt-auto">
        <button className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-opacity">
          Crear Evento
        </button>
      </div>
    </nav>
  );
}
