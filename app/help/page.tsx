import Link from "next/link";

export const metadata = {
  title: "Centro de Ayuda - StageFront",
};

export default function HelpPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(20, 19, 19, 0.4);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-panel {
            background: rgba(20, 19, 19, 0.6);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        .glass-panel::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        }
        .glass-input {
            background: rgba(255, 255, 255, 0.05);
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        .glass-input:focus {
            outline: none;
            border-bottom-color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.8);
        }
        details > summary {
            list-style: none;
        }
        details > summary::-webkit-details-marker {
            display: none;
        }
        .filled-icon {
            font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
      `}} />
      <div className="flex-1 flex w-full max-w-container-max mx-auto md:pt-[73px]">
        {/* SideNavBar (Web - Contextual Help Center) */}
        <aside className="hidden lg:flex flex-col p-4 gap-2 h-screen w-64 border-r border-white/10 shadow-2xl bg-zinc-950/90 backdrop-blur-2xl fixed left-0 top-[73px] font-space-grotesk z-40">
          <div className="mb-8 px-4 py-2">
            <div className="text-xl font-black text-white">StageFront</div>
            <div className="text-zinc-500 text-sm mt-1">Centro de Ayuda</div>
          </div>
          <nav className="flex flex-col gap-2">
            <Link className="text-zinc-500 hover:text-zinc-200 hover:bg-white/5 p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ease-in-out" href="/">
              <span className="material-symbols-outlined">home</span>
              Inicio
            </Link>
            <Link className="text-zinc-500 hover:text-zinc-200 hover:bg-white/5 p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ease-in-out" href="/wallet">
              <span className="material-symbols-outlined">confirmation_number</span>
              Tickets
            </Link>
            <Link className="text-zinc-500 hover:text-zinc-200 hover:bg-white/5 p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ease-in-out" href="/wallet">
              <span className="material-symbols-outlined">payments</span>
              Pagos
            </Link>
            <Link className="text-zinc-500 hover:text-zinc-200 hover:bg-white/5 p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ease-in-out" href="/security">
              <span className="material-symbols-outlined">shield</span>
              Seguridad
            </Link>
            <Link className="bg-white/10 text-white rounded-lg p-3 flex items-center gap-3 transition-all duration-300 ease-in-out" href="/help">
              <span className="material-symbols-outlined filled-icon">help_center</span>
              Centro de Ayuda
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full lg:pl-64 min-h-screen pb-32 md:pb-12">
          {/* Hero Section */}
          <section className="relative pt-24 pb-16 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center overflow-hidden min-h-[512px]">
            {/* Decorative blurred background element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
            <h1 className="font-display-xl text-display-xl text-primary mb-stack-md relative z-10 max-w-3xl">¿Cómo podemos ayudarte?</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg max-w-2xl relative z-10">Busca artículos, guías de solución de problemas o explora las categorías a continuación.</p>
            
            {/* Search Bar */}
            <div className="relative w-full max-w-2xl z-10">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">search</span>
              </div>
              <input className="w-full glass-input text-on-surface placeholder:text-outline py-4 pl-12 pr-4 text-body-lg font-body-lg rounded-t-lg" placeholder="Busca 'fila virtual', 'reembolsos'..." type="text" />
            </div>
          </section>

          {/* Categories Bento Grid */}
          <section className="px-margin-mobile md:px-margin-desktop mb-stack-lg max-w-5xl mx-auto">
            <h2 className="font-headline-md text-headline-md text-primary mb-stack-md">Categorías de Ayuda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {/* Category Card 1 */}
              <Link className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 group flex flex-col items-center text-center" href="/help">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                  <span className="material-symbols-outlined text-primary">local_activity</span>
                </div>
                <h3 className="font-headline-lg text-body-lg font-semibold text-primary mb-2">Boletos</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Descarga, transferencia y problemas de acceso.</p>
              </Link>
              {/* Category Card 2 */}
              <Link className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 group flex flex-col items-center text-center" href="/help">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                  <span className="material-symbols-outlined text-primary">credit_card</span>
                </div>
                <h3 className="font-headline-lg text-body-lg font-semibold text-primary mb-2">Pagos</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Facturación, métodos de pago y reembolsos.</p>
              </Link>
              {/* Category Card 3 */}
              <Link className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 group flex flex-col items-center text-center" href="/help">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                  <span className="material-symbols-outlined text-primary">hourglass_empty</span>
                </div>
                <h3 className="font-headline-lg text-body-lg font-semibold text-primary mb-2">Fila Virtual</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Cómo funciona y consejos para preventas.</p>
              </Link>
              {/* Category Card 4 */}
              <Link className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 group flex flex-col items-center text-center" href="/help">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                  <span className="material-symbols-outlined text-primary">manage_accounts</span>
                </div>
                <h3 className="font-headline-lg text-body-lg font-semibold text-primary mb-2">Cuenta</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Actualización de datos y seguridad de la cuenta.</p>
              </Link>
            </div>
          </section>

          {/* FAQ Accordion Section */}
          <section className="px-margin-mobile md:px-margin-desktop mb-stack-lg max-w-3xl mx-auto">
            <h2 className="font-headline-md text-headline-md text-primary mb-stack-md">Preguntas Frecuentes</h2>
            <div className="glass-panel rounded-2xl divide-y divide-white/10">
              {/* FAQ 1 */}
              <details className="group" open>
                <summary className="flex justify-between items-center font-headline-lg text-body-lg font-medium cursor-pointer list-none p-6 text-primary hover:bg-white/5 transition-colors">
                  <span>¿Qué pasa si pierdo conexión durante la Fila Virtual?</span>
                  <span className="transition group-open:rotate-180 material-symbols-outlined text-outline-variant">expand_more</span>
                </summary>
                <div className="text-on-surface-variant font-body-md text-body-md px-6 pb-6 pt-2 animate-fade-in">
                  Tu lugar en la fila virtual está asegurado por un breve período si pierdes la conexión. Te recomendamos reconectarte lo antes posible usando el mismo dispositivo y navegador. No actualices la página manualmente, el sistema intentará reconectar automáticamente.
                </div>
              </details>
              {/* FAQ 2 */}
              <details className="group">
                <summary className="flex justify-between items-center font-headline-lg text-body-lg font-medium cursor-pointer list-none p-6 text-primary hover:bg-white/5 transition-colors">
                  <span>¿Cómo funcionan los boletos digitales?</span>
                  <span className="transition group-open:rotate-180 material-symbols-outlined text-outline-variant">expand_more</span>
                </summary>
                <div className="text-on-surface-variant font-body-md text-body-md px-6 pb-6 pt-2">
                  Tus boletos digitales son códigos dinámicos que se actualizan constantemente para evitar fraudes. Podrás visualizarlos en la app de StageFront 24 horas antes del evento. Las capturas de pantalla no serán válidas para ingresar al recinto.
                </div>
              </details>
              {/* FAQ 3 */}
              <details className="group">
                <summary className="flex justify-between items-center font-headline-lg text-body-lg font-medium cursor-pointer list-none p-6 text-primary hover:bg-white/5 transition-colors">
                  <span>¿Puedo transferir mis boletos a otra persona?</span>
                  <span className="transition group-open:rotate-180 material-symbols-outlined text-outline-variant">expand_more</span>
                </summary>
                <div className="text-on-surface-variant font-body-md text-body-md px-6 pb-6 pt-2">
                  Sí, puedes transferir tus boletos de forma segura a través de la sección "Mis Tickets" en tu cuenta. El destinatario necesitará crear una cuenta en StageFront para aceptar la transferencia. Algunas transferencias pueden estar restringidas según las políticas del artista.
                </div>
              </details>
            </div>
          </section>

          {/* Bottom Action */}
          <section className="px-margin-mobile md:px-margin-desktop mb-stack-lg flex justify-center">
            <Link className="inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full hover:bg-white/10 transition-all font-label-caps text-label-caps uppercase text-primary tracking-widest border border-white/20" href="/">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver al Inicio
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
