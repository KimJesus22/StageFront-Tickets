'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  // ID Dinámico desde la URL o valor por defecto
  const orderId = searchParams.get('orderId') || 'SF-000001';
  
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // 1. Limpieza de rastros (Evitar que usuario regrese y vea asientos seleccionados)
    localStorage.removeItem('selectedSeats');
    sessionStorage.removeItem('selectedSeats');
    
    // Limpieza de estados globales (Disparamos un custom event por si otras partes de la app escuchan)
    window.dispatchEvent(new Event('clear-cart'));

    // 2. Disparar Confetti (Costo cero de performance)
    const timer = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-12 py-16 z-10 relative min-h-[80vh]">
      {/* Metadatos Dinámicos / SEO (Soportado por Next.js en Client Components) */}
      <title>¡Gracias por tu compra! - StageFront</title>

      <div className="w-full max-w-[1280px] mx-auto flex flex-col items-center text-center">
        
        {/* Efecto Confetti CSS Puro (Sutil y sin librerías externas) */}
        {showConfetti && (
           <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
             {[...Array(25)].map((_, i) => (
               <div 
                 key={i} 
                 className="absolute w-2 h-2 rounded-full bg-primary/60 animate-confetti"
                 style={{
                   left: `${Math.random() * 100}%`,
                   top: `-10%`,
                   animationDelay: `${Math.random() * 1.5}s`,
                   animationDuration: `${2 + Math.random() * 3}s`
                 }}
               />
             ))}
           </div>
        )}

        {/* Ícono de Éxito */}
        <div className="mb-8 relative" aria-hidden="true">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[30px] animate-pulse"></div>
          <div className="w-24 h-24 rounded-full bg-surface-container/40 backdrop-blur-[20px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center relative z-10">
            <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
        </div>

        {/* Mensaje Accesible */}
        <h1 
          className="font-display-xl text-5xl md:text-6xl font-bold text-primary mb-4 tracking-tighter"
          tabIndex={-1} 
          aria-live="polite"
        >
          ¡Compra confirmada!
        </h1>
        
        <div className="bg-surface-container-high border border-outline-variant/30 rounded-lg px-6 py-2 mb-8 inline-block">
          <p 
            className="font-body-lg text-lg text-on-surface font-mono tracking-wider" 
            aria-label={`El número de tu orden es ${orderId}`}
          >
            Orden #{orderId}
          </p>
        </div>

        <p className="font-body-lg text-lg text-on-surface-variant max-w-md mx-auto mb-12">
          Tus boletos están en tu billetera. Recibirás un correo electrónico con los detalles de tu transacción en breve.
        </p>

        {/* Navegación Segura */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <Link 
            href="/user/wallet" 
            className="flex-1 bg-primary text-on-primary font-label-caps text-xs py-4 px-8 rounded-full hover:bg-tertiary-container transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 font-bold tracking-widest uppercase flex items-center justify-center"
            aria-label="Ir a mi billetera digital de boletos"
          >
            Ir a mi Billetera
          </Link>
          <Link 
            href="/events" 
            className="flex-1 bg-surface-container/40 backdrop-blur-[20px] border border-white/10 text-primary font-label-caps text-xs py-4 px-8 rounded-full hover:bg-white/5 transition-all duration-300 hover:scale-105 font-bold tracking-widest uppercase flex items-center justify-center"
            aria-label="Explorar más eventos en StageFront"
          >
            Explorar más eventos
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </main>
  );
}

// Suspense wrapper necesario para usar useSearchParams en Client Components
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
