import { notFound } from "next/navigation";
import { getEventById, getTicketsByEventId } from "@/lib/actions/tickets";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeatSelector from "./SeatSelector";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckoutEventPage({ params }: PageProps) {
  const { id } = await params;
  
  // Obtener evento y tickets en paralelo para mejor rendimiento
  const [event, tickets] = await Promise.all([
    getEventById(id),
    getTicketsByEventId(id),
  ]);

  if (!event) {
    notFound();
  }

  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24 min-h-screen bg-zinc-950">
        {/* Header simple del evento */}
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 font-label-caps text-xs tracking-widest text-zinc-300">
              SELECCIÓN DE ASIENTOS
            </span>
          </div>
          <h1 className="font-headline-lg text-4xl md:text-5xl font-bold text-white mb-4">
            {event.title}
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-zinc-400 font-body-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">
                calendar_month
              </span>
              <span className="capitalize">{dateFormatter.format(new Date(event.date))}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">
                location_on
              </span>
              <span>{event.venue}, {event.city}</span>
            </div>
          </div>
        </div>

        {/* Interfaz interactiva de selección de asientos (Client Component) */}
        <section className="px-6">
          <SeatSelector event={event} initialTickets={tickets} />
        </section>
      </main>
      <Footer />
    </>
  );
}
