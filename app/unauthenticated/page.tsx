import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso Restringido | StageFront",
};

export default function UnauthenticatedPage() {
  return (
    <main className="relative z-10 w-full max-w-[600px] mx-auto px-4 md:px-0 flex flex-col items-center text-center mt-32 mb-32">
      {/* Resplandor Ambiental */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-full bg-error/5 blur-[120px]"></div>
      </div>

      {/* Contenedor de Seguridad (Glassmorphism) */}
      <div className="w-full bg-surface-container/30 backdrop-blur-[40px] border border-white/10 rounded-xl p-8 md:p-12 flex flex-col items-center shadow-2xl relative overflow-hidden">
        {/* Resplandor interno sutil */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/30 to-transparent"></div>
        
        {/* Ícono Principal */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 bg-error/10 rounded-full blur-xl animate-pulse"></div>
          <span className="material-symbols-outlined text-[80px] text-error relative z-10 drop-shadow-[0_0_15px_rgba(255,180,171,0.5)]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
            lock
          </span>
        </div>

        {/* Tipografía Principal */}
        <h1 className="font-display-xl text-display-xl text-tertiary mb-stack-sm tracking-tight text-4xl font-bold">
          Acceso Restringido
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[420px] mx-auto mb-8 leading-relaxed mt-4">
          No tienes las credenciales o el nivel de autorización necesario para acceder a esta zona de la plataforma.
        </p>

        {/* Acciones */}
        <div className="w-full flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary text-on-primary font-label-caps text-label-caps hover:bg-white/90 transition-colors duration-300 uppercase text-sm font-semibold text-black"
          >
            Volver al Inicio
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-transparent border border-white/20 text-tertiary font-label-caps text-label-caps hover:bg-white/5 hover:border-white/40 backdrop-blur-[20px] transition-all duration-300 uppercase text-sm font-semibold text-white"
          >
            Cambiar de Cuenta
          </Link>
        </div>

        {/* Información Meta (Código de Estado) */}
        <div className="mt-12 pt-6 border-t border-white/10 w-full flex justify-between items-center text-on-surface-variant/50">
          <span className="font-label-caps text-label-caps uppercase text-xs font-semibold">Error 403</span>
          <span className="font-label-caps text-label-caps uppercase flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-error block animate-pulse"></span>
            Security Protocol Active
          </span>
        </div>
      </div>
    </main>
  );
}
