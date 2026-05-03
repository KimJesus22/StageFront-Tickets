import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Política de Privacidad — StageFront Tickets",
  description: "Política de privacidad y protección de datos de StageFront Tickets.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-32 pb-32 px-margin-mobile md:px-margin-desktop min-h-screen">
        {/* Hero Header */}
        <div className="max-w-3xl mx-auto mb-stack-lg text-center">
          <h1 className="font-display-xl text-display-xl text-tertiary mb-stack-sm">
            Política de Privacidad
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Última actualización: Mayo 2026
          </p>
        </div>

        {/* Content */}
        <article className="max-w-3xl mx-auto space-y-stack-md font-body-md text-body-md text-on-surface-variant leading-relaxed">
          <section className="mb-stack-lg">
            <h2 className="font-headline-lg text-headline-lg text-tertiary mb-stack-sm">
              1. Información que recopilamos
            </h2>
            <p className="mb-unit">
              En StageFront, valoramos su privacidad y nos comprometemos a proteger sus datos personales. Recopilamos información que usted nos proporciona directamente al crear una cuenta, comprar entradas o interactuar con nuestros servicios. Esto incluye, pero no se limita a, su nombre, dirección de correo electrónico, número de teléfono y detalles de pago.
            </p>
            <p>
              Además, recopilamos automáticamente cierta información sobre su dispositivo y cómo interactúa con nuestra plataforma, como su dirección IP, tipo de navegador, páginas visitadas y tiempos de acceso. Esta información nos ayuda a mejorar la experiencia del usuario y garantizar la seguridad de nuestra plataforma.
            </p>
          </section>

          <section className="mb-stack-lg">
            <h2 className="font-headline-lg text-headline-lg text-tertiary mb-stack-sm">
              2. Uso de la información
            </h2>
            <p className="mb-unit">
              Utilizamos la información recopilada para diversos fines esenciales para proporcionar y mejorar nuestros servicios:
            </p>
            <ul className="list-disc pl-gutter space-y-unit mt-stack-sm">
              <li>Procesar sus transacciones y entregar las entradas adquiridas.</li>
              <li>Gestionar su cuenta de usuario y brindarle soporte técnico.</li>
              <li>Personalizar su experiencia, recomendando eventos y artistas que puedan interesarle.</li>
              <li>Comunicarnos con usted sobre actualizaciones, ofertas promocionales y cambios en nuestras políticas.</li>
              <li>Prevenir el fraude y garantizar la seguridad de todos los usuarios en la plataforma.</li>
            </ul>
          </section>

          <section className="mb-stack-lg">
            <h2 className="font-headline-lg text-headline-lg text-tertiary mb-stack-sm">
              3. Protección de datos
            </h2>
            <p className="mb-unit">
              Implementamos medidas de seguridad técnicas y organizativas de vanguardia para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción. Utilizamos encriptación SSL/TLS para asegurar las transmisiones de datos sensibles, como la información de pago.
            </p>
            <p>
              El acceso a su información personal está restringido a los empleados, contratistas y agentes de StageFront que necesitan conocer dicha información para procesarla en nuestro nombre, y están sujetos a estrictas obligaciones de confidencialidad contractual.
            </p>
          </section>

          <section className="mb-stack-lg">
            <h2 className="font-headline-lg text-headline-lg text-tertiary mb-stack-sm">
              4. Información de la Empresa
            </h2>
            <p className="mb-unit">
              StageFront Tickets es una startup tecnológica fundada y desarrollada actualmente por el CEO <strong>KimJesus 21</strong>.
            </p>
            <p>
              Nuestra sede principal de operaciones y centro de desarrollo se encuentra ubicada en la ciudad de <strong>Celaya, Guanajuato, México</strong>.
            </p>
          </section>

          <section className="mt-stack-lg pt-stack-md border-t border-surface-variant">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Si tiene alguna pregunta sobre esta Política de Privacidad, por favor contáctenos a través de nuestro{" "}
              <Link 
                href="/support" 
                className="text-tertiary hover:underline underline-offset-4 decoration-outline-variant transition-all"
              >
                Centro de Soporte
              </Link>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
