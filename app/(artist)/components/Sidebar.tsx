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
            <span className="material-symbols-outlined" data-icon="dashboard">
              dashboard
            </span>
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 hover:backdrop-blur-md transition-colors rounded-lg font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined" data-icon="event">
              event
            </span>
            Mis Eventos
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 hover:backdrop-blur-md transition-colors rounded-lg font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined" data-icon="payments">
              payments
            </span>
            Ventas
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 hover:backdrop-blur-md transition-colors rounded-lg font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined" data-icon="settings">
              settings
            </span>
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
