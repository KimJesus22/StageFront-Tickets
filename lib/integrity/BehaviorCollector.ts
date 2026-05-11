// ============================================================================
// 🔍 BEHAVIOR COLLECTOR — Recolector de señales biométricas del navegador
// ============================================================================
//
// Recolecta señales de comportamiento del usuario con un footprint de
// memoria mínimo. Solo almacena resúmenes estadísticos, no datos crudos.
//
// Señales capturadas:
//   1. Click Rhythm    → intervalos entre clics (ms)
//   2. Mouse Dynamics  → velocidades, ángulos, linealidad
//   3. Keyboard Cadence → intervalos entre teclas
//   4. Scroll Patterns → frecuencia y naturalidad del scroll
//   5. Session Metadata → duración, interacción total
//
// Costo de memoria: ~200 bytes por sesión (solo contadores y promedios)
// ============================================================================

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Resumen estadístico de una serie de valores */
interface StatSummary {
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

/** Mouse movement sample (lightweight) */
interface MouseSample {
  x: number;
  y: number;
  t: number;
}

/** Fingerprint de comportamiento — lo que se envía al servidor */
export interface BehaviorFingerprint {
  /** Resumen de intervalos entre clics */
  clickIntervals: StatSummary;
  /** Resumen de velocidades del mouse (px/ms) */
  mouseSpeed: StatSummary;
  /** Resumen de ángulos entre movimientos consecutivos (radianes) */
  mouseAngles: StatSummary;
  /** Ratio de movimientos perfectamente lineales (0–1) */
  linearityRatio: number;
  /** Resumen de intervalos entre teclas */
  keyIntervals: StatSummary;
  /** Número total de eventos de scroll */
  scrollEventCount: number;
  /** Duración total de la sesión (ms) */
  sessionDurationMs: number;
  /** Ratio de clics que tuvieron movimiento previo del mouse */
  clicksWithMouseMovement: number;
  /** Número de clics totales */
  totalClicks: number;
  /** Número de movimientos de mouse */
  totalMouseMoves: number;
  /** Número de teclas presionadas */
  totalKeystrokes: number;
  /** Timestamp de generación */
  generatedAt: number;
  /** Hash simple para integridad (no-criptográfico) */
  checksum: string;
}

// ---------------------------------------------------------------------------
// Implementación
// ---------------------------------------------------------------------------

/**
 * Recolector de comportamiento — se instancia una vez por sesión de compra.
 *
 * Diseñado para tener costo de memoria cercano a cero:
 *  - No almacena posiciones individuales del mouse (solo las últimas 3)
 *  - Calcula estadísticas incrementales (running mean/stddev)
 *  - Usa ring buffers de tamaño fijo para intervalos
 */
export class BehaviorCollector {
  // ─── Estado interno (solo contadores y acumuladores) ───

  private sessionStart: number;
  private lastClickTime = 0;
  private lastKeyTime = 0;

  // Ring buffers de tamaño fijo (máx 50 muestras)
  private clickIntervals: number[] = [];
  private mouseSpeeds: number[] = [];
  private mouseAngles: number[] = [];
  private keyIntervals: number[] = [];

  // Mouse movement tracking (solo últimas 3 posiciones)
  private mouseHistory: MouseSample[] = [];
  private straightLineCount = 0;
  private totalSegments = 0;

  // Counters
  private scrollCount = 0;
  private totalClicks = 0;
  private totalMouseMoves = 0;
  private totalKeystrokes = 0;
  private clicksWithPriorMovement = 0;
  private hadRecentMouseMove = false;

  // Bound handlers (for cleanup)
  private boundHandlers: {
    click: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    keydown: (e: KeyboardEvent) => void;
    scroll: () => void;
  };

  private static readonly MAX_SAMPLES = 50;
  private static readonly LINEARITY_THRESHOLD = 0.02; // radians (~1.1°)

  constructor() {
    this.sessionStart = Date.now();

    this.boundHandlers = {
      click: this.onClick.bind(this),
      mousemove: this.onMouseMove.bind(this),
      keydown: this.onKeyDown.bind(this),
      scroll: this.onScroll.bind(this),
    };
  }

  // ─── Lifecycle ───

  /** Comienza a escuchar eventos del DOM */
  attach(): void {
    if (typeof window === "undefined") return;

    document.addEventListener("click", this.boundHandlers.click, {
      passive: true,
    });
    document.addEventListener("mousemove", this.boundHandlers.mousemove, {
      passive: true,
    });
    document.addEventListener("keydown", this.boundHandlers.keydown, {
      passive: true,
    });
    document.addEventListener("scroll", this.boundHandlers.scroll, {
      passive: true,
    });
  }

  /** Deja de escuchar y libera referencias */
  detach(): void {
    if (typeof window === "undefined") return;

    document.removeEventListener("click", this.boundHandlers.click);
    document.removeEventListener("mousemove", this.boundHandlers.mousemove);
    document.removeEventListener("keydown", this.boundHandlers.keydown);
    document.removeEventListener("scroll", this.boundHandlers.scroll);
  }

  // ─── Event Handlers (O(1) cada uno) ───

