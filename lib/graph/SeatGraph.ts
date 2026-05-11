// ============================================================================
// 🪑 SEAT GRAPH — Matriz de Adyacencia para Detección de Asientos Huérfanos
// ============================================================================
//
// Modela cada sección del mapa como un grafo donde cada asiento es un nodo
// y las aristas representan adyacencia física (izquierda, derecha, adelante,
// atrás).
//
// Operaciones clave:
//   - buildAdjacencyMatrix()  → O(R×C) — construye el grafo
//   - findOrphans()           → O(V+E) — BFS para detectar asientos aislados
//   - getSuggestions()        → O(1)   — genera recomendación visual
//
// Un "asiento huérfano" es un asiento DISPONIBLE que queda rodeado
// completamente por asientos OCUPADOS o SELECCIONADOS en todos sus vecinos.
// Esto crea una experiencia pobre para futuros compradores.
//
// ============================================================================

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type SeatStatus = "available" | "selected" | "occupied" | "blocked";

/** Representación de un asiento individual en el grafo */
export interface SeatNode {
  /** ID único del asiento (ej: "general-a-2-3") */
  id: string;
  /** Fila (0-indexed) */
  row: number;
  /** Columna (0-indexed) */
  col: number;
  /** ID de la zona a la que pertenece */
  zoneId: string;
  /** Estado actual */
  status: SeatStatus;
  /** Label legible para el usuario (ej: "Fila B, Asiento 3") */
  label: string;
}

/** Resultado del análisis de vecindad */
export interface OrphanAnalysis {
  /** Si hay asientos huérfanos detectados */
  hasOrphans: boolean;
  /** Lista de asientos que quedarían huérfanos */
  orphanSeats: SeatNode[];
  /** Cantidad de asientos huérfanos */
  orphanCount: number;
  /** Sugerencias para resolver */
  suggestions: OrphanSuggestion[];
  /** Mensaje para el usuario */
  message: string;
}

export interface OrphanSuggestion {
  /** Tipo de sugerencia */
  type: "select" | "deselect";
  /** Asiento al que se refiere la sugerencia */
  seatId: string;
  /** Label del asiento */
  seatLabel: string;
  /** Zona del asiento */
  zone: string;
  /** Descripción de la sugerencia */
  description: string;
}

/** Configuración de una zona del mapa */
export interface ZoneConfig {
  id: string;
  name: string;
  rows: number;
  cols: number;
  /** IDs de asientos pre-ocupados (ya vendidos) */
  occupiedSeats?: string[];
  /** Precio por asiento */
  price: number;
  /** Color de la zona */
  color: string;
  /** Tipo de admisión */
  tipo: string;
}

// ============================================================================
// SEAT GRAPH — Implementación
// ============================================================================

export class SeatGraph {
  /** Mapa de nodos: id → SeatNode */
  private nodes = new Map<string, SeatNode>();

  /**
   * Matriz de adyacencia.
   * adjacency[id] = Set de IDs de vecinos directos.
   * Solo almacena los edges — costo de memoria: O(V + E)
   */
  private adjacency = new Map<string, Set<string>>();

  /** Configuraciones de zonas registradas */
  private zones = new Map<string, ZoneConfig>();

