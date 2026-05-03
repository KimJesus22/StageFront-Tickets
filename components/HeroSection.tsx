export default function HeroSection() {
  return (
    <section className="relative min-h-[819px] flex items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop py-stack-lg">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-surface-variant/20 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-container-max mx-auto flex flex-col items-center text-center gap-stack-md">
        {/* Exclusive Access Badge */}
        <span className="px-4 py-1.5 rounded-full bg-surface-container-high/50 border border-white/10 font-label-caps text-label-caps text-on-surface-variant tracking-widest backdrop-blur-md shadow-[0_0_12px_rgba(255,255,255,0.05)]">
          ACCESO EXCLUSIVO
        </span>

        {/* Main Heading */}
        <h1 className="font-display-xl text-display-xl text-primary max-w-4xl">
          Asegura tu lugar en la historia
        </h1>

        {/* Subheading */}
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          El ecosistema de boletos premium para los eventos más esperados.
          Experimenta un servicio de conserjería de alta tecnología diseñado para
          verdaderos fans.
        </p>

        {/* Modern Search Bar */}
        <div className="w-full max-w-2xl mt-8">
          <div className="relative group bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-surface-container/60">
            <div className="pl-4 pr-2 flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="flex-grow bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/60 font-body-lg text-body-lg h-12"
              placeholder="Buscar artistas, recintos o ciudades..."
              type="text"
            />
            <button className="bg-primary text-on-primary px-8 py-3 rounded-full font-body-md font-semibold hover:scale-105 transition-transform duration-200">
              Explorar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
