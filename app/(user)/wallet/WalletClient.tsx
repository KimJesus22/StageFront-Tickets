"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SecureTicketQR from "@/components/SecureTicketQR";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WalletClientProps {
  session: {
    id: string;
    email: string;
    name: string;
  };
  rawTickets: any[];
}

interface SelectedTicket {
  ticketId: string;
  orderId: string;
  eventId: string;
  seatNumber: string;
  zone: string;
  eventTitle: string;
  artistName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WalletClient({ session, rawTickets }: WalletClientProps) {
  const [selectedTicket, setSelectedTicket] = useState<SelectedTicket | null>(null);

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

  const dateFormatter = new Intl.DateTimeFormat("es-MX", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleOpenQR = (order: any) => {
    const ticket = order.tickets_inventory;
    const event = ticket.events;
    const artist = event.artists;

    setSelectedTicket({
      ticketId: ticket.id,
      orderId: order.id,
      eventId: event.id,
      seatNumber: ticket.seat_number,
      zone: ticket.zone,
      eventTitle: event.title,
      artistName: artist?.name || event.title,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-background font-body-md antialiased">
      {/* ─── Secure QR Modal ─── */}
      {selectedTicket && (
        <SecureTicketQR
          {...selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* ─── Mobile Top Bar ─── */}
      <div className="md:hidden flex justify-between items-center px-6 h-16 w-full sticky top-0 z-50 bg-zinc-950/50 backdrop-blur-[40px] text-white border-b border-white/10 font-['Space_Grotesk']">
        <Link href="/" className="text-xl font-black text-white">
          StageFront
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <span className="material-symbols-outlined">person</span>
          </Link>
        </div>
      </div>

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col h-full sticky left-0 top-0 w-64 border-r border-white/10 bg-zinc-950/80 backdrop-blur-[20px] text-white font-['Space_Grotesk'] tracking-tight z-40">
        <div className="p-6 pb-6 border-b border-white/10">
          <Link href="/" className="text-2xl font-bold text-white tracking-tighter">
            StageFront
          </Link>
          <p className="font-label-caps text-zinc-400 mt-2 uppercase tracking-widest text-[10px]">
            Billetera Digital
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 font-medium hover:bg-white/5 hover:text-white transition-all duration-300"
          >
            <span className="material-symbols-outlined">grid_view</span>
            <span>Inicio</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-white bg-white/10 font-bold border-l-2 border-white">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance_wallet
            </span>
            <span>Billetera</span>
          </div>
          <Link
            href="/events"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 font-medium hover:bg-white/5 hover:text-white transition-all duration-300"
          >
            <span className="material-symbols-outlined">explore</span>
            <span>Explorar</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 font-medium hover:bg-white/5 hover:text-white transition-all duration-300"
          >
            <span className="material-symbols-outlined">manage_accounts</span>
            <span>Mi Cuenta</span>
          </Link>
        </nav>

        {/* Security badge */}
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="material-symbols-outlined text-violet-400 text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield
              </span>
              <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                Protección Activa
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Tus boletos están protegidos con firma HMAC-SHA256 y rotación TOTP
              de 30 segundos.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/support"
            className="w-full py-3 px-4 rounded-lg bg-surface-container-high/40 backdrop-blur-md border border-white/10 text-white font-label-caps text-[11px] hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              support_agent
            </span>
            Soporte
          </Link>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto bg-background relative">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-10 md:py-12 space-y-10 relative z-10">
          {/* ─── Header ─── */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="material-symbols-outlined text-violet-400 text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance_wallet
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  Seguridad TOTP
                </span>
              </div>
              <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-bold text-white tracking-tight leading-none">
                Mi Billetera Digital
              </h1>
              <p className="text-zinc-400 mt-2 text-base max-w-lg">
                Tus pases de acceso están protegidos con firma criptográfica.
                Cada código QR se regenera automáticamente cada 30 segundos.
              </p>
            </div>

            {/* User card */}
            <div className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 rounded-2xl shrink-0">
              <div className="h-12 w-12 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-400 text-2xl">
                  person
                </span>
              </div>
              <div>
                <div className="font-['Space_Grotesk'] font-bold text-white">
                  {session.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                  <span className="material-symbols-outlined text-[12px] text-emerald-400">
                    verified
                  </span>
                  Miembro Verificado
                </div>
              </div>
            </div>
          </header>

          {/* ─── Security Banner ─── */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-violet-500/[0.06] via-fuchsia-500/[0.04] to-cyan-500/[0.06] border border-violet-500/10">
            <span
              className="material-symbols-outlined text-violet-400 text-xl mt-0.5 shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              security
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">
                Signos de Identidad Activos
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Cada boleto incluye una firma invisible HMAC-SHA256, micro-puntos
                criptográficos embebidos en el código QR, y rotación TOTP cada 30
                segundos. Las capturas de pantalla son detectadas automáticamente
                como "Boleto No Auténtico".
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]">
                  encrypted
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                  HMAC
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-violet-400 text-[20px]">
                  fingerprint
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                  Firma
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">
                  sync
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                  TOTP
                </span>
              </div>
            </div>
          </div>

          {/* ─── Active Tickets ─── */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">
                Pases Activos
              </h2>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-400 tabular-nums">
                {activeTickets.length}{" "}
                {activeTickets.length === 1 ? "boleto" : "boletos"}
              </span>
            </div>

            {activeTickets.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {activeTickets.map((order) => {
                  const ticket = order.tickets_inventory;
                  const event = ticket.events;
                  const artist = event.artists;

                  return (
                    <div
                      key={order.id}
                      className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-white/[0.06] transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_60px_-15px_rgba(139,92,246,0.25)]"
                    >
                      {/* Background image */}
                      <div className="absolute inset-0 z-0">
                        {(event.image_url || artist?.image_url) && (
                          <Image
                            src={event.image_url || artist.image_url}
                            alt={event.title}
                            fill
                            className="object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                            unoptimized
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/40" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      {/* Content */}
                      <div className="relative z-10 p-6 flex flex-col min-h-[260px] justify-between">
                        {/* Top row */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[11px] text-white font-bold uppercase tracking-wider">
                              {ticket.zone}
                            </span>
                            <span className="px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] text-violet-300 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Protegido
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenQR(order)}
                            className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110 active:scale-95"
                            title="Ver código QR seguro"
                          >
                            <span className="material-symbols-outlined text-xl">
                              qr_code_scanner
                            </span>
                          </button>
                        </div>

                        {/* Event info */}
                        <div className="space-y-4 mt-auto">
                          <div>
                            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
                              {event.title}
                            </p>
                            <h3 className="font-['Space_Grotesk'] text-3xl font-bold text-white leading-none mt-1">
                              {artist?.name || event.title}
                            </h3>
                          </div>

                          <div className="flex items-end justify-between border-t border-white/[0.06] pt-4">
                            <div>
                              <div className="text-sm text-zinc-300">
                                {dateFormatter.format(new Date(event.date))} •{" "}
                                {timeFormatter.format(new Date(event.date))}
                              </div>
                              <div className="text-[11px] text-zinc-500 mt-0.5">
                                {event.venue}, {event.city}
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenQR(order)}
                              className="bg-white text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-white/10 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                lock
                              </span>
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
              <div className="py-16 text-center border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01]">
                <span className="material-symbols-outlined text-5xl text-zinc-700 mb-3 block">
                  local_activity
                </span>
                <p className="text-zinc-500 text-sm">
                  No tienes boletos activos.
                </p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Explorar eventos
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            )}
          </section>

          {/* ─── Past Tickets ─── */}
          <section className="space-y-5 pb-12">
            <h2 className="font-['Space_Grotesk'] text-xl font-semibold text-zinc-500">
              Historial de Boletos
            </h2>

            {pastTickets.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pastTickets.map((order) => {
                  const ticket = order.tickets_inventory;
                  const event = ticket.events;
                  const artist = event.artists;

                  return (
                    <div
                      key={order.id}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-zinc-900/30 border border-white/[0.04] grayscale-[70%] opacity-60 hover:opacity-90 hover:grayscale-0 transition-all duration-300"
                    >
                      <div className="h-24 md:h-16 w-full md:w-24 rounded-lg overflow-hidden shrink-0 relative bg-zinc-800">
                        {(event.image_url || artist?.image_url) ? (
                          <Image
                            src={event.image_url || artist.image_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <span className="material-symbols-outlined text-zinc-600 text-2xl">
                              music_note
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-['Space_Grotesk'] font-bold text-white truncate">
                          {artist?.name || event.title}
                        </div>
                        <div className="text-sm text-zinc-500 truncate">
                          {event.title} • {event.venue}
                        </div>
                      </div>
                      <div className="md:text-right flex flex-row md:flex-col justify-between items-center md:items-end shrink-0">
                        <div className="text-xs text-zinc-400">
                          {dateFormatter.format(new Date(event.date))}
                        </div>
                        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">
                          Asistido
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center border border-dashed border-white/[0.04] rounded-2xl">
                <p className="text-zinc-600 text-sm">
                  No tienes historial de boletos pasados.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