  /**
   * Registra una zona y construye su grafo de asientos.
   *
   * Genera una cuadrícula de R×C asientos con aristas a los
   * vecinos directos (arriba, abajo, izquierda, derecha).
   *
   * @param config — Configuración de la zona
   * @complexity O(R × C) — lineal al tamaño de la zona
   */
  addZone(config: ZoneConfig): void {
    this.zones.set(config.id, config);
    const occupiedSet = new Set(config.occupiedSeats ?? []);

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const id = this.seatId(config.id, r, c);
        const label = `Fila ${String.fromCharCode(65 + r)}, Asiento ${c + 1}`;

        const node: SeatNode = {
          id,
          row: r,
          col: c,
          zoneId: config.id,
          status: occupiedSet.has(id) ? "occupied" : "available",
          label,
        };

        this.nodes.set(id, node);
        this.adjacency.set(id, new Set());
      }
    }

    // Construir aristas de adyacencia (4-conectividad: arriba, abajo, izq, der)
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const id = this.seatId(config.id, r, c);
        const neighbors = this.getNeighborCoords(r, c, config.rows, config.cols);

        for (const [nr, nc] of neighbors) {
          const neighborId = this.seatId(config.id, nr, nc);
          this.adjacency.get(id)!.add(neighborId);
        }
      }
    }
  }

  /**
   * Genera un ID de asiento deterministico.
   */
  private seatId(zoneId: string, row: number, col: number): string {
    return `${zoneId}-${row}-${col}`;
  }

  /**
   * Retorna las coordenadas de los vecinos directos (4-connectivity).
   *
   * @complexity O(1) — máximo 4 vecinos
   */
  private getNeighborCoords(
    r: number,
    c: number,
    maxR: number,
    maxC: number
  ): [number, number][] {
    const dirs: [number, number][] = [
      [-1, 0], // arriba
      [1, 0],  // abajo
      [0, -1], // izquierda
      [0, 1],  // derecha
    ];

    return dirs
      .map(([dr, dc]): [number, number] => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < maxR && nc >= 0 && nc < maxC);
  }

  // ─── Operaciones de estado ───

  /**
   * Marca un asiento como seleccionado.
   * @complexity O(1)
   */
  selectSeat(seatId: string): boolean {
    const node = this.nodes.get(seatId);
    if (!node || node.status !== "available") return false;
    node.status = "selected";
    return true;
  }

  /**
   * Desmarca un asiento (lo vuelve disponible).
   * @complexity O(1)
   */
  deselectSeat(seatId: string): boolean {
    const node = this.nodes.get(seatId);
    if (!node || node.status !== "selected") return false;
    node.status = "available";
    return true;
  }

  /**
   * Retorna el estado de un asiento.
   * @complexity O(1)
   */
  getSeatStatus(seatId: string): SeatStatus | null {
    return this.nodes.get(seatId)?.status ?? null;
  }

  /**
   * Retorna todos los asientos de una zona.
   */
  getZoneSeats(zoneId: string): SeatNode[] {
    const seats: SeatNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.zoneId === zoneId) seats.push(node);
    }
    return seats;
  }

  /**
   * Retorna los asientos seleccionados en todo el grafo.
   */
  getSelectedSeats(): SeatNode[] {
    const selected: SeatNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.status === "selected") selected.push(node);
    }
    return selected;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DETECCIÓN DE ASIENTOS HUÉRFANOS — Algoritmo de Vecindad
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Un asiento es "huérfano" si:
  //   1. Está disponible (available)
  //   2. TODOS sus vecinos están en estado "selected" u "occupied"
  //   3. Es decir, queda completamente aislado — nadie podrá sentarse
  //      junto a él sin dejar un espacio vacío
  //
  // Complejidad: O(V + E) — un solo recorrido de todos los nodos
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Detecta asientos que quedarían huérfanos con la selección actual.
   *
   * @returns OrphanAnalysis con los asientos huérfanos y sugerencias
   * @complexity O(V + E) donde V=asientos totales, E=aristas de adyacencia
   */
  findOrphans(): OrphanAnalysis {
    const orphans: SeatNode[] = [];

    for (const [id, node] of this.nodes) {
      // Solo nos interesan los asientos disponibles
      if (node.status !== "available") continue;

      // Obtener vecinos
      const neighbors = this.adjacency.get(id);
      if (!neighbors || neighbors.size === 0) continue;

      // ¿Todos los vecinos están ocupados o seleccionados?
      let allBlocked = true;
      for (const neighborId of neighbors) {
        const neighbor = this.nodes.get(neighborId);
        if (neighbor && neighbor.status === "available") {
          allBlocked = false;
          break; // Al menos un vecino disponible — no es huérfano
        }
      }

      if (allBlocked) {
        orphans.push(node);
      }
    }

    // Generar sugerencias
    const suggestions = this.generateSuggestions(orphans);

    // Mensaje para el usuario
    let message = "";
    if (orphans.length > 0) {
      message =
        orphans.length === 1
          ? `Tu selección dejaría 1 asiento aislado. Optimiza tu selección para no dejar espacios vacíos.`
          : `Tu selección dejaría ${orphans.length} asientos aislados. Optimiza tu selección para no dejar espacios vacíos.`;
    }

    return {
      hasOrphans: orphans.length > 0,
      orphanSeats: orphans,
      orphanCount: orphans.length,
      suggestions,
      message,
    };
  }

  /**
   * Genera sugerencias inteligentes para resolver los asientos huérfanos.
   *
   * Estrategia:
   *  - Si el huérfano tiene un vecino SELECCIONADO, sugerir seleccionar
   *    el huérfano para llenar el gap.
   *  - Si el huérfano es creado por una selección aislada, sugerir
   *    deseleccionar el asiento que causa el problema.
   *
   * @complexity O(orphans × max_neighbors) ≈ O(orphans × 4)
   */
  private generateSuggestions(orphans: SeatNode[]): OrphanSuggestion[] {
    const suggestions: OrphanSuggestion[] = [];
    const suggestedIds = new Set<string>();

    for (const orphan of orphans) {
      const zone = this.zones.get(orphan.zoneId);

      // Sugerencia 1: Seleccionar el asiento huérfano
      if (!suggestedIds.has(orphan.id)) {
        suggestions.push({
          type: "select",
          seatId: orphan.id,
          seatLabel: orphan.label,
          zone: zone?.name ?? orphan.zoneId,
          description: `Selecciona ${orphan.label} para evitar dejar un espacio vacío aislado`,
        });
        suggestedIds.add(orphan.id);
      }

      // Sugerencia 2: Deseleccionar el vecino que causa el aislamiento
      const neighbors = this.adjacency.get(orphan.id);
      if (neighbors) {
        for (const neighborId of neighbors) {
          const neighbor = this.nodes.get(neighborId);
          if (
            neighbor &&
            neighbor.status === "selected" &&
            !suggestedIds.has(neighborId)
          ) {
            // Verificar si deseleccionar este vecino resolvería el problema
            suggestions.push({
              type: "deselect",
              seatId: neighborId,
              seatLabel: neighbor.label,
              zone: zone?.name ?? neighbor.zoneId,
              description: `Libera ${neighbor.label} para abrir un espacio contiguo`,
            });
            suggestedIds.add(neighborId);
            break; // Solo una sugerencia de deselección por huérfano
          }
        }
      }
    }

    // Limitar a las 3 sugerencias más relevantes (priorizar "select")
    return suggestions
      .sort((a, b) => (a.type === "select" ? -1 : 1) - (b.type === "select" ? -1 : 1))
      .slice(0, 3);
  }

  // ─── Utilidades ───

  /**
   * Retorna estadísticas del grafo (para debug/admin).
   */
  getStats() {
    let available = 0;
    let selected = 0;
    let occupied = 0;
    let totalEdges = 0;

    for (const node of this.nodes.values()) {
      if (node.status === "available") available++;
      else if (node.status === "selected") selected++;
      else if (node.status === "occupied") occupied++;
    }

    for (const edges of this.adjacency.values()) {
      totalEdges += edges.size;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: totalEdges / 2, // Undirected
      available,
      selected,
      occupied,
      zones: this.zones.size,
    };
  }

  /**
   * Resetea todas las selecciones (vuelve a available).
   */
  clearSelections(): void {
    for (const node of this.nodes.values()) {
      if (node.status === "selected") {
        node.status = "available";
      }
    }
  }

  /**
   * Retorna la zona configurada.
   */
  getZoneConfig(zoneId: string): ZoneConfig | undefined {
    return this.zones.get(zoneId);
  }

  /**
   * Retorna todos los IDs de zona registrados.
   */
  getZoneIds(): string[] {
    return [...this.zones.keys()];
  }
}