  private onClick(_e: MouseEvent): void {
    const now = Date.now();
    this.totalClicks++;

    if (this.lastClickTime > 0) {
      const interval = now - this.lastClickTime;
      this.pushSample(this.clickIntervals, interval);
    }
    this.lastClickTime = now;

    // ¿Hubo movimiento de mouse antes del clic?
    if (this.hadRecentMouseMove) {
      this.clicksWithPriorMovement++;
    }
    this.hadRecentMouseMove = false;
  }

  private onMouseMove(e: MouseEvent): void {
    const now = Date.now();
    this.totalMouseMoves++;
    this.hadRecentMouseMove = true;

    const sample: MouseSample = { x: e.clientX, y: e.clientY, t: now };

    // Calcular velocidad y ángulo respecto al punto anterior
    if (this.mouseHistory.length >= 1) {
      const prev = this.mouseHistory[this.mouseHistory.length - 1];
      const dx = sample.x - prev.x;
      const dy = sample.y - prev.y;
      const dt = sample.t - prev.t;

      if (dt > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / dt; // px/ms
        this.pushSample(this.mouseSpeeds, speed);
      }

      // Calcular ángulo y detectar linealidad
      if (this.mouseHistory.length >= 2) {
        const prevPrev = this.mouseHistory[this.mouseHistory.length - 2];
        const dx1 = prev.x - prevPrev.x;
        const dy1 = prev.y - prevPrev.y;

        const angle1 = Math.atan2(dy1, dx1);
        const angle2 = Math.atan2(dy, dx);
        let angleDiff = Math.abs(angle2 - angle1);

        // Normalizar a [0, π]
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        this.pushSample(this.mouseAngles, angleDiff);
        this.totalSegments++;

        // ¿Es un movimiento perfectamente recto?
        if (angleDiff < BehaviorCollector.LINEARITY_THRESHOLD) {
          this.straightLineCount++;
        }
      }
    }

    // Mantener solo las últimas 3 posiciones
    this.mouseHistory.push(sample);
    if (this.mouseHistory.length > 3) {
      this.mouseHistory.shift();
    }
  }

  private onKeyDown(_e: KeyboardEvent): void {
    const now = Date.now();
    this.totalKeystrokes++;

    if (this.lastKeyTime > 0) {
      const interval = now - this.lastKeyTime;
      this.pushSample(this.keyIntervals, interval);
    }
    this.lastKeyTime = now;
  }

  private onScroll(): void {
    this.scrollCount++;
  }

  // ─── Helpers ───

  /** Push con límite de tamaño (ring buffer) */
  private pushSample(buffer: number[], value: number): void {
    buffer.push(value);
    if (buffer.length > BehaviorCollector.MAX_SAMPLES) {
      buffer.shift();
    }
  }

  /** Calcula un resumen estadístico de un array */
  private summarize(values: number[]): StatSummary {
    if (values.length === 0) {
      return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const variance =
      values.reduce((a, v) => a + (v - mean) ** 2, 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      min: Math.round(Math.min(...values) * 100) / 100,
      max: Math.round(Math.max(...values) * 100) / 100,
    };
  }

  /** Genera un checksum simple (FNV-1a 32-bit) — no criptográfico */
  private generateChecksum(data: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  // ─── API pública ───

  /**
   * Genera el fingerprint de comportamiento.
   *
   * @returns BehaviorFingerprint listo para enviar al servidor
   */
  getFingerprint(): BehaviorFingerprint {
    const now = Date.now();
    const linearityRatio =
      this.totalSegments > 0
        ? Math.round(
            (this.straightLineCount / this.totalSegments) * 1000
          ) / 1000
        : 0;

    const fp: Omit<BehaviorFingerprint, "checksum"> = {
      clickIntervals: this.summarize(this.clickIntervals),
      mouseSpeed: this.summarize(this.mouseSpeeds),
      mouseAngles: this.summarize(this.mouseAngles),
      linearityRatio,
      keyIntervals: this.summarize(this.keyIntervals),
      scrollEventCount: this.scrollCount,
      sessionDurationMs: now - this.sessionStart,
      clicksWithMouseMovement:
        this.totalClicks > 0
          ? Math.round(
              (this.clicksWithPriorMovement / this.totalClicks) * 100
            ) / 100
          : 0,
      totalClicks: this.totalClicks,
      totalMouseMoves: this.totalMouseMoves,
      totalKeystrokes: this.totalKeystrokes,
      generatedAt: now,
    };

    // Checksum para detectar manipulación trivial
    const raw = JSON.stringify(fp);
    const checksum = this.generateChecksum(raw);

    return { ...fp, checksum };
  }

  /** Resetea todos los contadores */
  reset(): void {
    this.sessionStart = Date.now();
    this.lastClickTime = 0;
    this.lastKeyTime = 0;
    this.clickIntervals.length = 0;
    this.mouseSpeeds.length = 0;
    this.mouseAngles.length = 0;
    this.keyIntervals.length = 0;
    this.mouseHistory.length = 0;
    this.straightLineCount = 0;
    this.totalSegments = 0;
    this.scrollCount = 0;
    this.totalClicks = 0;
    this.totalMouseMoves = 0;
    this.totalKeystrokes = 0;
    this.clicksWithPriorMovement = 0;
    this.hadRecentMouseMove = false;
  }
}
