"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRGeneratorService } from "@/lib/services/qrService";
import WalletEmptyState from "@/components/empty-states/WalletEmptyState";

// POO - Clase Ticket
export class Ticket {
  id: string;
  orderId: string;
  eventId: string;
  title: string;
  date: string;
  venue: string;
  seatId: string;
  zone: string;
  status: string;
  imageUrl: string;
  uniqueToken: string;

  constructor(data: any) {
    this.id = data.tickets_inventory?.id || data.id;
    this.orderId = data.id; // order id
    this.eventId = data.tickets_inventory?.events?.id || "unknown";
    this.title = data.tickets_inventory?.events?.title || "Unknown Event";
    this.date = data.tickets_inventory?.events?.date || new Date().toISOString();
    this.venue = data.tickets_inventory?.events?.venue || "Unknown Venue";
    this.seatId = data.tickets_inventory?.seat_number || "N/A";
    this.zone = data.tickets_inventory?.zone || "General";
    
    // Si la fecha ya pasó, el status podría ser Usado/Expirado, pero lo controlamos mejor con isUpcoming()
    this.status = data.tickets_inventory?.status || "Activo";
    
    this.imageUrl = data.tickets_inventory?.events?.image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuA4mogg717Caebi3hYmv96-r8GwxFk4iaxU4xtYQJzmvtFU6ptiIZZ6Ld2RdqsFXHrynexR8E0nOZtT1fqGjjZWTW32v_XXip4iH_KCrGZo3fvSNwf6RVcLvCmvQAaF_sNx2hGhPxU82EwjoUTwg28s7Ti3DL1EmCL5Hzow-E4cvso0TDDwJCAQ5MPCvZzF9OnVWCZpR9OstbqLM_MxtRYq9m_w1RsVBuAuVKDuGoBBIgmCcDumW3__edszShlkdpSWhyugBDfOJlw";
    
    this.uniqueToken = data.tickets_inventory?.unique_token || this.id;
  }

  isUpcoming(): boolean {
    return new Date(this.date) >= new Date();
  }
}

interface WalletClientProps {
  session: {
    id: string;
    email: string;
    name: string;
  };
  rawTickets: any[];
}

