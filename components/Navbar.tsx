import Link from "next/link";
import { getSession } from "@/lib/actions/auth";
import UserDropdown from "@/components/UserDropdown";
import NotificationCenter from "./NotificationCenter";

export default async function Navbar() {
  const session = await getSession();

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
            href="/"
            className="text-white border-b border-white pb-1 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Descubrir
          </Link>
          <Link
            href="/events"
            className="text-zinc-400 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Eventos
          </Link>
          <Link
            href="/artists"
            className="text-zinc-400 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Artistas
          </Link>
          <Link
            href="/wallet"
            className="text-zinc-400 hover:text-white hover:backdrop-blur-2xl transition-all duration-300 active:scale-95"
          >
            Pases
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Search (desktop only) */}
          <div className="relative hidden lg:block">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors w-64 font-body-md"
              placeholder="Buscar eventos..."
              type="text"
            />
          </div>
          
          {session ? (
            <div className="flex items-center gap-4 ml-4">
              <NotificationCenter userId={session.id} />
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-white text-sm font-semibold">{session.name}</span>
                <span className="text-zinc-500 text-xs">{session.email}</span>
              </div>
              <Link 
                href="/wallet"
                className="bg-white/10 text-white px-4 py-2 rounded-full font-body-md text-sm font-semibold hover:bg-white/20 transition-colors border border-white/10 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                </svg>
                Billetera
              </Link>
              {/* UserDropdown — Client Component con logout funcional */}
              <UserDropdown session={session} />
            </div>
          ) : (
            <>
              <Link href="/login" className="text-zinc-400 hover:text-white font-body-md text-sm transition-colors px-2">
                Iniciar Sesión
              </Link>
              <Link href="/register" className="bg-primary text-on-primary px-6 py-2 rounded-full font-body-md text-sm font-semibold hover:bg-white/90 transition-colors">
                Unirse a la lista
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
