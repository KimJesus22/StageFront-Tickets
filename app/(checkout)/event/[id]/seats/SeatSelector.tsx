"use client";

import { useState } from "react";
import type { TicketInventory, Event } from "@/lib/types/database";
import { lockTicket } from "@/lib/actions/tickets";

interface SeatSelectorProps {
  event: Event;
  initialTickets: TicketInventory[];
}

const getCurrency = (city: string) => {
  if (city.includes("MX")) return "MXN";
  if (city.includes("SK")) return "KRW";
  if (city.includes("UK")) return "GBP";
  if (city.includes("JP")) return "JPY";
  return "USD";
};

const formatPrice = (price: number, city: string) => {
  const currency = getCurrency(city);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2
  }).format(price);
};

export default function SeatSelector({ event, initialTickets }: SeatSelectorProps) {
  const [tickets, setTickets] = useState<TicketInventory[]>(initialTickets);
  const [selectedTickets, setSelectedTickets] = useState<TicketInventory[]>([]);
  const [loadingSeatId, setLoadingSeatId] = useState<string | null>(null);
  
  // Estado para notificaciones simples
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Muestra un toast por 5 segundos
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Agrupar tickets por zona
  const ticketsByZone = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.zone]) {
      acc[ticket.zone] = [];
    }
    acc[ticket.zone].push(ticket);
    return acc;
  }, {} as Record<string, TicketInventory[]>);

  const toggleSeat = async (ticket: TicketInventory) => {
    // Si ya está seleccionado, permitir deseleccionarlo localmente
    const isSelected = selectedTickets.some((t) => t.id === ticket.id);
    if (isSelected) {
      setSelectedTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      return;
    }

    // Si no está disponible y no está seleccionado, no hacer nada
    if (ticket.status !== "disponible") return;

    // Intentar bloquear el asiento en el servidor
    setLoadingSeatId(ticket.id);
    
    try {
      const result = await lockTicket(ticket.id);
      
      if (result.success && result.ticket) {
        // Bloqueo exitoso: agregarlo al carrito y actualizar su estado visual
        setSelectedTickets((prev) => [...prev, result.ticket!]);
        
        // Actualizar el array principal para que no lo puedan clickear otros
        setTickets((prev) => 
          prev.map((t) => (t.id === result.ticket!.id ? result.ticket! : t))
        );
        
        showToast(result.message, "success");
      } else {
        // Alguien más lo ganó: actualizar el estado a vendido/bloqueado localmente
        setTickets((prev) => 
          prev.map((t) => (t.id === ticket.id ? { ...t, status: "bloqueado" } : t))
        );
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Hubo un error de conexión al procesar el boleto.", "error");
    } finally {
      setLoadingSeatId(null);
    }
  };

  const totalPrice = selectedTickets.reduce((sum, ticket) => sum + Number(ticket.price), 0);

  const handleCheckout = () => {
    if (selectedTickets.length === 0) return;
    showToast("Redirigiendo a pasarela de pagos...", "success");
    // Redirigir a la página de pago del primer ticket seleccionado
    window.location.href = `/payment/${selectedTickets[0].id}`;
  };

  return (
    <div className="relative pb-32">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-full font-body-md font-medium shadow-2xl border ${
            toast.type === "success" 
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/30" 
              : "bg-red-950/90 text-red-300 border-red-500/30"
          } backdrop-blur-md flex items-center gap-2`}>
            <span className="material-symbols-outlined text-sm">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-12">
        {Object.entries(ticketsByZone).map(([zone, zoneTickets]) => (
          <div key={zone} className="bg-surface-container-low border border-white/5 p-6 md:p-8 rounded-3xl">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h3 className="font-headline-md text-2xl text-white font-semibold mb-1">
                  Zona {zone}
                </h3>
                <p className="font-body-md text-zinc-400 text-sm">
                  Selecciona tus asientos
                </p>
              </div>
              <div className="text-primary font-body-md font-medium">
                {formatPrice(Number(zoneTickets[0]?.price || 0), event.city)} c/u
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {zoneTickets.map((ticket) => {
                const isSelected = selectedTickets.some((t) => t.id === ticket.id);
                const isLoading = loadingSeatId === ticket.id;
                
                let btnClasses = "w-14 h-14 rounded-xl flex items-center justify-center font-body-md font-semibold text-sm transition-all duration-300 relative overflow-hidden ";

                if (isSelected) {
                  // Si es nuestro asiento seleccionado (ya lo bloqueamos con éxito)
                  btnClasses += "bg-primary text-on-primary shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)] scale-110 border border-primary";
                } else if (ticket.status === "disponible") {
                  btnClasses += "bg-white/10 text-white hover:bg-white/20 hover:scale-105 border border-white/20 cursor-pointer";
                } else if (ticket.status === "vendido") {
                  btnClasses += "bg-white/[0.03] text-zinc-600 border border-white/5 cursor-not-allowed opacity-50";
                } else if (ticket.status === "bloqueado") {
                  btnClasses += "bg-amber-500/20 text-amber-500 border border-amber-500/30 cursor-not-allowed";
                }

                return (
                  <button
                    key={ticket.id}
                    onClick={() => toggleSeat(ticket)}
                    disabled={(ticket.status !== "disponible" && !isSelected) || isLoading}
                    className={btnClasses}
                    title={`${ticket.zone} - ${ticket.seat_number} (${formatPrice(ticket.price, event.city)})`}
                    aria-label={`Asiento ${ticket.seat_number} ${ticket.status}`}
                  >
                    {isLoading ? (
                      <span className="material-symbols-outlined animate-spin text-lg">
                        progress_activity
                      </span>
                    ) : (
                      ticket.seat_number
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="text-center py-12 bg-surface-container-low border border-white/5 rounded-3xl">
            <span className="material-symbols-outlined text-4xl text-zinc-500 mb-4 block">
              event_seat
            </span>
            <p className="font-body-md text-zinc-400">No hay asientos configurados para este evento.</p>
          </div>
        )}
      </div>

      {/* Bottom Bar Flotante */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 p-4 md:p-6 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative">
              <span className="material-symbols-outlined text-zinc-300">shopping_cart</span>
              {selectedTickets.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-on-primary">
                  {selectedTickets.length}
                </div>
              )}
            </div>
            <div>
              <p className="font-body-md text-zinc-400 text-sm">
                {selectedTickets.length} {selectedTickets.length === 1 ? "asiento reservado" : "asientos reservados"}
              </p>
              <p className="font-headline-md text-xl text-white font-bold">
                Total: {formatPrice(totalPrice, event.city)}
              </p>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={selectedTickets.length === 0}
            className={`w-full md:w-auto px-10 py-4 rounded-full font-body-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              selectedTickets.length > 0
                ? "bg-primary text-on-primary hover:bg-white/90 hover:scale-105 shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]"
                : "bg-surface-container-highest text-zinc-500 cursor-not-allowed border border-white/5"
            }`}
          >
            Proceder al Pago
            <span className="material-symbols-outlined text-sm">lock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
