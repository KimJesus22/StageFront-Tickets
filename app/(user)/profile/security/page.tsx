"use client";

import { useState } from "react";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";

export default function SecurityPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await insforge.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Contraseña actualizada exitosamente.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("[UpdatePassword] Error:", err);
      setError(err.message || "Hubo un error al actualizar la contraseña.");
      toast.error("Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="mb-8 flex flex-col gap-1">
        <h2 className="font-headline-lg text-3xl font-bold text-white">Seguridad</h2>
        <p className="text-zinc-400">Administra la seguridad de tu cuenta.</p>
      </header>

      <section className="max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 relative overflow-hidden group">
        <h3 className="font-headline-md text-xl font-bold text-white mb-6">Cambiar Contraseña</h3>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Nueva Contraseña</label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:bg-black/40 transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Confirmar Contraseña</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:bg-black/40 transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 w-full px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </section>
    </>
  );
}
