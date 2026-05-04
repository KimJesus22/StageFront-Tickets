import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRelatedOrders, type OrderConfirmation } from "@/lib/actions/orders";
import ConfettiEffect from "@/components/ConfettiEffect";

interface SuccessPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function DigitalTicket({ order }: { order: OrderConfirmation }) {
  const { ticket } = order;
  const { event } = ticket;
  const { artist } = event;

  return (
    <div className="relative w-full max-w-[400px] flex flex-col rounded-[32px] bg-surface-container-low/40 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden group mb-8">
      {/* Holographic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#9333ea]/15 via-[#06b6d4]/15 to-white/5 pointer-events-none mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      {/* Top Section: Details */}
      <div className="relative p-8 flex flex-col gap-6 z-10">
        <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
          <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em]">
            Acceso Premium
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary uppercase leading-none">
            {event.title}
          </h2>
        </div>
        
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-outline text-xl">
                location_on
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Venue
              </span>
              <span className="font-body-lg text-body-lg text-primary font-medium">
                {event.venue}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-outline text-xl">
                calendar_month
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Fecha
              </span>
              <span className="font-body-lg text-body-lg text-primary font-medium uppercase">
                {dateFormatter.format(new Date(event.date))}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-6 mt-2 border-t border-white/5">
          <div className="flex flex-col bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">
              Sección
            </span>
            <span className="font-headline-md text-headline-md text-primary truncate" title={ticket.zone}>
              {ticket.zone}
            </span>
          </div>
          <div className="flex flex-col bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">
              Asiento
            </span>
            <span className="font-headline-md text-headline-md text-primary">
              {ticket.seat_number}
            </span>
          </div>
        </div>
      </div>
      
      {/* Punched Holes & Separation */}
      <div className="relative h-12 flex items-center justify-between w-full z-10 px-[-16px]">
        <div className="w-8 h-12 bg-background rounded-r-full absolute -left-1 shadow-[inset_-5px_0_10px_rgba(0,0,0,0.5)] border-r border-white/10"></div>
        <div className="w-full border-t-2 border-dashed border-outline/30 mx-8"></div>
        <div className="w-8 h-12 bg-background rounded-l-full absolute -right-1 shadow-[inset_5px_0_10px_rgba(0,0,0,0.5)] border-l border-white/10"></div>
      </div>
      
      {/* Bottom Section: QR & Order */}
      <div className="relative p-8 flex flex-col items-center bg-white/[0.01] z-10">
        <div className="bg-primary p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          {/* Simulated QR Code using a generic placeholder that looks like a QR */}
          <Image
            alt="Código QR de Acceso"
            width={128}
            height={128}
            className="w-32 h-32 object-cover grayscale contrast-150 mix-blend-multiply"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvX_mjViow9Xf5dVEJT_odhSdoYpdLDbt9I68dE2oGzlLGXJGgBvMwrO2fbGQhMo4uaVcwsoKNrN9CR1B2IhWXIVhL0l2fC_4UoLIKRsHTfQddOTsOVGfHHbYPFisBnr0k0cT3kTQ2CJN1kdAMNr_IOGaUcPMCkNTcsTPibCTp9IAZPjlm_30ksxduLf6-I1Fur4xmwZg6S8BRc-_GfRA_SISpoB3mYoQyvGhdqfTK3hP8SJIGufJ3tX2aI5_laEAmONEKZp7EQ78"
            unoptimized
          />
        </div>
        <div className="mt-6 flex flex-col items-center">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase">
            Número de Orden
          </span>
          <span className="font-body-md text-body-md text-primary tracking-wider uppercase">
            #{order.id.split("-")[0]}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderId = params.order_id as string | undefined;

  if (!orderId) {
    notFound();
  }

  const orders = await getRelatedOrders(orderId);

  if (!orders || orders.length === 0) {
    notFound();
  }

  return (
    <main className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-x-hidden pt-24 pb-24">
      <ConfettiEffect />
      
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-30">
        <div className="w-[800px] h-[800px] bg-primary-container rounded-full blur-[120px] mix-blend-screen opacity-10"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-container-max flex flex-col items-center gap-stack-lg">
        {/* Celebration Header */}
        <section className="flex flex-col items-center text-center gap-stack-sm max-w-lg mt-8">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] mb-4">
            <span
              className="material-symbols-outlined text-[48px] text-[#10b981]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <div className="absolute inset-0 rounded-full border-2 border-[#10b981]/50 animate-ping opacity-20"></div>
          </div>
          <h1 className="font-display-xl text-display-xl text-primary tracking-tighter">
            ¡Estás dentro!
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Tu pago fue procesado con éxito. Aquí tienes tu acceso a la historia.
          </p>
        </section>

        {/* The Tickets (Skeuomorphic Glass Components) */}
        <section className="flex flex-col items-center w-full max-w-[400px]">
          {orders.map((order) => (
            <DigitalTicket key={order.id} order={order} />
          ))}
        </section>

        {/* Actions */}
        <section className="flex flex-col items-center gap-4 w-full max-w-[400px]">
          <Link
            href="/wallet"
            className="w-full h-14 flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary font-body-lg font-semibold hover:bg-tertiary-container hover:scale-[0.98] transition-all duration-200"
          >
            <span className="material-symbols-outlined text-xl">
              account_balance_wallet
            </span>
            Guardar en mi Billetera
          </Link>
          <Link
            href="/"
            className="w-full h-14 flex items-center justify-center rounded-full bg-transparent border border-outline/30 text-primary font-body-lg hover:bg-white/5 hover:border-white/50 transition-all duration-200"
          >
            Volver al Inicio
          </Link>
        </section>
      </div>
    </main>
  );
}
