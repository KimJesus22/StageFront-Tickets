// ============================================================================
// 🗺️ SeatLegend — Leyenda flotante del mapa de asientos
// ============================================================================
//
// Componente de presentación puro (sin estado, sin SDK).
// Flota sobre el mapa de asientos con z-50 para garantizar visibilidad.
//
// INTEGRACIÓN:
// Importar e incrustar dentro del Server o Client Component del mapa:
//
//   import SeatLegend from "@/components/SeatLegend";
//
//   export default function SeatsPage() {
//     return (
//       <div className="relative">
//         {/* SVG/Canvas del mapa de asientos */}
//         <SeatMap />
//
//         {/* Leyenda flotante — se posiciona fixed en bottom */}
//         <SeatLegend />
//       </div>
//     );
//   }
//
// ============================================================================

/**
 * Tipo de estado de un asiento en el mapa.
 * Cada item define su label visible y las clases de Tailwind
 * para el indicador LED (dot) y su glow opcional.
 */
interface LegendItem {
  /** Texto visible en la leyenda */
  label: string;
  /** Clases Tailwind para el dot indicador (color + glow) */
  dotClasses: string;
}

/**
 * Estados posibles de un asiento.
 *
 * Los colores siguen el sistema de "Neon LEDs" del DESIGN.md:
 * - Disponible  → Pastel Green (#10b981) + glow
 * - Seleccionado → Amber (#fbbf24) + glow
 * - Ocupado     → Zinc-600 (sin glow, apagado)
 * - Bloqueado   → Rose (#f43f5e) + glow
 */
const LEGEND_ITEMS: LegendItem[] = [
  {
    label: "Disponible",
    dotClasses: "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]",
  },
  {
    label: "Seleccionado",
    dotClasses: "bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  },
  {
    label: "Ocupado",
    dotClasses: "bg-zinc-600",
  },
  {
    label: "Bloqueado",
    dotClasses: "bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.5)]",
  },
];

export default function SeatLegend() {
  return (
    <div
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50"
      role="legend"
      aria-label="Leyenda del mapa de asientos"
    >
      <div className="bg-zinc-950/60 backdrop-blur-md border border-white/10 rounded-full px-8 py-4 flex items-center gap-6 shadow-2xl">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${item.dotClasses}`}
              aria-hidden="true"
            />
            <span className="font-body-md text-body-md text-zinc-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
