import { useState, useEffect } from "react";

// ============================================================================
// ⏱️ useDebounce — Custom Hook para limitar la frecuencia de ejecución
// ============================================================================
//
// Implementa el patrón Debounce usando el ciclo de vida de React:
//
//   • Cada vez que `value` cambia, se programa un setTimeout de `delay` ms.
//   • Si `value` cambia de nuevo antes de que el timer expire,
//     el efecto de limpieza (cleanup) cancela el timer anterior.
//   • Solo cuando el usuario DEJA de escribir por `delay` ms,
//     el valor debounced se actualiza → disparando el efecto dependiente.
//
// Complejidad temporal: O(1) por keystroke (solo programa/cancela un timer).
// Complejidad espacial: O(1) — un solo timer activo a la vez.
//
// @param value   - El valor reactivo a debouncear
// @param delay   - Milisegundos de espera (default: 500ms)
// @returns       - El valor debounced (actualizado solo tras el delay)
//
// @example
// ```tsx
// const debouncedEmail = useDebounce(email, 500);
// useEffect(() => {
//   if (debouncedEmail) checkEmailExists(debouncedEmail);
// }, [debouncedEmail]);
// ```
// ============================================================================

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Programar actualización después del delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancelar el timer si value cambia antes de que expire
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
