import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-zinc-950/60 backdrop-blur-lg border-b border-white/10 shadow-none font-headline-md font-medium tracking-tight">
      <div className="flex justify-between items-center px-8 py-4 max-w-full mx-auto">
        <Link
          href="/"
          className="text-xl font-bold tracking-tighter text-white"
        >
          StageFront Tickets
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#"
            className="text-white border-b border-white pb-1 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Descubrir
          </Link>
          <Link
            href="#"
            className="text-zinc-400 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Eventos
          </Link>
          <Link
            href="#"
            className="text-zinc-400 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Artistas
          </Link>
          <Link
            href="#"
            className="text-zinc-400 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Pases
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Search (desktop only) */}
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              className="bg-surface-container-high/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-white/30 focus:bg-surface-container-high transition-colors w-64 font-body-md"
              placeholder="Buscar eventos..."
              type="text"
            />
          </div>
          <button className="text-zinc-400 hover:text-white font-body-md text-sm transition-colors">
            Iniciar Sesión
          </button>
          <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-body-md text-sm font-semibold hover:bg-white/90 transition-colors">
            Unirse a la lista
          </button>
        </div>
      </div>
    </nav>
  );
}
