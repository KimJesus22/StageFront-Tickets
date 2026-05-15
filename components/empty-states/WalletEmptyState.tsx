// ============================================================================
// 🫙 WalletEmptyState — Estado vacío de la billetera digital
// ============================================================================
//
// Componente de presentación reutilizable que se muestra cuando el usuario
// no tiene boletos. Sigue el diseño "Ethereal Tech" de Stich con:
//
//   - Anillos orbitales decorativos (spin + reverse spin)
//   - Ícono glassmorphic con backdrop-blur y glow
//   - Ambient glow de fondo (cyan difuso)
//   - CTA con borde esmeralda y efecto shimmer en hover
//
// REUTILIZACIÓN:
//   Este mismo patrón puede adaptarse para otros empty states:
//   - Favoritos vacíos  → cambiar ícono a "favorite" y copy
//   - Historial vacío   → cambiar ícono a "history" y copy
//   - Notificaciones    → cambiar ícono a "notifications" y copy
//
// Ejemplo:
//   <WalletEmptyState />
//   <WalletEmptyState
//     title="Sin favoritos aún"
//     description="Explora artistas y guárdalos aquí."
//     icon="favorite"
//   />
//
// ============================================================================

import Link from "next/link";

interface WalletEmptyStateProps {
  /** Headline principal */
  title?: string;
  /** Texto descriptivo debajo del headline */
  description?: string;
  /** Nombre del ícono Material Symbols */
  icon?: string;
  /** Texto del botón CTA */
  ctaLabel?: string;
  /** Ruta de navegación del CTA */
  ctaHref?: string;
}

export default function WalletEmptyState({
  title = "Todavía no tienes boletos.",
  description = "Tu billetera de acceso de alta fidelidad está vacía. Explora los próximos eventos y asegura tu lugar en la primera fila.",
  icon = "confirmation_number",
  ctaLabel = "Explorar Cartelera",
  ctaHref = "/events",
}: WalletEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 relative min-h-[50vh]">
      {/* ── Ambient Background Glow ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
        <div className="w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* ── Empty State Container ── */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        {/* ── Icon/Visual Anchor con anillos orbitales ── */}
        <div className="relative mb-12 w-32 h-32 flex items-center justify-center group">
          {/* Anillo exterior — rotación lenta */}
          <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
          {/* Anillo interior — rotación inversa, punteado */}
          <div className="absolute inset-2 border border-white/10 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]" />
          {/* Ícono principal glassmorphic */}
          <div className="relative w-24 h-24 bg-surface-container-high/50 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500">
            <span
              className="material-symbols-outlined text-6xl text-zinc-600 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              {icon}
            </span>
          </div>
        </div>

        {/* ── Typography ── */}
        <h2 className="font-headline-lg text-headline-lg text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 mb-2 tracking-tight">
          {title}
        </h2>
        <p className="font-body-lg text-body-lg text-zinc-400 mb-12 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        {/* ── Call to Action con efecto shimmer ── */}
        <Link
          href={ctaHref}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-label-caps text-label-caps uppercase tracking-[0.1em] text-white bg-transparent border border-emerald-500 rounded-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-500/10"
        >
          {/* Shimmer sweep en hover */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">explore</span>
            {ctaLabel}
          </span>
        </Link>
      </div>
    </div>
  );
}
