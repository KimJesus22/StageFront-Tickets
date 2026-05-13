'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ReservationTimerProps {
  expiryTimestamp: number; // en milisegundos
  seatIds: string[];
  clearCart: () => void;
}

// Server Action simulada (Normalmente esto viene de un archivo actions.ts)
const releaseSeats = async (seatIds: string[]) => {
  console.log('Liberando asientos en la base de datos...', seatIds);
  // status = 'disponible' en DB
  return new Promise(resolve => setTimeout(resolve, 500));
};

export default function ReservationTimer({ expiryTimestamp, seatIds, clearCart }: ReservationTimerProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const onExpire = useCallback(async () => {
    setIsExpired(true);
    
    // 1. Limpiar el carrito local
    clearCart();
    
    // 2. Llamar a la Server Action para liberar asientos
    if (seatIds.length > 0) {
      try {
        await releaseSeats(seatIds);
      } catch (error) {
        console.error("Error al liberar asientos", error);
      }
    }
  }, [clearCart, seatIds]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = expiryTimestamp - now;
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime <= 0) {
      if (expiryTimestamp > 0 && !isExpired) {
        onExpire();
      }
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (!isExpired) {
          onExpire();
        }
      }
    }, 1000);

    // Optimización: Limpiar el setInterval para evitar Memory Leaks
    return () => clearInterval(timer);
  }, [expiryTimestamp, isExpired, onExpire]);

  const handleCloseModal = () => {
    setIsExpired(false);
    router.push('/');
  };

  // Formatear segundos a MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isCritical = timeLeft <= 60 && timeLeft > 0; // Estado crítico (último minuto)

  if (expiryTimestamp === 0) return null; // No mostrar si no hay timestamp

  return (
    <>
      {/* Timer Banner */}
      {timeLeft > 0 && !isExpired && (
        <div className={`sticky top-0 z-50 w-full backdrop-blur-md border-b px-6 py-3 transition-colors duration-500 ${
          isCritical 
            ? 'bg-error-container/20 border-error/20' 
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="max-w-[1280px] mx-auto flex items-center justify-between md:justify-center md:gap-4">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${
                isCritical ? 'text-error animate-pulse' : 'text-outline opacity-70 animate-pulse'
              }`}>
                {isCritical ? 'hourglass_bottom' : 'hourglass_empty'}
              </span>
              <span className={`font-body-md text-body-md ${isCritical ? 'text-error' : 'text-outline'}`}>
                Tus asientos están reservados por
              </span>
            </div>
            <div className={`font-headline-md text-headline-md tracking-widest ${
              isCritical ? 'text-error animate-pulse' : 'text-primary'
            }`}>
              {formattedTime}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sesión Expirada */}
      {isExpired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-surface-container-high border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-error text-3xl">timer_off</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Sesión Expirada</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              El tiempo para completar tu compra ha finalizado y los asientos han sido liberados.
            </p>
            <button 
              onClick={handleCloseModal}
              className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-lg hover:bg-primary-container transition-colors uppercase tracking-widest font-bold"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </>
  );
}
