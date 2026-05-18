"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/services/authService";

// ============================================================================
// Tipos
// ============================================================================

interface UserSession {
  id: string;
  email: string;
  name: string;
}

interface UserDropdownProps {
  session: UserSession;
}

// ============================================================================
// UserDropdown — Client Component
// ============================================================================
// Renderiza el avatar del usuario con un dropdown glassmorphic que incluye:
//   • Mi Perfil → /portal
//   • Mis Boletos → /wallet
//   • Cerrar Sesión → authService.logout() + clear + redirect
// ============================================================================

export default function UserDropdown({ session }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Cerrar al hacer click fuera ──────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Cerrar con Escape ────────────────────────────────────────────────────
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // ── Handle Logout ────────────────────────────────────────────────────────
  // 1. Llama a authService.logout() (Insforge SDK signOut)
  // 2. Elimina la cookie de sesión vía API route
  // 3. router.push('/') para redirigir al Home
  // 4. router.refresh() para que proxy.ts detecte que la sesión terminó
  // ──────────────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. Cerrar sesión en Insforge (SDK client-side)
      await authService.logout();
    } catch (err) {
      // Si falla el SDK, seguimos limpiando la sesión local de todas formas
      console.warn("[UserDropdown] SDK signOut falló, limpiando localmente:", err);
    }

    try {
      // 2. Eliminar la cookie httpOnly del servidor
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("[UserDropdown] Error al limpiar cookie del servidor:", err);
    }

    // 3. Redirigir al Home
    router.push("/");

    // 4. Forzar re-validación del server tree para que proxy.ts
    //    detecte la sesión eliminada y proteja rutas privadas
    router.refresh();
  }, [isLoggingOut, router]);

  // ── Iniciales del avatar ─────────────────────────────────────────────────
  const initials = session.name
    ? session.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session.email[0].toUpperCase();

  return (
    <div ref={dropdownRef} className="relative">
      {/* ── Trigger ────────────────────────────────────────────────────── */}
      <button
        id="user-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 py-1 px-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar con iniciales */}
        <div className="w-8 h-8 rounded-full border border-white/10 bg-surface-container-high flex items-center justify-center text-xs font-semibold text-primary select-none">
          {initials}
        </div>

        {/* Nombre (solo desktop) */}
        <span className="font-body-md text-sm font-medium text-primary hidden md:block">
          {session.name}
        </span>

        {/* Chevron animado */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-on-surface-variant ml-1 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* ── Dropdown Container (Glassmorphism Level 2) ──────────────── */}
      <div
        className={`absolute right-0 top-full mt-2 w-56 z-50 rounded-xl overflow-hidden transform origin-top-right transition-all duration-200 ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{
          background: "rgba(24, 24, 27, 0.90)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.50)",
        }}
        role="menu"
        aria-label="Menú de usuario"
      >
        {/* ── Opciones de menú ───────────────────────────────────────── */}
        <div className="py-2 flex flex-col">
          <Link
            id="dropdown-profile"
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 font-body-md text-sm text-on-surface-variant hover:bg-white/5 hover:text-primary transition-colors"
            role="menuitem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Mi Perfil
          </Link>

          {session.email === "jesus@top.com.mx" && (
            <Link
              id="dropdown-portal"
              href="/portal"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 font-body-md text-sm text-on-surface-variant hover:bg-white/5 hover:text-primary transition-colors"
              role="menuitem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
              Portal Artista
            </Link>
          )}

          <Link
            id="dropdown-tickets"
            href="/wallet"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 font-body-md text-sm text-on-surface-variant hover:bg-white/5 hover:text-primary transition-colors"
            role="menuitem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
              <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
            </svg>
            Mis Boletos
          </Link>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="border-t border-white/10" />

        {/* ── Logout Action ──────────────────────────────────────────── */}
        <div className="py-2">
          <button
            id="dropdown-logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 font-body-md text-sm text-error hover:bg-error/10 transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            role="menuitem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isLoggingOut ? (
                <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
              ) : (
                <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>
              )}
            </svg>
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
