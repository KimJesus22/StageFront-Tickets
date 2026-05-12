// ============================================================================
// 🗺️ ERROR MAPPER — Manejo Centralizado de Excepciones (Auth)
// ============================================================================
//
// Hash Map que traduce códigos/mensajes internos de Insforge a mensajes
// amigables para el usuario en español.
//
// Complejidad:
//   • Búsqueda exacta por key:     O(1) amortizado (property lookup)
//   • Búsqueda parcial por include: O(n) donde n = cantidad de entries
//
// Beneficio:
//   • Un solo punto de verdad para todos los mensajes de error de auth.
//   • Fallback genérico garantiza que la app nunca exponga errores internos.
//   • Agregar un nuevo mapeo es una sola línea, sin tocar lógica de negocio.
//
// ============================================================================

// ---------------------------------------------------------------------------
// Diccionario de Errores — Hash Map (Record<string, string>)
// ---------------------------------------------------------------------------

/**
 * Mapa de errores de autenticación.
 *
 * Las keys pueden ser:
 *   • Códigos de error de Insforge (ej. `user_already_exists`)
 *   • Fragmentos de mensajes del SDK (ej. `Invalid login credentials`)
 *
 * Los values son mensajes localizados y amigables para el usuario final.
 */
export const AuthErrorMap: Readonly<Record<string, string>> = {
  // ── Registro ─────────────────────────────────────────────────────────────
  user_already_exists: "Este correo ya está registrado.",
  "User already registered": "Este correo ya está registrado.",

  // ── Login ────────────────────────────────────────────────────────────────
  "Invalid login credentials": "Credenciales incorrectas. Verifica tu correo y contraseña.",
  invalid_credentials: "Credenciales incorrectas. Verifica tu correo y contraseña.",

  // ── Contraseña ───────────────────────────────────────────────────────────
  weak_password: "La contraseña es demasiado débil.",
  "Password should be at least": "La contraseña debe tener al menos 6 caracteres.",

  // ── Verificación de Email ────────────────────────────────────────────────
  email_not_confirmed: "Por favor, confirma tu correo electrónico antes de entrar.",
  "Email not confirmed": "Por favor, confirma tu correo electrónico antes de entrar.",
} as const;

// ---------------------------------------------------------------------------
// Mensaje Fallback (genérico)
// ---------------------------------------------------------------------------

const FALLBACK_MESSAGE = "Ocurrió un error inesperado. Inténtalo de nuevo.";

// ---------------------------------------------------------------------------
// Método de Traducción
// ---------------------------------------------------------------------------

/**
 * Traduce un código o mensaje de error de Insforge a un mensaje amigable.
 *
 * Estrategia de búsqueda (fail-fast, dos fases):
 *
 *   1. **Exact match** — O(1): Busca la key exacta en el Hash Map.
 *      Cubre códigos como `user_already_exists` o `invalid_credentials`.
 *
 *   2. **Partial match** — O(n): Si no hay match exacto, busca si alguna
 *      key del diccionario está contenida dentro del mensaje de error.
 *      Cubre mensajes del SDK como `"Password should be at least 6 chars"`.
 *
 *   3. **Fallback**: Si ninguna fase encuentra match, retorna el mensaje
 *      genérico. Esto garantiza que la app NUNCA exponga errores internos.
 *
 * @param errorKey - Código o mensaje de error del SDK de Insforge
 * @returns Mensaje amigable para el usuario en español
 *
 * @example
 * ```ts
 * getAuthErrorMessage("Invalid login credentials");
 * // → "Credenciales incorrectas. Verifica tu correo y contraseña."
 *
 * getAuthErrorMessage("some_unknown_error_xyz");
 * // → "Ocurrió un error inesperado. Inténtalo de nuevo."
 * ```
 */
export function getAuthErrorMessage(errorKey: string): string {
  // Fase 1: Exact match — O(1)
  if (errorKey in AuthErrorMap) {
    return AuthErrorMap[errorKey];
  }

  // Fase 2: Partial match — O(n) sobre las keys del diccionario
  for (const key of Object.keys(AuthErrorMap)) {
    if (errorKey.includes(key)) {
      return AuthErrorMap[key];
    }
  }

  // Fase 3: Fallback genérico
  return FALLBACK_MESSAGE;
}
