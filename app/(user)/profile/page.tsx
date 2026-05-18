import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const name = session.name || session.email?.split("@")[0] || "User";
  const initials = name.substring(0, 2).toUpperCase();
  const joinedDate = "";

  return (
    <>
      <header className="mb-12 flex flex-col gap-1">
        <h2 className="font-headline-lg text-3xl font-bold text-white">Vista General</h2>
        <p className="text-zinc-400">Gestiona tu perfil y tu experiencia en StageFront.</p>
      </header>

      {/* Identity Card */}
      <section className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden group hover:bg-white/[0.05] hover:border-white/20 transition-all">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-zinc-800 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] z-10 shrink-0">
          <span className="font-headline-lg text-3xl font-bold text-white">{initials}</span>
        </div>
        
        <div className="flex flex-col items-center md:items-start text-center md:text-left z-10 flex-1">
          <h3 className="font-headline-md text-2xl font-bold text-white mb-1">{name}</h3>
          <p className="text-zinc-400 mb-4">{session.email}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
            <span className="font-label-caps text-xs text-zinc-300 tracking-wider uppercase">Miembro desde: {joinedDate}</span>
          </div>
        </div>
        
        <div className="z-10 w-full md:w-auto mt-4 md:mt-0">
          <button className="w-full md:w-auto px-6 py-3 rounded-lg bg-transparent border border-white/20 text-white font-medium hover:bg-white/5 transition-all duration-300">
            Editar Perfil
          </button>
        </div>
      </section>

      {/* Quick Access Grid */}
      <section>
        <h4 className="font-headline-md text-xl font-bold text-white mb-6">Accesos Rápidos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/profile/tickets" className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-xl flex flex-col gap-4 group transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] hover:border-white/20">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
              </svg>
            </div>
            <div className="flex-1 mt-2">
              <h5 className="font-headline-md text-lg font-bold text-white mb-2 transition-colors">Mis Boletos</h5>
              <p className="text-sm text-zinc-400">Accede a tus pases digitales y códigos QR para próximos eventos.</p>
            </div>
          </a>

          <a href="/profile/favorites" className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-xl flex flex-col gap-4 group transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] hover:border-white/20">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <div className="flex-1 mt-2">
              <h5 className="font-headline-md text-lg font-bold text-white mb-2 transition-colors">Mis Favoritos</h5>
              <p className="text-sm text-zinc-400">Revisa los artistas y festivales que has marcado para seguir su disponibilidad.</p>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
