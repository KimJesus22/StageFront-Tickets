import Link from "next/link";

export const metadata = {
  title: "Centro de Seguridad - StageFront",
};

export default function SecurityPage() {
  return (
    <main className="flex-grow flex flex-col justify-center items-center px-6 pt-32 pb-20">
      <div className="w-full max-w-4xl">
        {/* Glassmorphism Main Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
          {/* Subtle internal glow effect */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-[100px] pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
          {/* Header */}
          <header className="mb-8 relative z-10">
            <h1 className="font-display-xl text-display-xl text-primary mb-4 text-4xl md:text-[64px]">Centro de Seguridad</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Última actualización: Mayo 2026</p>
            <div className="h-px w-full bg-white/10 mt-8"></div>
          </header>
          {/* Content Sections */}
          <div className="space-y-12 relative z-10">
            {/* Section 1 */}
            <section>
              <h2 className="font-headline-md text-headline-md text-primary mb-4">Compromiso de Seguridad</h2>
              <p className="font-body-lg text-body-lg text-zinc-300">
                En StageFront, la integridad de su experiencia de acceso es nuestra máxima prioridad. Empleamos protocolos de encriptación de grado militar y arquitecturas de datos descentralizadas para asegurar que cada transacción e interacción dentro de nuestro ecosistema permanezca impenetrable. Su información personal y financiera está blindada tras múltiples capas de autenticación, garantizando un entorno de confianza absoluta.
              </p>
            </section>
            {/* Section 2 */}
            <section>
              <h2 className="font-headline-md text-headline-md text-primary mb-4">Verificación de Boletos</h2>
              <p className="font-body-lg text-body-lg text-zinc-300">
                Nuestra tecnología de boletaje holográfico digital erradica el fraude de raíz. Cada pase emitido por StageFront cuenta con una firma criptográfica única y dinámica, enlazada exclusivamente a su dispositivo verificado. Los identificadores visuales adaptativos, que responden a sensores biométricos y de movimiento, hacen que la duplicación física o digital sea fundamentalmente imposible.
              </p>
            </section>
            {/* Section 3 */}
            <section>
              <h2 className="font-headline-md text-headline-md text-primary mb-4">Soporte al Usuario</h2>
              <p className="font-body-lg text-body-lg text-zinc-300">
                Ante cualquier anomalía, intento de intrusión o duda sobre la legitimidad de un acceso, nuestro equipo de respuesta a incidentes opera 24/7. Comuníquese inmediatamente a través de nuestros canales cifrados en la aplicación o directamente al centro de comando de seguridad. Investigaremos rigurosamente cualquier reporte para mantener la pureza de la red StageFront.
              </p>
            </section>
          </div>
          {/* Footer Action */}
          <div className="mt-16 pt-8 border-t border-white/10 flex justify-start relative z-10">
            <Link href="/" className="font-label-caps text-label-caps px-6 py-4 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-white hover:bg-white/5 transition-all duration-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
