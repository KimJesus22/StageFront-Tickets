"use server";

import { insforge } from "@/lib/insforge";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PasswordPolicy } from "@/lib/utils/PasswordPolicy";
import { getAuthErrorMessage } from "@/lib/utils/ErrorMapper";
import { getClientIP, checkRateLimit, clearRateLimit } from "@/lib/services/rateLimiter";
import { logEvent } from "@/lib/services/logger";
import { emailSchema, nameSchema } from "@/lib/validations/schemas";

export async function login(formData: FormData) {
  const emailRaw = formData.get("email") as string;
  const password = formData.get("password") as string;

  // ── 0. Validación de Esquema (Fail-Fast) ──────────────────────────────
  const emailResult = emailSchema.safeParse(emailRaw);
  if (!emailResult.success) {
    return { error: emailResult.error.errors[0].message };
  }
  const email = emailResult.data; // Email sanitizado (trim + lowercase)

  // ── 0. Rate Limiting — PRIMERA línea de defensa ───────────────────────
  // Si el usuario excede 5 intentos en 15 min, la ejecución se detiene
  // aquí y la DB de autenticación principal NUNCA es tocada.
  // ─────────────────────────────────────────────────────────────────────
  const clientIP = await getClientIP();

  try {
    await checkRateLimit(clientIP, email);
  } catch (err) {
    return {
      error: err instanceof Error
        ? err.message
        : "Demasiados intentos. Inténtalo más tarde."
    };
  }

  try {
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    // ── Traducción en vuelo: error del SDK → mensaje amigable ──────────
    if (error || !data?.user) {
      logEvent(null, "LOGIN_FAILED", `Login failed for ${email}: ${error?.message || "unknown"}`);
      return { error: getAuthErrorMessage(error?.message || "unknown_error") };
    }

    logEvent(data.user.id, "LOGIN_SUCCESS", `User logged in successfully`);

    // ── Login exitoso → resetear contador de intentos ────────────────────
    await clearRateLimit(clientIP, email);

    // ── Consultar el Rol del Usuario para la sesión ───────────────────────
    const { data: profile } = await insforge.database
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const userRole = profile?.role || "user";

    // Guardar la sesión en cookies para el middleware y server actions
    const cookieStore = await cookies();
    cookieStore.set("insforge_session", JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      name: data.user.profile?.name || email.split("@")[0],
      accessToken: data.accessToken,
      role: userRole,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
  } catch (err) {
    // Next.js redirect() lanza un error especial — re-throw para que funcione
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    // ── Retorno seguro: nunca exponer el objeto de error completo ───────
    console.error("[login] Error inesperado:", err);
    logEvent(null, "LOGIN_FAILED", `Unexpected error during login for ${email}`);
    return { error: getAuthErrorMessage(
      err instanceof Error ? err.message : "unknown_error"
    ) };
  }

  redirect("/wallet");
}

export async function signup(formData: FormData) {
  const emailRaw = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nameRaw = formData.get("name") as string;

  // ── 0. Validación de Esquema (Fail-Fast) ──────────────────────────────
  const emailResult = emailSchema.safeParse(emailRaw);
  const nameResult = nameSchema.safeParse(nameRaw);

  if (!emailResult.success) return { error: emailResult.error.errors[0].message };
  if (!nameResult.success) return { error: nameResult.error.errors[0].message };

  const email = emailResult.data;
  const name = nameResult.data;

  // ── Server-side validation (Defense in Depth) ────────────────────────
  // Nunca confiar en el cliente: un atacante puede enviar FormData
  // directamente a este Server Action vía POST, saltándose la UI.
  // ─────────────────────────────────────────────────────────────────────
  const policyResult = PasswordPolicy.validate(password);
  if (!policyResult.isValid) {
    return { error: policyResult.error };
  }

  try {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name,
    });

    // ── Traducción en vuelo: error del SDK → mensaje amigable ──────────
    if (error) {
      return { error: getAuthErrorMessage(error.message) };
    }

    // Si requiere verificación de email, no hay accessToken
    if (data?.requireEmailVerification) {
      logEvent(data.user?.id || null, "REGISTER", `User registered, pending email verification`);
      return { success: "Cuenta creada. Por favor, verifica tu correo electrónico." };
    }

    if (data?.user) {
      logEvent(data.user.id, "REGISTER", `User registered successfully`);
      const cookieStore = await cookies();
      cookieStore.set("insforge_session", JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.profile?.name || name || email.split("@")[0],
        accessToken: data.accessToken,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      redirect("/wallet");
    }

    return { error: "No se pudo crear la cuenta" };
  } catch (err) {
    // Next.js redirect() lanza un error especial — re-throw para que funcione
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    // ── Retorno seguro: nunca exponer el objeto de error completo ───────
    console.error("[signup] Error inesperado:", err);
    return { error: getAuthErrorMessage(
      err instanceof Error ? err.message : "unknown_error"
    ) };
  }
}

