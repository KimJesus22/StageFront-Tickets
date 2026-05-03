import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-body-md">
      {/* Sidebar Fijo */}
      <aside className="w-64 fixed h-full border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl flex flex-col z-40">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="font-headline-md font-bold text-xl tracking-tight text-white flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
            Admin Panel
          </Link>
        </div>

        <nav className="flex-grow p-4 flex flex-col gap-2">
          <p className="px-3 text-xs font-label-caps text-zinc-500 mb-2 mt-4 tracking-widest">PRINCIPAL</p>
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-300 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Dashboard General
          </Link>
          <Link 
            href="/admin/events" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-300 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">stadium</span>
            Gestión de Eventos
          </Link>
          <Link 
            href="/admin/sales" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-300 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            Ventas
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <span className="material-symbols-outlined text-[18px]">exit_to_app</span>
            Volver al sitio web
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
