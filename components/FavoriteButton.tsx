"use client";

import { useOptimistic, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions/favorites";

interface FavoriteButtonProps {
  entityType: "artist" | "event" | "venue";
  entityId: string;
  initialIsFavorite: boolean;
  className?: string;
}

export default function FavoriteButton({
  entityType,
  entityId,
  initialIsFavorite,
  className = "",
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();

  // useOptimistic intercepta el estado para actualizarlo en 0ms
  const [optimisticIsFavorite, setOptimisticIsFavorite] = useOptimistic<boolean, boolean>(
    initialIsFavorite,
    (state, _newValue) => !state // Invertimos optimísticamente
  );

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir navegación si está dentro de un Link

    // 1. Actualización visual instantánea en 0ms
    startTransition(() => {
      setOptimisticIsFavorite(!optimisticIsFavorite);
    });

    try {
      // 2. Acción asíncrona en background
      await toggleFavorite(entityType, entityId);
    } catch (error) {
      // Si el servidor arroja error (ej. sin conexión o sin login), Next.js
      // revertirá el valor optimista de vuelta a initialIsFavorite en el próximo render
      console.error("Error al hacer toggle en favoritos:", error);
      alert("Debes iniciar sesión para guardar favoritos.");
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`group flex items-center justify-center p-3 rounded-full transition-all duration-300 active:scale-90 shadow-[0_0_15px_rgba(255,255,255,0.05)] ${
        optimisticIsFavorite
          ? "bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20"
          : "bg-surface-container-high/50 border border-white/10 hover:bg-white/10"
      } ${className}`}
      aria-label={optimisticIsFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={optimisticIsFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <span
        className={`material-symbols-outlined text-[24px] transition-colors duration-300 ${
          optimisticIsFavorite
            ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
            : "text-zinc-400 group-hover:text-white"
        }`}
        style={{ fontVariationSettings: optimisticIsFavorite ? "'FILL' 1" : "'FILL' 0" }}
      >
        favorite
      </span>
    </button>
  );
}
