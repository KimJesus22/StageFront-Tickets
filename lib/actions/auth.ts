"use server";

import { insforge } from "@/lib/insforge";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await insforge.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    let errorMessage = error?.message || "Error al iniciar sesión";
    if (errorMessage.includes("Invalid login credentials")) {
      errorMessage = "Correo o contraseña incorrectos.";
    } else if (errorMessage.includes("Email not confirmed")) {
      errorMessage = "Debes confirmar tu correo electrónico antes de iniciar sesión.";
    }
    return { error: errorMessage };
  }

  // Guardar la sesión en cookies para el middleware y server actions
  const cookieStore = await cookies();
  cookieStore.set("insforge_session", JSON.stringify({
    id: data.user.id,
    email: data.user.email,
    name: data.user.profile?.name || email.split("@")[0],
    accessToken: data.accessToken,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  redirect("/wallet");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name,
  });

  if (error) {
    let errorMessage = error.message;
    if (errorMessage.includes("User already registered")) {
      errorMessage = "Este correo ya está registrado.";
    } else if (errorMessage.includes("Password should be at least")) {
      errorMessage = "La contraseña debe tener al menos 6 caracteres.";
    }
    return { error: errorMessage };
  }

  // Si requiere verificación de email, no hay accessToken
  if (data?.requireEmailVerification) {
    return { success: "Cuenta creada. Por favor, verifica tu correo electrónico." };
  }

  if (data?.user) {
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
}

export async function logout() {
  await insforge.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("insforge_session");
  redirect("/");
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
