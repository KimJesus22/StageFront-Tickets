// ============================================================================
// 🤖 BOT CLASSIFIER — Clasificador de patrones no humanos
// ============================================================================
//
// Implementa un sistema de scoring basado en reglas heurísticas para
// clasificar el comportamiento como humano o bot.
//
// Cada regla aporta una puntuación de riesgo (0–100). La suma ponderada
// determina el veredicto:
//
//   Score 0–30   → "human"   (sin restricciones)
//   Score 31–60  → "suspect" (soft block: requiere verificación OTP extra)
//   Score 61–100 → "bot"     (hard block: acceso denegado)
//
// Reglas de clasificación:
//   R1: Click rhythm — intervalos demasiado uniformes (σ < 15ms)
//   R2: Mouse linearity — ratio de líneas rectas > 80%
//   R3: Mouse speed — velocidad constante (σ/μ < 0.1)
//   R4: No mouse movement — clics sin movimiento previo
//   R5: Session too short — sesión menor a 3 segundos
//   R6: Inhuman click speed — intervalos < 50ms
//   R7: No keyboard variation — cadencia de teclas perfecta
//   R8: Zero scroll — ningún evento de scroll
//   R9: Mouse angles — desviación angular demasiado baja
//
// ============================================================================

import type { BehaviorFingerprint } from "./BehaviorCollector";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type Verdict = "human" | "suspect" | "bot";

export interface RuleResult {
  /** Nombre de la regla */
  name: string;
  /** Puntuación de riesgo (0–100) */
  score: number;
  /** Peso de la regla (0–1) */
  weight: number;
  /** Contribución ponderada */
  weighted: number;
  /** Descripción humana del hallazgo */
  detail: string;
}

export interface ClassificationResult {
  /** Veredicto final */
  verdict: Verdict;
  /** Score total ponderado (0–100) */
  totalScore: number;
  /** Desglose de todas las reglas */
  rules: RuleResult[];
  /** Si se requiere verificación extra OTP */
  requiresOTP: boolean;
  /** Mensaje descriptivo */
  message: string;
  /** Timestamp */
  classifiedAt: number;
}

// ---------------------------------------------------------------------------
// Umbrales de clasificación
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  /** Score por encima del cual se clasifica como suspect */
  SUSPECT: 30,
  /** Score por encima del cual se clasifica como bot */
  BOT: 60,
  /** Intervalo mínimo entre clics para ser humano (ms) */
  MIN_HUMAN_CLICK_INTERVAL: 50,
  /** Desviación estándar mínima de click intervals para ser humano */
  MIN_CLICK_STDDEV: 15,
  /** Ratio máximo de linealidad para ser humano */
  MAX_LINEARITY_RATIO: 0.80,
  /** Coeficiente de variación mínimo de velocidad del mouse */
  MIN_SPEED_CV: 0.10,
  /** Ratio mínimo de clics con movimiento previo */
  MIN_CLICK_MOVEMENT_RATIO: 0.30,
  /** Duración mínima de sesión para ser humano (ms) */
  MIN_SESSION_DURATION: 3_000,
  /** Desviación estándar mínima de intervalos de teclas */
  MIN_KEY_STDDEV: 10,
  /** Desviación estándar mínima de ángulos del mouse (rad) */
  MIN_ANGLE_STDDEV: 0.05,
} as const;

// ---------------------------------------------------------------------------
// Motor de clasificación
// ---------------------------------------------------------------------------

/**
 * Clasifica un fingerprint de comportamiento.
 *
 * Ejecuta todas las reglas heurísticas y retorna un veredicto
 * con score ponderado.
 *
 * @param fp - Fingerprint generado por BehaviorCollector
 * @returns ClassificationResult
 *
 * @complexity O(1) — todo son operaciones aritméticas sobre resúmenes
 */
