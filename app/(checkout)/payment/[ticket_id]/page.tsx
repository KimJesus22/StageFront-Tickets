import { notFound } from "next/navigation";
import { insforge } from "@/lib/insforge";
import { processPayment } from "@/lib/actions/checkout";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PageProps {
  params: Promise<{ ticket_id: string }>;
}

export default async function PaymentPage({ params }: PageProps) {
  const { ticket_id } = await params;

  // Obtener el boleto y los datos del evento asociado
  const { data: ticket, error } = await insforge.database
    .from("tickets_inventory")
    .select(`
      *,
      events (
        title,
        venue,
        city,
        date
      )
    `)
    .eq("id", ticket_id)
    .single();

  if (error || !ticket || ticket.status !== "bloqueado") {
    // Si el boleto no existe o no está bloqueado por el usuario, fallamos.
    // (En un sistema real, verificaríamos que el boleto fue bloqueado por ESTE usuario específico).
    notFound();
  }

  // Bind the ticketId to the server action
  const processPaymentWithId = processPayment.bind(null, ticket_id);

  // Formateador de fechas
  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const eventTitle = (ticket.events as any)?.title || "Evento Desconocido";
  const eventVenue = (ticket.events as any)?.venue || "Recinto";
  const eventCity = (ticket.events as any)?.city || "Ciudad";
  const eventDate = (ticket.events as any)?.date ? new Date((ticket.events as any).date) : new Date();

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24 pb-12 min-h-screen bg-zinc-950 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          
          {/* Columna Izquierda: Resumen de Compra */}
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-white mb-6">
              Resumen de Compra
            </h1>
            
            <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6 md:p-8 flex-grow">
              <div className="flex items-start justify-between border-b border-white/10 pb-6 mb-6">
                <div>
                  <h2 className="font-headline-md text-2xl text-white mb-2">{eventTitle}</h2>
                  <div className="flex items-center gap-2 text-zinc-400 font-body-md text-sm mb-1">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span className="capitalize">{dateFormatter.format(eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>{eventVenue}, {eventCity}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center font-body-md text-zinc-300">
                  <span>Zona</span>
                  <span className="font-semibold text-white">{ticket.zone}</span>
                </div>
                <div className="flex justify-between items-center font-body-md text-zinc-300">
                  <span>Asiento</span>
                  <span className="font-semibold text-white">{ticket.seat_number}</span>
                </div>
                <div className="flex justify-between items-center font-body-md text-zinc-300 border-t border-white/5 pt-4 mt-4">
                  <span>Precio del boleto</span>
                  <span className="font-semibold text-white">${Number(ticket.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-body-md text-zinc-300 pb-4 border-b border-white/10">
                  <span>Cargos por servicio</span>
                  <span className="font-semibold text-white">$0.00</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="font-headline-md text-xl text-white">Total</span>
                  <span className="font-display-md text-3xl font-bold text-primary">
                    ${Number(ticket.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario de Pago */}
          <div className="flex flex-col">
            <h2 className="font-headline-md text-2xl font-bold text-white mb-6">
              Método de Pago
            </h2>
            
            <form action={processPaymentWithId} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              
              {/* Información Personal */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-body-md text-zinc-400 mb-2">Nombre completo</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    required 
                    placeholder="Ej. Jane Doe"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-body-md text-zinc-400 mb-2">Correo electrónico</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Datos de Tarjeta Simulados */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <p className="text-sm font-body-md text-zinc-500 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Pago seguro (Simulado)
                </p>
                <div>
                  <label className="block text-sm font-body-md text-zinc-400 mb-2">Número de tarjeta</label>
                  <input 
                    type="text" 
                    required 
                    defaultValue="4242 4242 4242 4242"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 font-mono focus:outline-none"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body-md text-zinc-400 mb-2">Fecha de exp.</label>
                    <input 
                      type="text" 
                      defaultValue="12/30"
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 font-mono focus:outline-none"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-body-md text-zinc-400 mb-2">CVC</label>
                    <input 
                      type="text" 
                      defaultValue="123"
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 font-mono focus:outline-none"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Submit (El submit en Server Actions mostrará carga si usamos useFormStatus en un client component, pero por simplicidad usaremos un botón estático, o podríamos crear un Client Button) */}
              <button 
                type="submit"
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-body-md font-bold text-lg hover:bg-white/90 hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] flex items-center justify-center gap-2 mt-4"
              >
                Pagar ${Number(ticket.price).toFixed(2)}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
