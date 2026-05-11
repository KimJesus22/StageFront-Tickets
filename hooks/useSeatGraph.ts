// ============================================================================
// 🪑 useSeatGraph — Hook para el grafo de adyacencia de asientos
// ============================================================================
//
// Inicializa el SeatGraph con las zonas del evento, sincroniza
// las selecciones del usuario, y expone el análisis de huérfanos.
//
// Costo: 0 llamadas al servidor — todo corre en el frontend.
//
// ============================================================================

"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  SeatGraph,
  type OrphanAnalysis,
  type ZoneConfig,
  type SeatNode,
} from "@/lib/graph/SeatGraph";

// ---------------------------------------------------------------------------
// Configuración de las zonas del mapa (hardcoded — misma data que ZONES)
// ---------------------------------------------------------------------------

/**
 * Define la topología de asientos por zona.
 *
 * Cada zona tiene filas × columnas de asientos.
 * Los asientos pre-ocupados simulan ventas previas.
 */
const ZONE_CONFIGS: ZoneConfig[] = [
  {
    id: "vip-l",
    name: "VIP L",
    rows: 2,
    cols: 4,
    price: 500,
    color: "#c084fc",
    tipo: "Admisión General VIP",
    // Simular algunos asientos ya vendidos
    occupiedSeats: ["vip-l-0-2", "vip-l-1-0"],
  },
  {
    id: "vip-r",
    name: "VIP R",
    rows: 2,
    cols: 4,
    price: 500,
    color: "#c084fc",
    tipo: "Admisión General VIP",
    occupiedSeats: ["vip-r-0-1", "vip-r-1-3"],
  },
  {
    id: "general-a",
    name: "General A",
    rows: 3,
    cols: 6,
    price: 250,
    color: "#a3defe",
    tipo: "Admisión General",
    occupiedSeats: [
      "general-a-0-2",
      "general-a-1-4",
      "general-a-2-1",
    ],
  },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface SeatGraphState {
  /** Análisis actual de huérfanos */
  orphanAnalysis: OrphanAnalysis;
  /** Si hay una advertencia activa */
  hasWarning: boolean;
  /** Asientos seleccionados en el grafo */
  selectedSeats: SeatNode[];
  /** Todos los asientos de una zona */
  getZoneSeats: (zoneId: string) => SeatNode[];
  /** Seleccionar un asiento */
  selectSeat: (zoneId: string, row: number, col: number) => boolean;
  /** Deseleccionar un asiento */
  deselectSeat: (seatId: string) => boolean;
  /** Toggle un asiento */
  toggleSeat: (zoneId: string, row: number, col: number) => boolean;
  /** Limpiar todas las selecciones */
  clearSelections: () => void;
  /** Estadísticas del grafo */
  stats: ReturnType<SeatGraph["getStats"]>;
  /** Configuraciones de zonas */
  zoneConfigs: ZoneConfig[];
  /** Descartar la advertencia sin actuar */
  dismissWarning: () => void;
}

export function useSeatGraph(): SeatGraphState {
  // Inicializar el grafo una sola vez
  const graphRef = useRef<SeatGraph | null>(null);

  if (!graphRef.current) {
    const graph = new SeatGraph();
    for (const config of ZONE_CONFIGS) {
      graph.addZone(config);
    }
    graphRef.current = graph;
  }

  const graph = graphRef.current;

  // Estado reactivo
  const [orphanAnalysis, setOrphanAnalysis] = useState<OrphanAnalysis>({
    hasOrphans: false,
    orphanSeats: [],
    orphanCount: 0,
    suggestions: [],
    message: "",
  });
  const [selectedCount, setSelectedCount] = useState(0);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Recalcular huérfanos cada vez que cambie la selección
  const recalculate = useCallback(() => {
    const analysis = graph.findOrphans();
    setOrphanAnalysis(analysis);
    setSelectedCount(graph.getSelectedSeats().length);
    // Resetear dismissal cuando cambie la selección
    setWarningDismissed(false);
  }, [graph]);

  // ─── Acciones ───

  const selectSeat = useCallback(
    (zoneId: string, row: number, col: number): boolean => {
      const seatId = `${zoneId}-${row}-${col}`;
      const result = graph.selectSeat(seatId);
      if (result) recalculate();
      return result;
    },
    [graph, recalculate]
  );

  const deselectSeat = useCallback(
    (seatId: string): boolean => {
      const result = graph.deselectSeat(seatId);
      if (result) recalculate();
      return result;
    },
    [graph, recalculate]
  );

  const toggleSeat = useCallback(
    (zoneId: string, row: number, col: number): boolean => {
      const seatId = `${zoneId}-${row}-${col}`;
      const status = graph.getSeatStatus(seatId);

      if (status === "available") {
        return selectSeat(zoneId, row, col);
      } else if (status === "selected") {
        return deselectSeat(seatId);
      }
      return false;
    },
    [graph, selectSeat, deselectSeat]
  );

  const clearSelections = useCallback(() => {
    graph.clearSelections();
    recalculate();
  }, [graph, recalculate]);

  const getZoneSeats = useCallback(
    (zoneId: string) => graph.getZoneSeats(zoneId),
    [graph]
  );

  const dismissWarning = useCallback(() => {
    setWarningDismissed(true);
  }, []);

  const stats = useMemo(() => graph.getStats(), [graph, selectedCount]);

  return {
    orphanAnalysis,
    hasWarning: orphanAnalysis.hasOrphans && !warningDismissed,
    selectedSeats: graph.getSelectedSeats(),
    getZoneSeats,
    selectSeat,
    deselectSeat,
    toggleSeat,
    clearSelections,
    stats,
    zoneConfigs: ZONE_CONFIGS,
    dismissWarning,
  };
}
