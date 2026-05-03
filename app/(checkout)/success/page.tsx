import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24 pb-12 min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-surface-container-low border border-white/5 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          
          {/* Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
            <span className="material-symbols-outlined text-5xl text-emerald-400">
              check_circle
            </span>
          </div>

          <h1 className="font-headline-lg text-4xl font-bold text-white mb-4 relative z-10">
            ¡Pago Exitoso!
          </h1>
          
          <p className="font-body-md text-zinc-400 text-lg mb-10 relative z-10">
            Tu lugar en la historia está asegurado. Hemos enviado los detalles de tus boletos y el recibo de compra a tu correo electrónico.
          </p>

          <Link
            href="/"
            className="inline-block px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-body-md font-semibold transition-all duration-300 hover:scale-105 relative z-10"
          >
            Volver al Inicio
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
