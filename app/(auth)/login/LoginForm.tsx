"use client";

import { useState } from "react";
import { login, signup } from "@/lib/actions/auth";

export default function LoginForm({ initialIsLogin = true }: { initialIsLogin?: boolean }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
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
    <div className="max-w-md w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      
      {/* Decoración Glassmorphism */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

      <h1 className="font-headline-lg text-3xl font-bold text-white mb-2 text-center relative z-10">
        {isLogin ? "Bienvenido de vuelta" : "Únete a StageFront"}
      </h1>
      <p className="font-body-md text-zinc-400 text-center mb-8 relative z-10">
        {isLogin ? "Ingresa para acceder a tus boletos" : "Crea tu cuenta para asegurar tu lugar en la historia"}
      </p>

      {/* Toggle Login / Register */}
      <div className="flex bg-zinc-900/50 rounded-xl p-1 mb-8 relative z-10">
        <button
          type="button"
          onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
          className={`flex-1 py-2 font-body-md text-sm font-semibold rounded-lg transition-all ${isLogin ? "bg-white/10 text-white shadow" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
          className={`flex-1 py-2 font-body-md text-sm font-semibold rounded-lg transition-all ${!isLogin ? "bg-white/10 text-white shadow" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Crear Cuenta
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-body-md text-sm mb-6 relative z-10 text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl font-body-md text-sm mb-6 relative z-10 text-center">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        {!isLogin && (
          <div>
            <label className="block text-sm font-body-md text-zinc-400 mb-2">Nombre completo</label>
            <input 
              type="text" 
              name="name" 
              required={!isLogin}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Tu nombre"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-body-md text-zinc-400 mb-2">Correo electrónico</label>
          <input 
            type="email" 
            name="email" 
            required
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder="correo@ejemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-body-md text-zinc-400 mb-2">Contraseña</label>
          <input 
            type="password" 
            name="password" 
            required
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-body-md font-bold hover:bg-white/90 hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)] mt-4 flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            isLogin ? "Entrar" : "Registrarse"
          )}
        </button>
      </form>
    </div>
  );
}
