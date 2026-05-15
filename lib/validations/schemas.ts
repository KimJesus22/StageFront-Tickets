import { z } from "zod";

/**
 * ESQUEMAS DE VALIDACIÓN ESTRICTA (ZERO-TRUST)
 *
 * Implementación (Fail-Fast) en Server Actions:
 * Para usar estos esquemas en un Server Action, debes utilizar el método .safeParse().
 * Esto evita que Zod lance una excepción que pueda derribar el servidor y en su lugar
 * devuelve un objeto con la propiedad `success` que puedes evaluar.
 *
 * Ejemplo:
 * ```ts
 * "use server";
 * export async function handleAction(formData: FormData) {
 *   const result = emailSchema.safeParse(formData.get("email"));
 *   
 *   if (!result.success) {
 *     // Fail-fast: Retorna un error inmediatamente (ej. Error 400 simulado) sin
 *     // conectarse a la base de datos (Insforge).
 *     return { error: result.error.errors[0].message };
 *   }
 *   
 *   const cleanEmail = result.data; // Valor sanitizado y seguro
 *   // ... lógica de negocio ...
 * }
 * ```
 */

export const nameSchema = z
  .string({ required_error: "El nombre es obligatorio" })
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(50, "El nombre no puede exceder los 50 caracteres")
  .regex(/^[A-Za-z\s]+$/, "El nombre solo puede contener letras y espacios")
  .trim();

export const emailSchema = z
  .string({ required_error: "El correo electrónico es obligatorio" })
  .email("Formato de correo electrónico inválido")
  .trim()
  .toLowerCase();

export const searchSchema = z
  .string()
  .max(100, "La búsqueda no puede exceder los 100 caracteres")
  .regex(/^[^<>]*$/, "Caracteres no permitidos (XSS detectado)") // Bloquea tags HTML básicos < >
  .optional();

export const uuidSchema = z
  .string({ required_error: "El ID es obligatorio" })
  .uuid("Formato de identificador (UUID) inválido");

export const paginationSchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "La página debe ser un número" })
    .int("La página debe ser un número entero")
    .min(1, "La página debe ser mayor a 0")
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: "El límite debe ser un número" })
    .int("El límite debe ser un número entero")
    .min(1, "El límite mínimo es 1")
    .max(100, "El límite máximo es 100")
    .default(20),
});

export const otpSchema = z
  .string({ required_error: "El código OTP es obligatorio" })
  .regex(/^\d{6}$/, "El código OTP debe tener exactamente 6 dígitos numéricos");
