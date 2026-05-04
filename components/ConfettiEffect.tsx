"use client";

import { useEffect, useState } from "react";

/**
 * Efecto de confeti CSS puro — se dispara una sola vez al montar.
 * Usa partículas animadas ligeras sin dependencias externas.
 */
export default function ConfettiEffect() {
  const [particles, setParticles] = useState<
    { id: number; x: number; delay: number; duration: number; color: string; size: number }[]
  >([]);

  useEffect(() => {
    const colors = [
      "#10b981", // emerald
      "#06b6d4", // cyan
      "#8b5cf6", // violet
      "#f59e0b", // amber
      "#ec4899", // pink
      "#ffffff", // white
      "#a78bfa", // purple-light
      "#34d399", // emerald-light
    ];

    const generated = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
    }));

    setParticles(generated);

    // Eliminar partículas después de la animación
    const timer = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}
