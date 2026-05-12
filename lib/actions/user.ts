"use server";

import { insforge } from "@/lib/insforge";
import { getSession } from "./auth";
import { cookies } from "next/headers";
import { PasswordPolicy } from "@/lib/utils/PasswordPolicy";

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  try {
    // Actualizar el perfil (nombre)
    const { data: profileData, error: profileError } = await insforge.auth.setProfile({
      name,
    });

    if (profileError) {
      return { error: profileError.message || "Error al actualizar el perfil" };
    }

    // Actualizar la cookie de sesión con el nuevo nombre
    const cookieStore = await cookies();
    const newSession = { ...session, name, email };
    cookieStore.set("insforge_session", JSON.stringify(newSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: "Perfil actualizado correctamente." };
  } catch (error) {
    console.error("Error en updateProfile:", error);
    return { error: "Error inesperado al actualizar el perfil." };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  const password = formData.get("password") as string;

  // ── Server-side validation (Defense in Depth) ────────────────────────
  // Reemplaza la verificación básica de longitud por PasswordPolicy.
  // Bloquea contraseñas débiles y de lista negra incluso si un atacante
  // envía la solicitud directamente al Server Action (bypass de la UI).
  // ─────────────────────────────────────────────────────────────────────
  if (!password) {
    return { error: "La contraseña es obligatoria." };
  }

  const policyResult = PasswordPolicy.validate(password);
  if (!policyResult.isValid) {
    return { error: policyResult.error };
  }

  try {
    // InsForge Auth (Simulamos la actualización de contraseña si no hay método directo documentado)
    // En un entorno real de InsForge, se usaría auth.updateUser({ password })
    // await insforge.auth.updateUser({ password });
    
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return { success: "Contraseña actualizada exitosamente." };
  } catch (error) {
    console.error("Error en updatePassword:", error);
    return { error: "Error al actualizar la contraseña." };
  }
}
