// ============================================================================
// 🔐 PASSWORD POLICY — Motor de Validación de Contraseñas
// ============================================================================
//
// Clase utilitaria estática que implementa validación de contraseñas con:
//
//   • Lista Negra (Set<string>):
//     Estructura de datos con búsqueda en O(1) amortizado.
//     Internamente un HashSet usa una tabla hash donde la operación
//     .has() computa el hash de la clave y accede al bucket directamente,
//     sin necesidad de iterar sobre los elementos.
//
//   • Expresión Regular (Autómata Finito):
//     El regex se compila una sola vez como constante estática.
//     El motor de regex de V8 lo convierte en un autómata finito
//     determinista (DFA) que evalúa la cadena en O(n) donde n es
//     la longitud de la contraseña.
//
//   • Complejidad Total: O(n) — dominada por la evaluación del regex.
//     La verificación contra la lista negra es O(1) amortizado.
//
// ============================================================================

// ---------------------------------------------------------------------------
// Tipo de retorno de la validación
// ---------------------------------------------------------------------------

export interface PasswordValidationResult {
  /** Indica si la contraseña cumple con todas las políticas */
  isValid: boolean;
  /** Mensaje de error descriptivo (solo presente cuando isValid === false) */
  error?: string;
}

// ---------------------------------------------------------------------------
// Clase PasswordPolicy — Estática (no instanciable)
// ---------------------------------------------------------------------------

/**
 * Motor de validación de contraseñas.
 *
 * Clase puramente estática — no se puede instanciar.
 * Todos los miembros son `static` y la clase actúa como un namespace
 * con comportamiento, siguiendo el patrón Utility Class de OOP.
 *
 * @example
 * ```ts
 * import { PasswordPolicy } from "@/lib/utils/PasswordPolicy";
 *
 * const result = PasswordPolicy.validate("miC0ntraseña");
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export class PasswordPolicy {
  // ── Prevenir instanciación ───────────────────────────────────────────────
  private constructor() {
    throw new Error("PasswordPolicy es una clase estática. No se puede instanciar.");
  }

  // ── Lista Negra — O(1) lookup ────────────────────────────────────────────
  //
  // Set<string> usa internamente una tabla hash:
  //   • Inserción:  O(1) amortizado
  //   • Búsqueda:   O(1) amortizado  ← esto es lo que explotamos
  //   • Eliminación: O(1) amortizado
  //
  // Comparado con un Array.includes() que sería O(n), el Set garantiza
  // que el tiempo de validación NO crece con el tamaño de la lista negra.
  // ──────────────────────────────────────────────────────────────────────────

  private static readonly BLACKLISTED_PASSWORDS: Set<string> = new Set([
    "123456",
    "password",
    "qwerty",
    "admin123",
    "stagefront2026",
    "cruzazul123",
  ]);

  // ── Regex — Autómata Finito Determinista ─────────────────────────────────
  //
  // Patrón: ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$
  //
  // Desglose del autómata:
  //   ^                  → Ancla al inicio de la cadena
  //   (?=.*[A-Za-z])     → Lookahead positivo: al menos una letra (a-z, A-Z)
  //   (?=.*\d)           → Lookahead positivo: al menos un dígito (0-9)
  //   [A-Za-z\d]{8,}     → Clase de caracteres permitidos, mínimo 8
  //   $                  → Ancla al final de la cadena
  //
  // Compilado como `static readonly`, V8 lo optimiza una sola vez
  // y reutiliza el autómata compilado en cada invocación de .test().
  // ──────────────────────────────────────────────────────────────────────────

  private static readonly PASSWORD_REGEX: RegExp =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  // ── Mensajes de error (constantes centralizadas) ─────────────────────────

  private static readonly ERROR_BLACKLISTED =
    "Esta contraseña es demasiado común o insegura";

  private static readonly ERROR_WEAK_FORMAT =
    "La contraseña debe tener al menos 8 caracteres, una letra y un número";

  // ── Método de Validación ─────────────────────────────────────────────────
  //
  // Orden de evaluación (fail-fast):
  //   1. Lista negra (O(1)) — rechaza inmediatamente contraseñas conocidas
  //   2. Regex (O(n))       — valida formato solo si pasó la lista negra
  //
  // Este orden es óptimo porque la verificación más barata se ejecuta
  // primero, evitando el costo del regex para contraseñas triviales.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Valida una contraseña contra las políticas de seguridad de StageFront.
   *
   * @param password - La contraseña a validar (texto plano)
   * @returns `{ isValid: true }` si cumple, o `{ isValid: false, error: string }` si no
   *
   * @example
   * ```ts
   * PasswordPolicy.validate("123456");
   * // → { isValid: false, error: "Esta contraseña es demasiado común o insegura" }
   *
   * PasswordPolicy.validate("abc");
   * // → { isValid: false, error: "La contraseña debe tener al menos 8 caracteres, una letra y un número" }
   *
   * PasswordPolicy.validate("Segura2026");
   * // → { isValid: true }
   * ```
   */
  static validate(password: string): PasswordValidationResult {
    // 1. Verificar lista negra — O(1) amortizado
    if (PasswordPolicy.BLACKLISTED_PASSWORDS.has(password)) {
      return { isValid: false, error: PasswordPolicy.ERROR_BLACKLISTED };
    }

    // 2. Validar formato con regex — O(n)
    if (!PasswordPolicy.PASSWORD_REGEX.test(password)) {
      return { isValid: false, error: PasswordPolicy.ERROR_WEAK_FORMAT };
    }

    // ✅ Pasó todas las validaciones
    return { isValid: true };
  }
}
