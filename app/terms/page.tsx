import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Términos de Servicio — StageFront Tickets",
  description: "Términos y condiciones de uso de StageFront Tickets.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-6 py-16 md:py-32 min-h-screen">
        {/* Hero Header */}
        <div className="mb-16 text-center">
          <h1 className="font-display-xl text-display-xl text-primary mb-4">
            Términos de Servicio
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Efectivo desde: Mayo 2026
          </p>
        </div>

        {/* Document Content */}
        <article className="space-y-12 font-body-md text-body-md leading-relaxed text-on-surface">
          <section className="space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y utilizar la plataforma de StageFront Tickets, usted acepta estar sujeto a estos Términos de Servicio. Estos términos constituyen un acuerdo legal vinculante entre usted y StageFront. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios ni adquirir boletos a través de nuestra plataforma.
            </p>
            <p>
              Nos reservamos el derecho de actualizar o modificar estos Términos en cualquier momento sin previo aviso. Su uso continuo de la plataforma después de cualquier cambio indica su aceptación de los nuevos términos. Para más detalles sobre el manejo de sus datos, consulte nuestra{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4 decoration-outline-variant transition-all font-medium">
                Política de Privacidad
              </Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">
              2. Política de compra y venta de boletos
            </h2>
            <p>
              StageFront actúa como intermediario entre los organizadores de eventos (promotores, artistas, recintos) y los compradores. Los precios de los boletos son establecidos por los organizadores y pueden estar sujetos a tarifas de servicio y procesamiento adicionales.
            </p>
            <ul className="list-none space-y-2 pl-4 border-l-2 border-surface-container-high ml-2 text-on-surface-variant">
              <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                Todos los precios se muestran en la moneda local del evento aplicable, a menos que se indique lo contrario.
              </li>
              <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                Las entradas son personales e intransferibles a menos que la funcionalidad de transferencia oficial esté habilitada para el evento específico.
              </li>
              <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                La reventa de boletos fuera de las plataformas autorizadas por StageFront está estrictamente prohibida y puede resultar en la anulación del boleto sin reembolso.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">
              3. Reembolsos y cancelaciones
            </h2>
            <p>
              Como regla general, todas las ventas son definitivas. No se emitirán reembolsos ni cambios por boletos perdidos, robados, dañados o destruidos. Sin embargo, existen excepciones específicas relacionadas con cambios en los eventos:
            </p>
            <ul className="list-none space-y-2 pl-4 border-l-2 border-surface-container-high ml-2 text-on-surface-variant">
              <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                <strong className="text-primary font-medium">Eventos Cancelados:</strong> Si un evento es cancelado y no reprogramado, se emitirá un reembolso automático al método de pago original (excluyendo ciertas tarifas no reembolsables).
              </li>
              <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                <strong className="text-primary font-medium">Eventos Reprogramados:</strong> Si un evento es pospuesto, sus boletos seguirán siendo válidos para la nueva fecha. Si no puede asistir, tendrá una ventana limitada para solicitar un reembolso según las directrices del organizador.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">
              4. Conducta del usuario en el recinto
            </h2>
            <p>
              La compra de un boleto constituye una licencia revocable para asistir al evento. El organizador del evento y la administración del recinto se reservan el derecho, sin reembolso de ninguna cantidad pagada, a rechazar la admisión o expulsar a cualquier persona cuya conducta sea considerada desordenada, que use lenguaje vulgar o abusivo, o que no cumpla con las reglas del recinto.
            </p>
            <p>
              Usted acepta someterse a cualquier registro o inspección de seguridad antes de ingresar al recinto. Objetos prohibidos como armas, drogas ilegales y equipos de grabación profesional pueden resultar en la denegación de entrada. Si tiene dudas, contacte a <Link href="mailto:support@stagefront.com" className="text-primary hover:underline underline-offset-4 decoration-outline-variant transition-all font-medium">support@stagefront.com</Link>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