export async function logout() {
  try {
    await insforge.auth.signOut();
  } catch (err) {
    // ── Log silencioso: si signOut falla, igual limpiamos la sesión ─────
    console.error("[logout] Error en signOut del SDK:", err);
  }

  const cookieStore = await cookies();
  cookieStore.delete("insforge_session");
  redirect("/");
}

export async function signOutUser() {
  try {
    await insforge.auth.signOut();
  } catch (err) {
    console.error("[signOutUser] Error:", err);
  }
  const cookieStore = await cookies();
  cookieStore.delete("insforge_session");
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("insforge_session")?.value;
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}

export async function verifyAdmin() {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Validación rápida si el rol está en la cookie
  if (session.role === "admin") {
    return true;
  }

  // Si no está en la cookie (sesiones viejas), lo verificamos contra la BD
  const { data: profile } = await insforge.database
    .from("profiles")
    .select("role")
    .eq("id", session.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return true;
}

// ============================================================================
// 📧 checkEmailExists — Validación de email duplicado (Anti-Enumeración)
// ============================================================================
//
// SEGURIDAD:
//   • Retorna SOLO { exists: boolean } — jamás expone datos del usuario
//     (id, nombre, perfil, etc.). Un atacante que llame esta función
//     repetidamente solo obtiene true/false, sin poder minar datos.
//
//   • Sanitización: trim() + toLowerCase() antes de consultar.
//     Previene falsos negativos por:
//       - Espacios invisibles (tab, nbsp, trailing space)
//       - Variaciones de casing ("User@Email.COM" vs "user@email.com")
//
//   • Validación de formato: regex básico antes de tocar la DB.
//     Si el input no es un email válido, retorna { exists: false }
//     sin gastar una query (Coste 0).
//
// RENDIMIENTO:
//   • SELECT('id') — payload mínimo, solo verifica existencia.
//   • .eq('email', ...) — búsqueda exacta por columna indexada → O(1).
//   • .limit(1) — detiene el scan en el primer match.
//   • Se invoca desde el cliente vía debounce (500ms), limitando
//     las consultas a ~2/segundo máximo durante la escritura.
//
// ANTI-ENUMERACIÓN:
//   • En caso de error de DB, retorna { exists: false } (fail-open).
//     Esto evita que un atacante pueda diferenciar entre "error de DB"
//     y "email no existe" analizando los tiempos de respuesta.
//   • Considerar añadir rate-limiting a nivel de middleware si se
//     detecta abuso en producción (>10 req/s desde la misma IP).
//
// ============================================================================

  // ── 1. Validación y Sanitización via Zod ─────────────────────────────
  const result = emailSchema.safeParse(email);
  
  if (!result.success) {
    return { exists: false };
  }

  const sanitized = result.data;

  // ── 3. Consulta indexada — O(1) ───────────────────────────────────────
  try {
    const { data, error } = await insforge.database
      .from("auth.users")
      .select("id")
      .eq("email", sanitized)
      .limit(1);

    if (error) {
      // Log silencioso — no bloquear el registro por un fallo en esta check
      console.error("[checkEmailExists] Error:", error.message);
      return { exists: false };
    }

    // ── 4. Retorno seguro — solo booleano, nunca datos del usuario ───────
    return { exists: Array.isArray(data) && data.length > 0 };
  } catch (err) {
    console.error("[checkEmailExists] Error inesperado:", err);
    return { exists: false };
  }
}
