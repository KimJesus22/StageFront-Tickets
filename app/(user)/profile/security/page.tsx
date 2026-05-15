"use client";

import { useState } from "react";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";

export default function SecurityPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequestReset = async () => {
    setLoading(true);

    try {
      // Obtener el email de la sesión almacenada en la cookie
      const res = await fetch("/api/session");
      const session = await res.json();

      if (!session?.email) {
        toast.error("No se pudo obtener tu email. Inicia sesión de nuevo.");
        return;
      }

      const { error } = await insforge.auth.sendResetPasswordEmail({
        email: session.email,
      });

      if (error) {
        throw error;
      }

      setSent(true);
      toast.success("Se envió un enlace de restablecimiento a tu correo.");
    } catch (err: any) {
      console.error("[SecurityPage] Error:", err);
      toast.error(err.message || "Hubo un error. Inténtalo de nuevo.");
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
        <h3 className="font-headline-md text-xl font-bold text-white mb-4">Cambiar Contraseña</h3>
        
        {sent ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <p className="font-medium mb-1">¡Correo enviado!</p>
              <p>Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ¿No recibiste el correo? Intentar de nuevo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-400">
              Te enviaremos un enlace a tu correo electrónico para que puedas establecer una nueva contraseña de forma segura.
            </p>
            <button
              onClick={handleRequestReset}
              disabled={loading}
              className="mt-2 w-full px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar enlace de restablecimiento"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
