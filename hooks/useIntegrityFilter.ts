// ============================================================================
// 🛡️ useIntegrityFilter — React Hook para el Filtro de Integridad
// ============================================================================
//
// Uso en cualquier componente que requiera validación anti-bot:
//
//   const { verdict, score, isBlocked, requiresOTP, validate } = useIntegrityFilter();
//
//   // Al hacer checkout:
//   const result = await validate();
//   if (result.requiresOTP) { showOTPModal(); }
//   if (result.verdict === 'bot') { blockAccess(); }
//
// El collector se adjunta al montar y se desadjunta al desmontar.
// No requiere props ni configuración.
//
// ============================================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BehaviorCollector, type BehaviorFingerprint } from "@/lib/integrity/BehaviorCollector";
import { classify, type ClassificationResult, type Verdict } from "@/lib/integrity/BotClassifier";

// ---------------------------------------------------------------------------
// Tipos del hook
// ---------------------------------------------------------------------------

export interface IntegrityState {
  /** Veredicto actual */
  verdict: Verdict;
  /** Score numérico (0–100) */
  score: number;
  /** Si el acceso está bloqueado */
  isBlocked: boolean;
  /** Si se requiere OTP adicional */
  requiresOTP: boolean;
  /** Si la validación del servidor fue exitosa */
  serverValidated: boolean;
  /** Mensaje descriptivo para el usuario */
  message: string;
  /** Si se está procesando la validación */
  isValidating: boolean;
}

export interface IntegrityActions {
  /**
   * Ejecuta la clasificación local y la validación en el servidor.
   * @returns ClassificationResult con el veredicto completo
   */
  validate: () => Promise<ClassificationResult>;
  /**
   * Retorna el fingerprint actual sin clasificar.
   * Útil para debugging.
   */
  getFingerprint: () => BehaviorFingerprint | null;
  /**
   * Resetea el collector (nueva sesión).
   */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useIntegrityFilter(): IntegrityState & IntegrityActions {
  const collectorRef = useRef<BehaviorCollector | null>(null);

  const [state, setState] = useState<IntegrityState>({
    verdict: "human",
    score: 0,
    isBlocked: false,
    requiresOTP: false,
    serverValidated: false,
    message: "",
    isValidating: false,
  });

  // Montar el collector al iniciar
  useEffect(() => {
    const collector = new BehaviorCollector();
    collector.attach();
    collectorRef.current = collector;

    return () => {
      collector.detach();
      collectorRef.current = null;
    };
  }, []);

  // ─── validate() ───
  const validate = useCallback(async (): Promise<ClassificationResult> => {
    setState((s) => ({ ...s, isValidating: true }));

    const collector = collectorRef.current;
    if (!collector) {
      const fallback: ClassificationResult = {
        verdict: "human",
        totalScore: 0,
        rules: [],
        requiresOTP: false,
        message: "Collector no disponible — permitiendo acceso",
        classifiedAt: Date.now(),
      };
      setState((s) => ({ ...s, isValidating: false }));
      return fallback;
    }

    // 1. Clasificación local (O(1))
    const fingerprint = collector.getFingerprint();
    const localResult = classify(fingerprint);

    // 2. Validación en el servidor
    let serverResult = localResult;
    try {
      const res = await fetch("/api/integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint }),
      });

      if (res.ok) {
        const serverData = await res.json();
        // El servidor puede override el veredicto local
        if (serverData.verdict) {
          serverResult = { ...localResult, ...serverData };
        }
      }
    } catch {
      // Si el servidor no responde, usar veredicto local
      console.warn("[IntegrityFilter] Servidor no disponible, usando clasificación local");
    }

    // 3. Actualizar estado
    setState({
      verdict: serverResult.verdict,
      score: serverResult.totalScore,
      isBlocked: serverResult.verdict === "bot",
      requiresOTP: serverResult.requiresOTP,
      serverValidated: true,
      message: serverResult.message,
      isValidating: false,
    });

    return serverResult;
  }, []);

  // ─── getFingerprint() ───
  const getFingerprint = useCallback((): BehaviorFingerprint | null => {
    return collectorRef.current?.getFingerprint() ?? null;
  }, []);

  // ─── reset() ───
  const reset = useCallback(() => {
    collectorRef.current?.reset();
    setState({
      verdict: "human",
      score: 0,
      isBlocked: false,
      requiresOTP: false,
      serverValidated: false,
      message: "",
      isValidating: false,
    });
  }, []);

  return {
    ...state,
    validate,
    getFingerprint,
    reset,
  };
}
