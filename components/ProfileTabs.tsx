"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { updateProfile, updatePassword } from "@/lib/actions/user";
import { PasswordPolicy } from "@/lib/utils/PasswordPolicy";

type Tab = "tickets" | "settings";

export default function ProfileTabs({
  session,
  rawTickets,
}: {
  session: any;
  rawTickets: any[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("tickets");
  const [isPendingProfile, startTransitionProfile] = useTransition();
  const [isPendingPassword, startTransitionPassword] = useTransition();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── Validación en tiempo real con PasswordPolicy ──────────────────────
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length === 0) {
      setPasswordError(null);
      return;
    }
    const result = PasswordPolicy.validate(value);
    setPasswordError(result.isValid ? null : (result.error ?? null));
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransitionProfile(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        showToast(result.error, "error");
      } else if (result.success) {
        showToast(result.success, "success");
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransitionPassword(async () => {
      const result = await updatePassword(formData);
      if (result.error) {
        showToast(result.error, "error");
      } else if (result.success) {
        showToast(result.success, "success");
        form.reset();
      }
    });
  };

  const now = new Date();
  
  const activeTickets: any[] = [];
  const pastTickets: any[] = [];

  rawTickets.forEach((order) => {
    const ticket = order.tickets_inventory;
    if (!ticket) return;
    const event = ticket.events;
    if (!event) return;

    const eventDate = new Date(event.date);
    if (eventDate >= now) {
      activeTickets.push(order);
    } else {
      pastTickets.push(order);
    }
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-background font-body-md antialiased selection:bg-primary selection:text-on-primary">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg font-body-md shadow-lg transition-all animate-fade-in-up ${
            toast.type === "success" ? "bg-green-600/90 text-white" : "bg-red-600/90 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Mobile Top App Bar */}
      <div className="md:hidden flex justify-between items-center px-6 h-16 w-full sticky top-0 z-50 bg-zinc-950/50 backdrop-blur-[40px] text-white border-b border-white/10 shadow-none font-['Space_Grotesk']">
        <Link href="/" className="text-xl font-black text-white">StageFront</Link>
        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-white transition-colors focus:ring-1 focus:ring-white/20 rounded-full p-1">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button 
            onClick={() => setActiveTab("tickets")}
            className={`${activeTab === "tickets" ? "text-white" : "text-zinc-400"} hover:text-white transition-colors focus:ring-1 focus:ring-white/20 rounded-full p-1`}
          >
            <span className="material-symbols-outlined">local_activity</span>
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className="h-8 w-8 rounded-full overflow-hidden bg-surface-container"
          >
            <span className="material-symbols-outlined flex items-center justify-center w-full h-full text-zinc-400">person</span>
          </button>
        </div>
      </div>

      {/* Desktop Side Navigation Shell */}
      <aside className="hidden md:flex flex-col h-full sticky left-0 top-0 w-64 border-r border-white/10 bg-zinc-950/80 backdrop-blur-[20px] text-white shadow-none font-['Space_Grotesk'] tracking-tight z-40">
        {/* Brand */}
        <div className="p-6 pb-12 border-b border-white/10">
          <Link href="/" className="text-2xl font-bold text-white tracking-tighter">StageFront</Link>
          <p className="font-label-caps text-zinc-400 mt-2 uppercase tracking-widest">Premium Tier</p>
        </div>
        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {/* Dashboard (Inactive link to home) */}
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 font-medium hover:bg-white/5 hover:text-white transition-all duration-300">
            <span className="material-symbols-outlined">grid_view</span>
            <span>Dashboard</span>
          </Link>
          {/* My Wallet */}
          <button 
            onClick={() => setActiveTab("tickets")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activeTab === "tickets" 
                ? "text-white bg-white/10 font-bold border-l-2 border-white scale-95" 
                : "text-zinc-500 font-medium hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined" style={activeTab === "tickets" ? { fontVariationSettings: "'FILL' 1" } : {}}>account_balance_wallet</span>
            <span>My Wallet</span>
          </button>
          {/* Explore */}
          <Link href="/events" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 font-medium hover:bg-white/5 hover:text-white transition-all duration-300">
            <span className="material-symbols-outlined">explore</span>
            <span>Explore</span>
          </Link>
          {/* Account Settings */}
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activeTab === "settings" 
                ? "text-white bg-white/10 font-bold border-l-2 border-white scale-95" 
                : "text-zinc-500 font-medium hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined" style={activeTab === "settings" ? { fontVariationSettings: "'FILL' 1" } : {}}>manage_accounts</span>
            <span>Account Settings</span>
          </button>
        </nav>
        {/* CTA Footer */}
        <div className="p-6 border-t border-white/10">
          <Link href="/support" className="w-full py-3 px-4 rounded-lg bg-surface-container-high/40 backdrop-blur-md border border-white/10 text-white font-label-caps hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            Contact Concierge
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background relative">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg space-y-stack-lg relative z-10">
          
          {/* Page Header & User Profile Context */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md border-b border-surface-container-highest pb-stack-md">
            <div>
              <h2 className="font-display-xl text-display-xl text-primary">
                {activeTab === "tickets" ? "Mi Billetera Digital" : "Configuración de Cuenta"}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                {activeTab === "tickets" 
                  ? "Manage your exclusive access passes and digital collectibles." 
                  : "Manage your personal details and security preferences."}
              </p>
            </div>
            {/* User Context Card */}
            <div className="flex items-center gap-4 bg-surface-container-high/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-full md:w-auto">
              <div className="h-14 w-14 rounded-full overflow-hidden border border-outline/30 bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-400 text-3xl">person</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-primary">{session.name}</div>
                <div className="font-label-caps text-label-caps text-on-primary-container flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px] text-green-400">verified</span>
                  Verified Member
                </div>
              </div>
            </div>
          </header>

          {activeTab === "tickets" && (
            <>
              {/* Active Tickets Section */}
              <section className="space-y-stack-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-lg text-headline-lg text-primary">Active Passes</h3>
                  <span className="px-3 py-1 bg-surface-container border border-outline-variant rounded-full font-label-caps text-label-caps text-on-surface">
                    {activeTickets.length} Available
                  </span>
                </div>
                {activeTickets.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                    {activeTickets.map((order) => {
                      const ticket = order.tickets_inventory;
                      const event = ticket.events;
                      const artist = event.artists;
                      return (
                        <div key={order.id} className="group relative overflow-hidden rounded-2xl bg-surface-container-high/20 backdrop-blur-md border border-white/10 ticket-edge transition-all duration-500 hover:border-white/30 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
                          <div className="absolute inset-0 z-0">
                            {event.image_url ? (
                              <Image src={event.image_url} alt={event.title} fill className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" unoptimized />
                            ) : artist?.image_url ? (
                              <Image src={artist.image_url} alt={artist.name} fill className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" unoptimized />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen"></div>
                          </div>
                          <div className="relative z-10 p-6 flex flex-col h-full min-h-[240px] justify-between">
                            <div className="flex justify-between items-start">
                              <div className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full font-label-caps text-label-caps text-primary shadow-[0_0_12px_rgba(168,85,247,0.4)] truncate max-w-[200px]">
                                {ticket.zone}
                              </div>
                              <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                            </div>
                            <div className="space-y-4 mt-8">
                              <div>
                                <div className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase tracking-widest">{event.title}</div>
                                <h4 className="font-display-xl text-4xl text-primary leading-none">{artist?.name}</h4>
                              </div>
                              <div className="flex items-end justify-between border-t border-white/10 pt-4">
                                <div>
                                  <div className="font-body-md text-on-surface">
                                    {dateFormatter.format(new Date(event.date))} • {timeFormatter.format(new Date(event.date))}
                                  </div>
                                  <div className="font-label-caps text-on-surface-variant mt-1">{event.venue}, {event.city}</div>
                                </div>
                                <button className="bg-primary text-on-primary px-5 py-2 rounded-full font-label-caps text-label-caps hover:bg-white/90 transition-colors">
                                  Ver Código QR
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2">local_activity</span>
                    <p className="text-zinc-400 font-body-md">No tienes boletos activos.</p>
                  </div>
                )}
              </section>

              {/* Past Tickets Section */}
              <section className="space-y-stack-md pt-stack-sm">
                <h3 className="font-headline-md text-headline-md text-on-surface-variant">Boletos Pasados</h3>
                {pastTickets.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {pastTickets.map((order) => {
                      const ticket = order.tickets_inventory;
                      const event = ticket.events;
                      const artist = event.artists;
                      return (
                        <div key={order.id} className="flex flex-col md:flex-row md:items-center gap-6 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                          <div className="h-32 md:h-20 w-full md:w-32 rounded-lg overflow-hidden shrink-0 relative bg-surface-container">
                            {event.image_url ? (
                              <Image src={event.image_url} alt={event.title} fill className="object-cover" unoptimized />
                            ) : artist?.image_url ? (
                              <Image src={artist.image_url} alt={artist.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                <span className="material-symbols-outlined text-outline text-3xl">music_note</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-headline-md text-headline-md text-primary">{artist?.name || event.title}</div>
                            <div className="font-body-md text-on-surface-variant">{event.title} • {event.venue}</div>
                          </div>
                          <div className="md:text-right flex flex-row md:flex-col justify-between items-center md:items-end mt-2 md:mt-0">
                            <div className="font-label-caps text-label-caps text-on-surface">{dateFormatter.format(new Date(event.date))}</div>
                            <div className="font-label-caps text-label-caps text-on-surface-variant md:mt-1">Attended</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-zinc-500 font-body-md">No tienes historial de boletos pasados.</p>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "settings" && (
            <section className="space-y-stack-md animate-fade-in-up">
              <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-caps text-label-caps text-on-surface">Full Name</label>
                    <input 
                      name="name"
                      defaultValue={session.name}
                      required
                      className="w-full bg-white/5 border border-outline-variant/30 rounded-lg px-4 py-3 text-primary font-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/50" 
                      type="text" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-caps text-label-caps text-on-surface">Email Address</label>
                    <input 
                      name="email"
                      defaultValue={session.email}
                      readOnly
                      disabled
                      className="w-full bg-white/5 border border-outline-variant/30 rounded-lg px-4 py-3 text-zinc-500 font-body-md cursor-not-allowed opacity-70" 
                      type="email" 
                    />
                    <p className="text-xs text-zinc-500">El correo electrónico no puede cambiarse aquí.</p>
                  </div>
                </div>
                <div className="pt-2 flex gap-4 border-b border-surface-container-highest pb-8">
                  <button 
                    disabled={isPendingProfile}
                    className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps hover:bg-white/90 transition-colors disabled:opacity-50" 
                    type="submit"
                  >
                    {isPendingProfile ? "Guardando..." : "Guardar Perfil"}
                  </button>
                </div>
              </form>

              <form onSubmit={handleUpdatePassword} onReset={() => setPasswordError(null)} className="max-w-2xl space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface">New Password</label>
                  <div className="relative">
                    <input 
                      name="password"
                      required
                      minLength={6}
                      onChange={handlePasswordChange}
                      className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-primary font-body-md focus:outline-none focus:ring-1 transition-all tracking-widest ${
                        passwordError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-outline-variant/30 focus:ring-primary focus:border-primary"
                      }`}
                      type="password" 
                      placeholder="••••••••••••"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </span>
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-xs font-body-md mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {passwordError}
                    </p>
                  )}
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    disabled={isPendingPassword || !!passwordError}
                    className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    type="submit"
                  >
                    {isPendingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                  </button>
                  <button 
                    type="reset"
                    className="px-6 py-3 rounded-lg bg-transparent border border-outline-variant text-on-surface font-label-caps text-label-caps hover:bg-surface-container transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Spacer for mobile scroll */}
          <div className="h-12 md:hidden"></div>
        </div>
      </main>
    </div>
  );
}