export function classify(fp: BehaviorFingerprint): ClassificationResult {
  const rules: RuleResult[] = [];

  // ─── R1: Click Rhythm Uniformity ───
  // Bots tienden a clickear a intervalos perfectos (σ ≈ 0)
  if (fp.clickIntervals.count >= 3) {
    const stdDev = fp.clickIntervals.stdDev;
    let score = 0;
    let detail = "";

    if (stdDev < THRESHOLDS.MIN_CLICK_STDDEV) {
      score = Math.min(100, Math.round((1 - stdDev / THRESHOLDS.MIN_CLICK_STDDEV) * 100));
      detail = `Click rhythm anormalmente uniforme (σ=${stdDev}ms, umbral=${THRESHOLDS.MIN_CLICK_STDDEV}ms)`;
    } else {
      detail = `Click rhythm normal (σ=${stdDev}ms)`;
    }

    rules.push({
      name: "Click Rhythm Uniformity",
      score,
      weight: 0.20,
      weighted: score * 0.20,
      detail,
    });
  }

  // ─── R2: Mouse Linearity ───
  // Los humanos mueven el mouse en curvas naturales, no en líneas rectas
  if (fp.totalMouseMoves >= 10) {
    let score = 0;
    let detail = "";

    if (fp.linearityRatio > THRESHOLDS.MAX_LINEARITY_RATIO) {
      score = Math.min(
        100,
        Math.round(
          ((fp.linearityRatio - THRESHOLDS.MAX_LINEARITY_RATIO) /
            (1 - THRESHOLDS.MAX_LINEARITY_RATIO)) *
            100
        )
      );
      detail = `Movimiento de mouse excesivamente lineal (${(fp.linearityRatio * 100).toFixed(1)}% recto)`;
    } else {
      detail = `Movimiento de mouse natural (${(fp.linearityRatio * 100).toFixed(1)}% recto)`;
    }

    rules.push({
      name: "Mouse Linearity",
      score,
      weight: 0.15,
      weighted: score * 0.15,
      detail,
    });
  }

  // ─── R3: Mouse Speed Consistency ───
  // Bots mueven el mouse a velocidad constante
  if (fp.mouseSpeed.count >= 5) {
    const cv =
      fp.mouseSpeed.mean > 0
        ? fp.mouseSpeed.stdDev / fp.mouseSpeed.mean
        : 0;
    let score = 0;
    let detail = "";

    if (cv < THRESHOLDS.MIN_SPEED_CV) {
      score = Math.min(100, Math.round((1 - cv / THRESHOLDS.MIN_SPEED_CV) * 100));
      detail = `Velocidad de mouse sospechosamente constante (CV=${cv.toFixed(3)})`;
    } else {
      detail = `Velocidad de mouse variable (CV=${cv.toFixed(3)})`;
    }

    rules.push({
      name: "Mouse Speed Consistency",
      score,
      weight: 0.10,
      weighted: score * 0.10,
      detail,
    });
  }

  // ─── R4: Clicks Without Mouse Movement ───
  // Bots hacen clic directo sin mover el mouse
  if (fp.totalClicks >= 3) {
    let score = 0;
    let detail = "";

    if (fp.clicksWithMouseMovement < THRESHOLDS.MIN_CLICK_MOVEMENT_RATIO) {
      score = Math.min(
        100,
        Math.round(
          (1 - fp.clicksWithMouseMovement / THRESHOLDS.MIN_CLICK_MOVEMENT_RATIO) * 100
        )
      );
      detail = `Clics sin movimiento previo (${(fp.clicksWithMouseMovement * 100).toFixed(0)}% con movimiento)`;
    } else {
      detail = `Clics con movimiento natural (${(fp.clicksWithMouseMovement * 100).toFixed(0)}% con movimiento)`;
    }

    rules.push({
      name: "Clicks Without Movement",
      score,
      weight: 0.15,
      weighted: score * 0.15,
      detail,
    });
  }

  // ─── R5: Session Duration ───
  // Sesiones extremadamente cortas son sospechosas
  {
    let score = 0;
    let detail = "";

    if (fp.sessionDurationMs < THRESHOLDS.MIN_SESSION_DURATION) {
      score = Math.min(
        100,
        Math.round(
          (1 - fp.sessionDurationMs / THRESHOLDS.MIN_SESSION_DURATION) * 100
        )
      );
      detail = `Sesión demasiado corta (${(fp.sessionDurationMs / 1000).toFixed(1)}s)`;
    } else {
      detail = `Duración de sesión normal (${(fp.sessionDurationMs / 1000).toFixed(1)}s)`;
    }

    rules.push({
      name: "Session Duration",
      score,
      weight: 0.10,
      weighted: score * 0.10,
      detail,
    });
  }

  // ─── R6: Inhuman Click Speed ───
  // Clics más rápidos de 50ms son imposibles para humanos
  if (fp.clickIntervals.count >= 2) {
    let score = 0;
    let detail = "";

    if (fp.clickIntervals.min < THRESHOLDS.MIN_HUMAN_CLICK_INTERVAL) {
      score = Math.min(
        100,
        Math.round(
          (1 - fp.clickIntervals.min / THRESHOLDS.MIN_HUMAN_CLICK_INTERVAL) * 100
        )
      );
      detail = `Velocidad de clic inhumana (mín=${fp.clickIntervals.min}ms)`;
    } else {
      detail = `Velocidad de clic normal (mín=${fp.clickIntervals.min}ms)`;
    }

    rules.push({
      name: "Inhuman Click Speed",
      score,
      weight: 0.15,
      weighted: score * 0.15,
      detail,
    });
  }

  // ─── R7: Keyboard Cadence Uniformity ───
  if (fp.keyIntervals.count >= 5) {
    let score = 0;
    let detail = "";

    if (fp.keyIntervals.stdDev < THRESHOLDS.MIN_KEY_STDDEV) {
      score = Math.min(100, Math.round((1 - fp.keyIntervals.stdDev / THRESHOLDS.MIN_KEY_STDDEV) * 100));
      detail = `Cadencia de teclado mecánica (σ=${fp.keyIntervals.stdDev}ms)`;
    } else {
      detail = `Cadencia de teclado natural (σ=${fp.keyIntervals.stdDev}ms)`;
    }

    rules.push({
      name: "Keyboard Cadence",
      score,
      weight: 0.05,
      weighted: score * 0.05,
      detail,
    });
  }

  // ─── R8: Scroll Activity ───
  // Los humanos tienden a hacer scroll al navegar
  if (fp.sessionDurationMs > 5_000) {
    let score = 0;
    let detail = "";

    if (fp.scrollEventCount === 0) {
      score = 30; // Sospechoso pero no definitivo
      detail = "Sin actividad de scroll en sesión larga";
    } else {
      detail = `Scroll normal (${fp.scrollEventCount} eventos)`;
    }

    rules.push({
      name: "Scroll Activity",
      score,
      weight: 0.05,
      weighted: score * 0.05,
      detail,
    });
  }

  // ─── R9: Mouse Angle Variation ───
  if (fp.mouseAngles.count >= 5) {
    let score = 0;
    let detail = "";

    if (fp.mouseAngles.stdDev < THRESHOLDS.MIN_ANGLE_STDDEV) {
      score = Math.min(100, Math.round((1 - fp.mouseAngles.stdDev / THRESHOLDS.MIN_ANGLE_STDDEV) * 100));
      detail = `Ángulos de mouse sin variación (σ=${fp.mouseAngles.stdDev.toFixed(3)} rad)`;
    } else {
      detail = `Ángulos de mouse naturales (σ=${fp.mouseAngles.stdDev.toFixed(3)} rad)`;
    }

    rules.push({
      name: "Mouse Angle Variation",
      score,
      weight: 0.05,
      weighted: score * 0.05,
      detail,
    });
  }

  // ─── Calcular score total ───
  const totalWeight = rules.reduce((s, r) => s + r.weight, 0);
  const rawScore =
    totalWeight > 0
      ? rules.reduce((s, r) => s + r.weighted, 0) / totalWeight
      : 0;
  const totalScore = Math.round(Math.min(100, rawScore));

  // ─── Veredicto ───
  let verdict: Verdict;
  let message: string;

  if (totalScore >= THRESHOLDS.BOT) {
    verdict = "bot";
    message =
      "Patrón de navegación no reconocido. Acceso denegado por seguridad.";
  } else if (totalScore >= THRESHOLDS.SUSPECT) {
    verdict = "suspect";
    message =
      "Se detectó un patrón inusual. Se requiere verificación adicional.";
  } else {
    verdict = "human";
    message = "Patrón de comportamiento verificado.";
  }

  return {
    verdict,
    totalScore,
    rules,
    requiresOTP: verdict === "suspect",
    message,
    classifiedAt: Date.now(),
  };
}
