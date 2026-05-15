"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutUser } from "@/lib/actions/auth";

export default function ProfileSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/profile", label: "Overview", icon: "dashboard", exact: true },
    { href: "/profile/tickets", label: "My Tickets", icon: "confirmation_number" },
    { href: "/profile/favorites", label: "Favorites", icon: "favorite" },
    { href: "/profile/security", label: "Security", icon: "security" },
  ];

  return (
    <>
      {/* Mobile Horizontal Nav */}
      <div className="md:hidden overflow-x-auto whitespace-nowrap px-4 py-2 border-b border-white/5 no-scrollbar bg-surface/50">
        <div className="flex gap-2">
          {links.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-body-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-white/10 text-primary" 
                    : "text-zinc-400 hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop SideNavBar */}
      <aside className="hidden md:flex bg-zinc-950 text-primary font-body-md text-body-md h-screen w-64 fixed left-0 top-0 bg-surface/80 backdrop-blur-xl border-r border-white/10 shadow-2xl flex-col py-12 px-4 z-40">
        <div className="mb-12 px-4">
          <h1 className="font-display-xl text-3xl font-bold text-primary">StageFront</h1>
          <p className="font-label-caps text-xs text-zinc-400 mt-1 uppercase tracking-widest opacity-70">Premium Access</p>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {links.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isActive
                    ? "text-primary font-bold border-r-2 border-primary bg-white/5 hover:bg-white/10"
                    : "text-zinc-400 hover:bg-white/10 hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-2">
          <Link href="/help" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 font-medium hover:bg-white/10 hover:text-primary transition-all duration-300">
            <span className="material-symbols-outlined">contact_support</span>
            <span>Support</span>
          </Link>
          <button 
            onClick={() => signOutUser()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 font-medium hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 w-full text-left mt-2"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
