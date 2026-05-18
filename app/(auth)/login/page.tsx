"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login, signup } from "@/lib/actions/auth";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ── Defensa de campos vacíos (Coste 0 — no llega al servidor) ───────
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = (formData.get("password") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();

    if (!email || !password) {
      setError("Completa todos los campos.");
      return;
    }

    if (!isLogin && !name) {
      setError("Completa todos los campos.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData);
        if (result?.error) setError(result.error);
      } else {
        const result = await signup(formData);
        if (result?.error) setError(result.error);
        if (result?.success) setSuccess(result.success);
      }
    } catch (err) {
      setError("Ha ocurrido un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex antialiased selection:bg-primary selection:text-surface w-full">
      {/* Left Form Section (40%) */}
      <main className="w-full lg:w-[40%] min-h-screen flex flex-col relative z-20 bg-white/[0.03] backdrop-blur-[20px] border-r border-white/5 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        {/* Brand Header */}
        <header className="p-8 lg:p-12 w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
              <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
            </svg>
            <span className="font-headline-md text-headline-md tracking-tighter">
              StageFront
            </span>
          </Link>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 pb-12 w-full max-w-md mx-auto">
          <div className="mb-stack-lg">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              {isLogin ? "Bienvenido de vuelta" : "Únete a StageFront"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isLogin
                ? "Acceso exclusivo a la escena."
                : "Crea tu cuenta para asegurar tu lugar."}
            </p>
          </div>

          {/* Auth Toggle */}
          <div className="flex border-b border-outline-variant/30 mb-stack-md">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 pb-3 text-center border-b-2 font-label-caps text-label-caps tracking-widest uppercase transition-colors ${
                isLogin
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 pb-3 text-center border-b-2 font-label-caps text-label-caps tracking-widest uppercase transition-colors ${
                !isLogin
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-body-md text-sm mb-6 relative z-10 flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl font-body-md text-sm mb-6 relative z-10 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input (Only for Register) */}
            {!isLogin && (
              <div>
                <label
                  className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-3 ml-1"
                  htmlFor="name"
                >
                  Nombre
                </label>
                <div className="relative group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    className="w-full bg-white/[0.02] border border-white/10 rounded-DEFAULT py-4 pl-12 pr-4 text-primary font-body-md text-body-md placeholder-on-surface-variant/50 focus:outline-none focus:bg-white/5 focus:border-white/30 focus:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300"
                    id="name"
                    name="name"
                    placeholder="Tu nombre completo"
                    type="text"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label
                className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-3 ml-1"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  className="w-full bg-white/[0.02] border border-white/10 rounded-DEFAULT py-4 pl-12 pr-4 text-primary font-body-md text-body-md placeholder-on-surface-variant/50 focus:outline-none focus:bg-white/5 focus:border-white/30 focus:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300"
                  id="email"
                  name="email"
                  placeholder="tu@email.com"
                  type="email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-3 ml-1 mr-1">
                <label
                  className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                {isLogin && (
                  <Link
                    href="#"
                    className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  className="w-full bg-white/[0.02] border border-white/10 rounded-DEFAULT py-4 pl-12 pr-12 text-primary font-body-md text-body-md placeholder-on-surface-variant/50 focus:outline-none focus:bg-white/5 focus:border-white/30 focus:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoading}
              className="w-full bg-primary text-surface font-label-caps text-label-caps uppercase tracking-widest py-4 rounded-DEFAULT hover:bg-tertiary-container transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mt-stack-md flex justify-center items-center gap-2 disabled:opacity-70"
              type="submit"
            >
              {isLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Registrarse"
              )}
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Right Visual Section (60%) - Hidden on mobile */}
      <aside className="hidden lg:block w-[60%] h-screen relative bg-[#0e0e0e] overflow-hidden">
        {/* Base ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-variant/20 via-background to-background z-0" />

        {/* Asymmetric Collage Grid */}
        <div className="relative z-10 w-full h-full p-6 grid grid-cols-12 grid-rows-12 gap-4">
          {/* Large Image (BTS / Purple) */}
          <div className="col-span-7 row-span-12 relative rounded-xl overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-purple-900/20 mix-blend-overlay z-10 group-hover:bg-purple-900/10 transition-all duration-700" />
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7p0wNCLdn_SCCSK4ZvnH17ywsdNbg1_brl7VYydWQ46W_CBKaYnJg7yjZXWnT626MHJRTO5pvbClcJpKtY99zzBUicrxJTa_IeJnwzk-8iMozgVyuwoQAw7P2G9Sg1uypX54WE4QgI6rESlVb54tBelk7ctxAgd6LJRDZtCcVTv8WZ0vC_wq3OCYaVshhjizKFz0SSItpI9NXlDeHPIlQyDhnXr9OYxoCmnUfN6mR4LQSb73W5H3FiBZ0nhCdPvFW88TWLiS-1sQ"
              alt="BTS concert scene"
              fill
              priority
              sizes="(max-width: 1024px) 0vw, 35vw"
              className="object-cover filter grayscale-[20%] contrast-125 group-hover:scale-105 transition-transform duration-1000"
              unoptimized
            />
            <div className="absolute bottom-8 left-8 z-20">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/40 backdrop-blur-md border border-purple-500/30 font-label-caps text-[10px] text-white uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.4)] mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Live
              </span>
              <h2 className="font-display-xl text-[48px] text-white leading-none tracking-tighter">
                SEOUL
                <br />
                NIGHTS
              </h2>
            </div>
          </div>

          {/* Top Right Image (Blackpink / Pink) */}
          <div className="col-span-5 row-span-7 relative rounded-xl overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-pink-900/20 mix-blend-overlay z-10 group-hover:bg-pink-900/10 transition-all duration-700" />
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDL6QRflK-_QTZSHkulRXxK0c9ZWTJ2YWRnQ7Nso-Jk8wq7Q4IdeGJeF8GPNYXp8fSaCLMcrLW8_X-dDw0UDCw1cxAT3nYOByJbf3Fr7yp1yPQc6vWLCgzGTsqcah1aenHTB1r26oZGWy2oFGHdej8CR-u3dI9nO2VZW6npH8tvldt-bHppQOzGEJx8xFDGzAs85x-0sjt-ba5_2_qtEcODneKxJiFHMVrJZDeAjCGbMi22fQMpwFxfyHX_uwuLpFp0OTCy5K6ES0E"
              alt="Blackpink concert scene"
              fill
              sizes="(max-width: 1024px) 0vw, 25vw"
              className="object-cover filter grayscale-[30%] contrast-125 group-hover:scale-105 transition-transform duration-1000"
              unoptimized
            />
          </div>

          {/* Bottom Right Image (Alternative / Cyan & Yellow) */}
          <div className="col-span-5 row-span-5 relative rounded-xl overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/30 to-yellow-900/30 mix-blend-overlay z-10 group-hover:opacity-50 transition-all duration-700" />
            <div className="absolute inset-0 bg-background/40 z-0" />
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO6lar2BZRz1oqN6X6YsKBz1gu8LLiRBDUZoS31PcJLfL5XIkMK7plzDrOrWFpycgTzBmQbrHh3C5u2IIVg4d-d5LOEsNvgNunWok-cjyME6MEwIxl3nwd7pQJJM0iepVyOSkekfU0zl01t4nmsr0TBDI5Yb-cAVObP9PvdOL9eDJJ0WqyCXg5CmMvFKdfHnbGjg_imRvk52vzWqcXonoU9zsTcbbCU1jp5LvQbrH_xXzvhCD7z6rfpzGBV4ErLmrz8CCM3k5-JuM"
              alt="Alternative concert scene"
              fill
              sizes="(max-width: 1024px) 0vw, 25vw"
              className="object-cover filter grayscale contrast-150 group-hover:scale-105 transition-transform duration-1000"
              unoptimized
            />
            {/* Overlay abstract elements */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <div className="w-8 h-1 bg-cyan-500/80 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <div className="w-4 h-1 bg-yellow-500/80 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
