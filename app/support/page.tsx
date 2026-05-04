import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQAccordion from "./components/FAQAccordion";
import ContactForm from "./components/ContactForm";

export const metadata = {
  title: "Centro de Soporte — StageFront Tickets",
  description: "Ayuda y soporte técnico de StageFront Tickets.",
};

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-start px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto w-full gap-stack-lg mt-20 min-h-screen">
        {/* Hero & Search Section */}
        <section className="w-full flex flex-col items-center text-center gap-stack-md pt-stack-lg">
          <div className="flex flex-col gap-stack-sm">
            <h1 className="font-display-xl text-display-xl text-primary">
              Centro de Soporte
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              ¿Cómo podemos ayudarte hoy?
            </p>
          </div>
          <div className="w-full max-w-2xl relative mt-stack-sm">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">
              search
            </span>
            <input
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-full py-4 pl-14 pr-6 text-primary font-body-md placeholder:text-on-surface-variant focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all shadow-xl shadow-black/20"
              placeholder="Busca artículos, eventos, o problemas..."
              type="text"
            />
          </div>
        </section>

        {/* Categories Grid */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mt-stack-md">
          {/* Card 1 */}
          <a
            className="group flex flex-col items-center justify-center gap-stack-sm p-stack-md bg-surface-container-low/50 backdrop-blur-[20px] border border-white/10 rounded-xl hover:bg-surface-container-high/50 hover:border-white/20 transition-all duration-300"
            href="/wallet"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5 group-hover:border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                confirmation_number
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mt-2">
              Mis Boletos
            </h3>
          </a>
          {/* Card 2 */}
          <a
            className="group flex flex-col items-center justify-center gap-stack-sm p-stack-md bg-surface-container-low/50 backdrop-blur-[20px] border border-white/10 rounded-xl hover:bg-surface-container-high/50 hover:border-white/20 transition-all duration-300"
            href="#"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5 group-hover:border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                payments
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mt-2">
              Pagos y Reembolsos
            </h3>
          </a>
          {/* Card 3 */}
          <a
            className="group flex flex-col items-center justify-center gap-stack-sm p-stack-md bg-surface-container-low/50 backdrop-blur-[20px] border border-white/10 rounded-xl hover:bg-surface-container-high/50 hover:border-white/20 transition-all duration-300"
            href="#"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5 group-hover:border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                how_to_reg
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mt-2 text-center">
              Acceso al Evento
            </h3>
          </a>
          {/* Card 4 */}
          <a
            className="group flex flex-col items-center justify-center gap-stack-sm p-stack-md bg-surface-container-low/50 backdrop-blur-[20px] border border-white/10 rounded-xl hover:bg-surface-container-high/50 hover:border-white/20 transition-all duration-300"
            href="#"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5 group-hover:border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                manage_accounts
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mt-2">
              Cuenta
            </h3>
          </a>
        </section>

        {/* FAQ Section */}
        <section className="w-full max-w-4xl mt-stack-lg flex flex-col gap-stack-md">
          <h2 className="font-headline-lg text-headline-lg text-primary border-b border-white/10 pb-stack-sm">
            Preguntas Frecuentes
          </h2>
          <FAQAccordion />
        </section>

        {/* Contact Form */}
        <section className="w-full max-w-2xl mt-stack-lg bg-surface-container-low/30 backdrop-blur-[40px] border border-white/10 rounded-xl p-stack-md lg:p-stack-lg relative overflow-hidden">
          {/* Subtle glow in top-left */}
          <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="font-headline-lg text-headline-lg text-primary mb-stack-sm relative z-10">
            ¿Aún necesitas ayuda?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md relative z-10">
            Envíanos un mensaje y nuestro equipo de concierge te asistirá.
          </p>
          
          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
