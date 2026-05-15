import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada | StageFront",
};

/**
 * UTILIDAD DE RECORDATORIO (Corrección del Logout):
 * 
 * En Next.js App Router, el 'Logout' siempre debe manejarse con un manejador de eventos
 * en un Client Component (ej. onClick={handleLogout}) o llamando a una Server Action
 * que ejecute `insforge.auth.signOut()` y realice el redireccionamiento, 
 * en lugar de enlazar directamente con una etiqueta <a> o <Link> hacia 
 * una ruta "/logout" inexistente. 
 *
 * Ejemplo de implementación correcta:
 * 
 * const handleLogout = async () => {
 *   await insforge.auth.signOut();
 *   router.push('/login');
 * };
 */

export default function NotFound() {
  return (
    <main className="flex-grow flex items-center justify-center relative w-full px-4 md:px-12 min-h-[calc(100vh-80px)]">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="text-[30vw] font-display-xl text-6xl md:text-[240px] font-bold text-emerald-500/5 select-none leading-none tracking-tighter blur-[4px]">
          404
        </div>
        {/* Glitch / Neon Blur overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-emerald-900/10 blur-[120px] mix-blend-screen"></div>
      </div>
      
      {/* Content Canvas */}
      <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center gap-12 p-8 md:p-12 rounded-2xl bg-zinc-900/30 backdrop-blur-xl border border-white/10">
        <div className="flex flex-col gap-4">
          <h1 className="font-display-xl text-4xl md:text-6xl text-white mb-2 font-bold tracking-tighter">
            Te perdiste en el backstage.
          </h1>
          <p className="font-body-lg text-lg text-zinc-400 max-w-xl mx-auto">
            La página o el evento que buscas no existe, fue movido o el enlace está roto.
          </p>
        </div>
        
        <div className="mt-8">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-headline-md text-lg font-medium hover:bg-zinc-200 transition-colors duration-300"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            Volver a la Cartelera
          </Link>
        </div>
        
        <div className="mt-12">
          <p className="font-label-caps text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            Error Code: 404 - Area Restricted
          </p>
        </div>
      </div>
    </main>
  );
}
