import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { insforge } from "@/lib/insforge";
import Link from "next/link";
import React from "react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Middleware de Seguridad (RBAC)
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("role")
    .eq("id", session.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="bg-zinc-950 text-on-surface font-['Inter'] antialiased flex h-screen overflow-hidden dark">
      {/* SideNavBar */}
      <nav className="bg-zinc-950 border-r border-white/10 h-screen w-64 fixed left-0 top-0 z-50 shadow-2xl shadow-black/50 flex flex-col py-6 gap-2 shrink-0">
        <div className="px-6 mb-8">
          <Link href="/admin">
            <h1 className="text-white font-black tracking-widest font-['Space_Grotesk'] text-2xl uppercase">Nexus Ticketing</h1>
            <p className="text-zinc-400 font-['Inter'] text-[10px] uppercase tracking-widest font-semibold mt-1">Enterprise Portal</p>
          </Link>
        </div>
        <div className="px-4 mb-4">
          <button className="w-full bg-white text-zinc-950 font-['Inter'] text-[12px] uppercase tracking-widest font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            New Event
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link href="/admin" className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium">
                <span className="material-symbols-outlined">dashboard</span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium">
                <span className="material-symbols-outlined">group</span>
                Users
              </Link>
            </li>
            <li>
              <Link href="/admin/events" className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium">
                <span className="material-symbols-outlined">confirmation_number</span>
                Events
              </Link>
            </li>
            <li>
              <Link href="/admin/orders" className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium">
                <span className="material-symbols-outlined">receipt_long</span>
                Orders
              </Link>
            </li>
            <li>
              <Link href="/admin/tickets" className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium">
                <span className="material-symbols-outlined">qr_code</span>
                Tickets
              </Link>
            </li>
          </ul>
        </div>
        <div className="mt-auto pt-4 border-t border-white/10">
          <ul className="space-y-1">
            <li>
              <Link href="#" className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium">
                <span className="material-symbols-outlined">shield</span>
                Security
              </Link>
            </li>
            <li>
              <Link href="/" className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium">
                <span className="material-symbols-outlined">logout</span>
                Exit to App
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* TopAppBar */}
        <header className="bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/10 flex justify-between items-center w-full px-6 h-16 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-white/5 border-none rounded-full pl-10 pr-4 py-1.5 text-sm font-['Inter'] text-white focus:ring-1 focus:ring-white focus:bg-white/10 transition-colors placeholder:text-zinc-500 w-64 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors p-2 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors p-2 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors p-2 rounded-full flex items-center justify-center mr-4 border-r border-white/10 pr-6">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold border border-white/20">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="font-['Inter'] text-sm text-white font-medium">{session.name}</p>
                <p className="font-['Inter'] text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
