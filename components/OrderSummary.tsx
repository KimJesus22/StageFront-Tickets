'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SelectedSeat {
  id: string; // id_asiento
  zona: string;
  label: string;
  precio: number;
}

export interface EventDetails {
  title: string;
  date: string;
  eventId: string;
}

interface OrderSummaryProps {
  eventDetails: EventDetails;
  selectedSeats: SelectedSeat[];
}

export default function OrderSummary({ eventDetails, selectedSeats }: OrderSummaryProps) {
  const router = useRouter();
  const [isLocking, setIsLocking] = useState(false);

  // Cálculos Memoizados
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + seat.precio, 0);
  }, [selectedSeats]);

  const uniqueZones = useMemo(() => {
    const zones = new Set(selectedSeats.map(seat => seat.zona));
    return Array.from(zones);
  }, [selectedSeats]);

  const seatIds = useMemo(() => {
    return selectedSeats.map(seat => seat.id);
  }, [selectedSeats]);

  // Formateador de moneda
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  });

  // Algoritmo Lazy Release
  const lockSeats = async (ids: string[]) => {
    // Aquí iría la lógica real de reserva temporal (Lazy Release) en el backend
    console.log("Reservando los asientos (Lazy Release):", ids);
    console.log("Zonas afectadas:", uniqueZones);
    return new Promise((resolve) => setTimeout(resolve, 600));
  };

  const handleCheckout = async () => {
    if (selectedSeats.length === 0) return;
    
    setIsLocking(true);
    try {
      await lockSeats(seatIds);
      // Redirigir al flujo de pago
      router.push(`/payment/${eventDetails.eventId}`);
    } catch (error) {
      console.error("Error al bloquear los asientos", error);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <aside className="fixed bottom-0 w-full md:w-[380px] md:bottom-auto md:top-24 md:right-margin-desktop z-40 rounded-t-xl md:rounded-xl bg-white/5 backdrop-blur-[20px] border border-white/10 flex flex-col shadow-[0_-8px_24px_rgba(0,0,0,0.5)] md:shadow-2xl">
      {/* Header */}
      <div className="p-gutter border-b border-white/10">
        <h2 className="font-headline-md text-headline-md text-primary mb-unit">{eventDetails.title}</h2>
        <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span>{eventDetails.date}</span>
        </div>
      </div>
      
      {/* Breakdown List */}
      <div className="p-gutter flex-grow overflow-y-auto space-y-stack-sm max-h-[307px] md:max-h-[409px] no-scrollbar">
        {selectedSeats.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-8 opacity-60 text-center">
             <span className="material-symbols-outlined text-5xl mb-3 text-on-surface-variant">touch_app</span>
             <p className="font-body-md text-body-md text-on-surface-variant">Selecciona tus asientos en el mapa</p>
           </div>
        ) : (
          selectedSeats.map((seat) => (
            <div key={seat.id} className="flex justify-between items-start py-unit border-b border-white/5 last:border-0 pb-stack-sm last:pb-0">
              <div>
                <div className="font-body-lg text-body-lg text-primary">{seat.zona}</div>
                <div className="font-body-md text-body-md text-on-surface-variant">{seat.label}</div>
              </div>
              <div className="font-body-md text-body-md text-primary">{formatter.format(seat.precio)}</div>
            </div>
          ))
        )}
      </div>

      {/* Total Block */}
      <div className="p-gutter border-t border-white/20 bg-surface-container/50">
        <div className="flex justify-between items-end mb-stack-md">
          <div className="font-body-lg text-body-lg text-on-surface-variant">Total</div>
          <div className="font-headline-lg text-headline-lg text-primary">{formatter.format(totalPrice)}</div>
        </div>
        
        {/* Primary Button */}
        <button 
          onClick={handleCheckout}
          disabled={selectedSeats.length === 0 || isLocking}
          className={`w-full font-label-caps text-label-caps py-4 rounded-lg flex justify-center items-center gap-2 transition-all duration-300 shadow-lg ${
            selectedSeats.length === 0 || isLocking 
              ? 'bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed'
              : 'bg-primary text-on-primary hover:bg-primary-container hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] font-bold uppercase tracking-widest'
          }`}
        >
          {isLocking ? 'Procesando...' : 'Proceder al Pago'}
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
        
        {/* Secure checkout trust badge */}
        <div className="mt-stack-sm flex items-center justify-center gap-unit opacity-50">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span className="font-label-caps text-[10px] text-on-surface uppercase tracking-wider">Pago Seguro Encriptado</span>
        </div>
      </div>
    </aside>
  );
}
