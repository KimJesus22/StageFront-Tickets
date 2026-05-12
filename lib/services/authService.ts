import { insforge } from "@/lib/insforge";

// ============================================================================
// 🔐 AUTH SERVICE — Patrón Singleton (OOP)
// ============================================================================
//
// Encapsula toda la lógica de autenticación de Insforge en una clase
// reutilizable. Esto cumple con:
//
//   • Encapsulación: La vista de React no conoce los detalles del SDK.
//   • Single Responsibility: Solo maneja autenticación.
//   • Singleton: Una única instancia exportada para toda la app.
//
// Uso:
//   import { authService } from "@/lib/services/authService";
//   await authService.logout();
//
// ============================================================================

type InsforgeClient = typeof insforge;

class AuthService {
  private static instance: AuthService;
  private client: InsforgeClient;

  private constructor(client: InsforgeClient) {
    this.client = client;
  }

  /**
   * Obtiene la instancia Singleton del AuthService.
   * Si no existe, la crea con el cliente de Insforge.
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(insforge);
    }
    return AuthService.instance;
  }

  /**
   * Cierra la sesión del usuario actual en Insforge.
   * Limpia los tokens y la sesión del lado del SDK.
   *
   * @throws Error si la operación de signOut falla
   */
  async logout(): Promise<void> {
    const { error } = await this.client.auth.signOut();

    if (error) {
      console.error("[AuthService] Error al cerrar sesión:", error);
      throw new Error(error.message || "Error al cerrar sesión");
    }
  }

  /**
   * Obtiene el usuario actualmente autenticado.
   * Útil para validaciones del lado del cliente.
   */
  async getCurrentUser() {
    const { data, error } = await this.client.auth.getCurrentUser();

    if (error) {
      console.error("[AuthService] Error al obtener usuario:", error);
      return null;
    }

    return data?.user ?? null;
  }
}

/**
 * Instancia Singleton del AuthService.
 *
 * @example
 * ```ts
 * import { authService } from "@/lib/services/authService";
 * await authService.logout();
 * ```
 */
export const authService = AuthService.getInstance();
