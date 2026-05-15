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
            <span className="material-symbols-outlined text-[16px] text-zinc-300">verified_user</span>
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
              <span className="material-symbols-outlined text-[28px] text-white">confirmation_number</span>
            </div>
            <div className="flex-1 mt-2">
              <h5 className="font-headline-md text-lg font-bold text-white mb-2 transition-colors">Mis Boletos</h5>
              <p className="text-sm text-zinc-400">Accede a tus pases digitales y códigos QR para próximos eventos.</p>
            </div>
          </a>

          <a href="/profile/favorites" className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-xl flex flex-col gap-4 group transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] hover:border-white/20">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[28px] text-white">favorite</span>
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
