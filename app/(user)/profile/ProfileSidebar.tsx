"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutUser } from "@/lib/actions/auth";

export default function ProfileSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/profile", label: "Overview", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>, exact: true },
    { href: "/profile/tickets", label: "My Tickets", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg> },
    { href: "/profile/favorites", label: "Favorites", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> },
    { href: "/profile/security", label: "Security", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
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
                <span className="shrink-0">{link.icon}</span>
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
                <span className={`shrink-0 transition-all ${isActive ? "text-primary" : "text-zinc-400"}`}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-2">
          <Link href="/help" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 font-medium hover:bg-white/10 hover:text-primary transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
            </svg>
            <span>Support</span>
          </Link>
          <button 
            onClick={() => signOutUser()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 font-medium hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 w-full text-left mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
