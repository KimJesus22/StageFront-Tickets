"use client";

import { useState } from "react";
import { submitSupportTicket } from "@/lib/actions/support";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitSupportTicket(formData);

    setIsSubmitting(false);

    if (result.success) {
      setStatus({ type: "success", message: "Tu solicitud ha sido enviada con éxito. Te contactaremos pronto." });
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus({ type: "error", message: result.error || "Ocurrió un error inesperado." });
    }
  };

  return (
    <form className="flex flex-col gap-stack-sm relative z-10" onSubmit={handleSubmit}>
      {status && (
        <div className={`p-4 rounded-md font-body-md ${status.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {status.message}
        </div>
      )}

      <div className="flex flex-col gap-unit">
        <label htmlFor="nombre" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Nombre Completo</label>
        <input 
          name="nombre"
          id="nombre"
          required
          className="w-full bg-white/5 border-b border-white/10 border-t-0 border-l-0 border-r-0 py-3 text-primary font-body-md focus:ring-0 focus:border-white/50 transition-colors" 
          placeholder="Tu nombre" 
          type="text"
        />
      </div>
      <div className="flex flex-col gap-unit mt-unit">
        <label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Correo Electrónico</label>
        <input 
          name="email"
          id="email"
          required
          className="w-full bg-white/5 border-b border-white/10 border-t-0 border-l-0 border-r-0 py-3 text-primary font-body-md focus:ring-0 focus:border-white/50 transition-colors" 
          placeholder="tu@email.com" 
          type="email"
        />
      </div>
      <div className="flex flex-col gap-unit mt-unit">
        <label htmlFor="mensaje" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Mensaje</label>
        <textarea 
          name="mensaje"
          id="mensaje"
          required
          className="w-full bg-white/5 border-b border-white/10 border-t-0 border-l-0 border-r-0 py-3 text-primary font-body-md focus:ring-0 focus:border-white/50 transition-colors resize-none" 
          placeholder="Describe tu problema..." 
          rows={4}
        ></textarea>
      </div>
      <button 
        className="mt-stack-sm w-full bg-primary text-on-primary font-headline-md text-[18px] py-4 rounded-lg hover:bg-white/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
      </button>
    </form>
  );
}