export default function WalletClient({ session, rawTickets }: WalletClientProps) {
  // Convertimos la raw data en objetos de la clase Ticket
  const tickets = useMemo(() => {
    return rawTickets.map((raw) => new Ticket(raw));
  }, [rawTickets]);

  const [filter, setFilter] = useState<"upcoming" | "history">("upcoming");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Manejo de Estados: Filtrado dinámico con useMemo
  const filteredTickets = useMemo(() => {
    if (filter === "upcoming") {
      return tickets.filter((t) => t.isUpcoming());
    } else {
      return tickets.filter((t) => !t.isUpcoming());
    }
  }, [tickets, filter]);

  // Generar QR de manera perezosa solo cuando el ticket es seleccionado
  useEffect(() => {
    if (selectedTicket) {
      const tokenToEncode = selectedTicket.uniqueToken || selectedTicket.id;
      QRGeneratorService.generate(tokenToEncode)
        .then(url => setQrDataUrl(url))
        .catch(err => console.error("Error generating QR", err));
    } else {
      setQrDataUrl(null);
    }
  }, [selectedTicket]);

  const dateFormatter = new Intl.DateTimeFormat("es-MX", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Función de hash simple para generar un ID visual (Secure Token)
  const generateHashQR = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase();
  };

  const getFirstWord = (title: string) => title.split(" ")[0] || title;
  const getRestOfTitle = (title: string) => title.split(" ").slice(1).join(" ");

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-['Inter'] dark">
      {/* ─── Secure QR Modal ─── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          {/* Brillo de pantalla CSS para facilitar el escaneo (backdrop invertido o brillo superior en el modal) */}
          <style dangerouslySetInnerHTML={{__html: `
            .screen-brightness-boost {
              filter: drop-shadow(0 0 50px rgba(255, 255, 255, 0.4));
              animation: brightness-up 0.5s ease forwards;
            }
            @keyframes brightness-up {
              to { backdrop-filter: blur(20px) brightness(1.2); }
            }
          `}} />
          
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-surface-bright/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
          
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col relative shadow-[0_0_40px_rgba(255,255,255,0.1)] screen-brightness-boost">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 z-50 text-white/50 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            {/* Skeuomorphic Punched Holes */}
            <div className="absolute top-[60%] left-[-12px] w-6 h-6 bg-[#0e0e0e] rounded-full border-r border-white/10 z-10"></div>
            <div className="absolute top-[60%] right-[-12px] w-6 h-6 bg-[#0e0e0e] rounded-full border-l border-white/10 z-10"></div>
            
            {/* Top Section */}
            <div className="p-8 pb-6 flex flex-col gap-6 relative">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/20 border border-secondary-container/40 self-start shadow-[0_0_12px_rgba(71,70,73,0.3)]">
                <span className="font-['Inter'] text-[12px] text-on-surface uppercase tracking-widest font-semibold">Live Experience</span>
              </div>
              
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-6xl font-bold text-primary leading-tight">
                {getFirstWord(selectedTicket.title)}<br/>
                <span className="text-3xl text-on-surface-variant font-normal">{getRestOfTitle(selectedTicket.title)}</span>
              </h1>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold">Date</span>
                  <span className="font-['Inter'] text-lg text-primary font-medium">{dateFormatter.format(new Date(selectedTicket.date))}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold">Time</span>
                  <span className="font-['Inter'] text-lg text-primary font-medium">{timeFormatter.format(new Date(selectedTicket.date))} HRS</span>
                </div>
                <div className="flex flex-col gap-1 col-span-2 mt-2">
                  <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold">Venue</span>
                  <span className="font-['Space_Grotesk'] text-2xl font-medium text-primary">{selectedTicket.venue}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-white/10 pt-6 mt-2">
                <div className="flex flex-col gap-1">
                  <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold">Zone</span>
                  <span className="font-['Space_Grotesk'] text-2xl font-medium text-secondary">{selectedTicket.zone}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold">Seat</span>
                  <span className="font-['Space_Grotesk'] text-3xl font-semibold text-primary">{selectedTicket.seatId}</span>
                </div>
              </div>
            </div>
            
            {/* Dotted Divider */}
            <div className="w-full relative h-px px-4 flex items-center justify-center">
              <div className="w-full border-t-2 border-dashed border-white/20"></div>
            </div>
            
            {/* Bottom Section (QR & Security) */}
            <div className="p-8 pt-10 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-transparent to-surface-container/30 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-secondary-container/5 pointer-events-none rounded-b-3xl"></div>
              
              <div className="relative p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(163,222,254,0.15)] ring-1 ring-white/20">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 object-contain" />
                ) : (
                  <div className="w-40 h-40 bg-gray-200 animate-pulse flex items-center justify-center text-xs text-gray-500">
                    Generando...
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-2 mt-2 z-10">
                <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-on-surface-variant font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                  SECURE TOKEN
                </span>
                <span className="font-mono text-sm text-on-surface-variant tracking-[0.2em] opacity-70">
                  SF-TX-{generateHashQR(selectedTicket.id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TopNavBar */}
      <nav className="bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-4 md:px-12 py-4 sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-['Space_Grotesk'] text-3xl font-bold text-primary tracking-tighter">
            StageFront
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/events" className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-white/5 rounded-lg duration-300 px-3 py-2 font-medium">Events</Link>
            <Link href="/venues" className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-white/5 rounded-lg duration-300 px-3 py-2 font-medium">Venues</Link>
            <Link href="/artists" className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-white/5 rounded-lg duration-300 px-3 py-2 font-medium">Artists</Link>
            <span className="text-primary border-b-2 border-primary pb-1 font-medium px-3 py-2">Membership</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-12 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-['Space_Grotesk'] text-5xl md:text-6xl font-bold text-primary tracking-tight mb-2">
            Tus Boletos, @{session.name.split(' ')[0] || "usuario"}
          </h1>
          <p className="text-lg text-on-surface-variant">
            {tickets.length} {tickets.length === 1 ? "Boleto" : "Boletos"} en Total
          </p>
        </header>

        {/* Filters */}
        <div className="flex gap-6 mb-12 border-b border-outline-variant/20 pb-1">
          <button 
            onClick={() => setFilter("upcoming")}
            className={`text-base font-medium pb-3 px-2 transition-all ${
              filter === "upcoming" 
                ? "text-primary border-b-2 border-primary" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Próximos Eventos
          </button>
          <button 
            onClick={() => setFilter("history")}
            className={`text-base font-medium pb-3 px-2 transition-all ${
              filter === "history" 
                ? "text-primary border-b-2 border-primary" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Historial
          </button>
        </div>

        {/* Ticket List (Grid) */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`bg-white/5 backdrop-blur-xl border ${ticket.isUpcoming() ? 'border-white/10 hover:border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(255,255,255,0.1)]' : 'border-white/5 opacity-60'} rounded-3xl overflow-hidden flex flex-col md:flex-row group transition-all duration-300`}
              >
                {/* Left: Event Art */}
                <div className="md:w-2/5 h-48 md:h-auto relative">
                  <Image 
                    src={ticket.imageUrl} 
                    alt={ticket.title} 
                    fill 
                    className={`object-cover transition-all duration-500 ${ticket.isUpcoming() ? 'filter brightness-75 group-hover:brightness-100' : 'filter grayscale'}`}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0e0e0e]/90 md:from-[#0e0e0e]/80 to-transparent"></div>
                </div>

                {/* Right: Details */}
                <div className="p-6 flex-grow flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-primary tracking-tight truncate pr-4">
                        {ticket.title}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 ${
                        ticket.isUpcoming() 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_12px_rgba(74,222,128,0.2)]'
                          : 'bg-surface-variant text-on-surface-variant border border-outline-variant/30'
                      }`}>
                        {ticket.isUpcoming() ? 'Activo' : 'Usado'}
                      </span>
                    </div>
                    <p className="text-on-surface-variant mb-6">
                      {dateFormatter.format(new Date(ticket.date))}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 mb-1 font-semibold">Recinto</p>
                        <p className="text-sm text-primary font-medium truncate">{ticket.venue}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 mb-1 font-semibold">Zona</p>
                        <p className="text-sm text-primary font-medium truncate">{ticket.zone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 mb-1 font-semibold">Asiento</p>
                        <p className="text-sm text-primary font-medium truncate">{ticket.seatId}</p>
                      </div>
                    </div>
                  </div>

                  {ticket.isUpcoming() ? (
                    <button 
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full bg-primary text-on-primary font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">qr_code</span>
                      Ver Código QR
                    </button>
                  ) : (
                    <button 
                      className="w-full bg-transparent text-on-surface-variant border border-outline-variant/30 py-3 rounded-lg cursor-not-allowed font-medium"
                      disabled
                    >
                      Completado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State — Componente reutilizable con props contextuales */
          <WalletEmptyState
            title={filter === "upcoming" ? "Sin próximos eventos" : "Sin historial aún"}
            description={
              filter === "upcoming"
                ? "No tienes boletos para eventos futuros. Descubre los próximos eventos en tu ciudad."
                : "Todavía no has asistido a ningún evento. ¡Tu primer concierto te espera!"
            }
            icon={filter === "upcoming" ? "confirmation_number" : "history"}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0e0e0e] flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-12 py-8 border-t border-outline-variant/10 mt-auto">
        <div className="font-['Space_Grotesk'] text-2xl font-medium text-primary mb-4 md:mb-0">
          StageFront
        </div>
        <div className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
          <a href="#" className="text-[12px] font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="text-[12px] font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="text-[12px] font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors">Cookie Policy</a>
          <a href="#" className="text-[12px] font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors">Accessibility</a>
        </div>
        <p className="text-on-surface-variant text-sm">© 2026 StageFront Tickets. All rights reserved.</p>
      </footer>
    </div>
  );
}

