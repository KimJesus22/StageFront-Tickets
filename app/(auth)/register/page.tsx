"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
        setTimeout(() => {
          router.push("/wallet");
        }, 2000);
      }
    } catch (err) {
      // Next.js redirect() throws an error, so we ignore it or handle it
      if (err instanceof Error && err.message === "NEXT_REDIRECT") {
        throw err;
      }
      setError("Ha ocurrido un error inesperado al crear tu cuenta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Left Side: Form Panel */}
      <main className="w-full md:w-[40%] min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop relative z-10">
        {/* Glassmorphism Container */}
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="mb-stack-lg text-center">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-4xl text-primary mb-stack-sm"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              confirmation_number
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-sm">
              Únete a StageFront
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Crea tu cuenta para asegurar tu lugar en la historia
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-surface-variant mb-stack-lg">
            <Link
              href="/login"
              className="flex-1 pb-4 text-center font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              Iniciar Sesión
            </Link>
            <button className="flex-1 pb-4 font-body-md text-body-md text-primary border-b-2 border-primary">
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-body-md text-sm mb-6 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl font-body-md text-sm mb-6 text-center">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-stack-md">
            {/* Full Name Input */}
            <div className="relative group">
              <label className="sr-only" htmlFor="fullName">
                Nombre completo
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <input
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-b border-surface-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:bg-white/5 transition-all duration-300 rounded-t-DEFAULT placeholder:text-on-surface-variant/50"
                id="fullName"
                name="name"
                placeholder="Nombre completo"
                type="text"
                required
              />
            </div>

            {/* Email Input */}
            <div className="relative group">
              <label className="sr-only" htmlFor="email">
                Correo electrónico
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">mail</span>
              </div>
              <input
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-b border-surface-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:bg-white/5 transition-all duration-300 rounded-t-DEFAULT placeholder:text-on-surface-variant/50"
                id="email"
                name="email"
                placeholder="Correo electrónico"
                type="email"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <label className="sr-only" htmlFor="password">
                Contraseña
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">lock</span>
              </div>
              <input
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-b border-surface-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:bg-white/5 transition-all duration-300 rounded-t-DEFAULT placeholder:text-on-surface-variant/50"
                id="password"
                name="password"
                placeholder="Contraseña"
                type="password"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoading}
              className="w-full mt-stack-lg bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-DEFAULT uppercase tracking-widest hover:bg-primary-fixed transition-colors duration-300 flex justify-center items-center gap-2 disabled:opacity-70"
              type="submit"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">
                  progress_activity
                </span>
              ) : (
                "Registrarse"
              )}
            </button>
          </form>

          <div className="mt-stack-md text-center">
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Al registrarte, aceptas nuestros{" "}
              <Link className="text-primary hover:underline" href="#">
                Términos
              </Link>{" "}
              y{" "}
              <Link className="text-primary hover:underline" href="#">
                Privacidad
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Right Side: Artistic Collage */}
      <aside className="hidden md:block md:w-[60%] h-screen relative overflow-hidden bg-surface-container-lowest">
        {/* Collage Container */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-2">
          {/* Quadrant 1: BTS Theme */}
          <div className="relative rounded-lg overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-transparent z-10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-500" />
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkWBIm_k7MhB_B0_Qh0HXqVZTGWiwpS6aBFQIafUvYFStYh6iuPUQYx1GD6V-MQJGalYvV0MReNEmToApJsjzULXS6DEZ18tKEehcqSYMJuIIUzBiPob8KeE976IYzkUSWrjsBk6zGUtmhQProRjnMuKIRurv1aPuinQBf-kQEWXW2lAi5-CtF_FvDNNC2BvNupNzAPte6jcNVlyvUi5EDN2Omo3HwtlmrsWr8jlYaEvqaOcJq_UvYfivACTNVCpQX-X8enR9t74o"
              alt="BTS Concert Vibe"
              fill
              sizes="(max-width: 1024px) 0vw, 30vw"
              className="object-cover object-center grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute bottom-4 left-4 z-20">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 backdrop-blur-md text-white font-label-caps text-label-caps shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                K-POP
              </span>
            </div>
          </div>

          {/* Quadrant 2: TXT Theme */}
          <div className="relative rounded-lg overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-bl from-cyan-900/40 to-transparent z-10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-500" />
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIZ2jazP0nGB_cMYDee0uP8Be52yr0FNCP4Nx0kVnej7X_jJcC_9J5jQFsdLJjJVG5p6q2t40P3B4GU7IMIsHMW2jKgAOs2U_VMOaWzB54snBv5pbhpd70ZrcsQ1_hrpAg-iJN4POClY_rOxJrqfLlX9OJHjPjmSRCY8arHwPbWBgGEM4aBZKUD5hQZwFPBk_OvhUxjoPrwjE2LQtvE1qFnLfJh9Xr_q4azzYO4Gx6WmlXfkrMXM6DFSym0m2CzrtnBDWXqo2UBnk"
              alt="TXT Concert Vibe"
              fill
              sizes="(max-width: 1024px) 0vw, 30vw"
              className="object-cover object-center grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute bottom-4 right-4 z-20">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 backdrop-blur-md text-white font-label-caps text-label-caps shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                FUTURE
              </span>
            </div>
          </div>

          {/* Quadrant 3: Blackpink Theme */}
          <div className="relative rounded-lg overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-900/40 to-transparent z-10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-500" />
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH_tvjkJxDpIi6H8bQf-eUko4eEo4AqArAyo0JgtIO0W11QkgvLLbdOVPQQ1Cb2-O9ReNKFdq3QImtKHShInD6GEKWjc_X9NCcWwNfVrEegYyjPL37_vrdyZytGaN3Y8BgYhfJe5T3TjeAczqzOVLozeQ9wrbKz_YlBaMR0snkF0XJUCGCuER33qb3DRzM0CoduPYc4f11us0_W89CpQ5LsE6BDqdXJ-QY86ENBIllWSNJcf6IsY6gSKqsa0QVAvGEgz5Rk9Nz6-M"
              alt="Blackpink Concert Vibe"
              fill
              sizes="(max-width: 1024px) 0vw, 30vw"
              className="object-cover object-center grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute top-4 left-4 z-20">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/50 backdrop-blur-md text-white font-label-caps text-label-caps shadow-[0_0_12px_rgba(236,72,153,0.4)]">
                ICON
              </span>
            </div>
          </div>

          {/* Quadrant 4: Twenty One Pilots Theme */}
          <div className="relative rounded-lg overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tl from-yellow-900/40 to-transparent z-10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-500" />
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmAiweG4K2B6m8XE5O0_sjR0n3yQmhuQjgD-dSjZjPKrVilJ4Ut0CJCjtfCvMIZRoQjYhm7jMK1Kx6WyouirCqbd3k3ta4IjWxx3BYvU_6Sxm1_uQzeJPnzBzs4C4I8MJXA6B-G5CKyqKsV8GT4r85o7qRhuJ28gTeTy8FVln6xrg99_ULlI3cVsOBIgGe4VXheRBhpIXMWYiWITCNPVCwBpSv7F5eIil3EfkbX2nFLU0BmdcJzKy1P8qA_FCiELXhB8JhSOn3ZcY"
              alt="Twenty One Pilots Concert Vibe"
              fill
              sizes="(max-width: 1024px) 0vw, 30vw"
              className="object-cover object-center grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute top-4 right-4 z-20">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 backdrop-blur-md text-white font-label-caps text-label-caps shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                ALT
              </span>
            </div>
          </div>
        </div>

        {/* Overlay Gradient for Blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-30 pointer-events-none" />
      </aside>
    </div>
  );
}
