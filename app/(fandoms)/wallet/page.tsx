import Link from "next/link";
import Image from "next/image";
import { getUserTickets } from "@/lib/actions/orders";

export default async function WalletPage() {
  const orders = await getUserTickets();

  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="pt-24 pb-12 px-margin-mobile md:px-margin-desktop min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-headline-lg text-4xl font-bold text-white mb-2">Mi Billetera</h1>
        <p className="font-body-md text-zinc-400 mb-10">Tus accesos exclusivos a la historia.</p>

        {orders.length === 0 ? (
          /* Empty State */
          <div className="bg-surface-container-low border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-zinc-500">
                local_activity
              </span>
            </div>
            <h2 className="font-headline-md text-2xl font-bold text-white mb-4">Aún no tienes boletos</h2>
            <p className="font-body-md text-zinc-400 max-w-md mx-auto mb-8">
              Tu billetera está vacía. Descubre los próximos eventos y asegura tu lugar antes de que se agoten.
            </p>
            <Link
              href="/"
              className="px-8 py-3 bg-primary text-on-primary rounded-full font-body-md font-semibold hover:bg-white/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]"
            >
              Explorar Eventos
            </Link>
          </div>
        ) : (
          /* Lista de Boletos */
          <div className="space-y-8">
            {orders.map((order) => {
              const ticket = order.tickets_inventory;
              const event = ticket?.events;
              const artist = event?.artists;

              if (!ticket || !event || !artist) return null;

              const eventDate = new Date(event.date);

              return (
                <div key={order.id} className="relative w-full overflow-hidden rounded-3xl flex flex-col md:flex-row group">
                  
                  {/* Background Image Difuminada */}
                  <div className="absolute inset-0 w-full h-full">
                    {artist.image_url && (
                      <Image
                        src={artist.image_url}
                        alt={artist.name}
                        fill
                        className="object-cover blur-2xl opacity-30 scale-110"
                      />
                    )}
                    {/* Overlay para garantizar legibilidad */}
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/70 to-zinc-950/90" />
                  </div>

                  {/* Contenedor principal del boleto con Glassmorphism */}
                  <div className="relative flex-grow flex flex-col md:flex-row bg-white/5 backdrop-blur-xl border border-white/10 w-full h-full">
                    
                    {/* Sección Principal (Detalles) */}
                    <div className="flex-grow p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 border-dashed relative">
                      
                      {/* Recortes de Perforación (Skeuomorphic) */}
                      {/* Círculo Arriba (Desktop) o Izquierda (Móvil) */}
                      <div className="absolute -bottom-4 md:-top-4 md:-right-4 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 w-8 h-8 bg-zinc-950 rounded-full z-10" />
                      {/* Círculo Abajo (Desktop) o Derecha (Móvil) */}
                      <div className="absolute -top-4 md:-bottom-4 md:-right-4 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 w-8 h-8 bg-zinc-950 rounded-full z-10" />

                      <div className="flex items-center gap-3 mb-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-label-caps text-xs tracking-widest border border-primary/30">
                          {ticket.zone.toUpperCase()}
                        </span>
                        <span className="text-zinc-400 font-mono text-sm tracking-widest">
                          ID: {order.id.split("-")[0].toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <h2 className="font-headline-lg text-3xl md:text-5xl font-bold text-white mb-1">
                          {artist.name}
                        </h2>
                        <h3 className="font-body-md text-lg text-zinc-300 mb-6">
                          {event.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-auto">
                        <div>
                          <p className="font-label-caps text-xs text-zinc-500 mb-1">FECHA</p>
                          <p className="font-body-md text-white font-medium capitalize">
                            {dateFormatter.format(eventDate)}
                          </p>
                        </div>
                        <div>
                          <p className="font-label-caps text-xs text-zinc-500 mb-1">LUGAR</p>
                          <p className="font-body-md text-white font-medium">
                            {event.venue}, {event.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sección Derecha (Asiento y QR) */}
                    <div className="w-full md:w-64 p-6 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center relative bg-black/20">
                      
                      <div className="text-center mb-0 md:mb-6">
                        <p className="font-label-caps text-xs text-zinc-500 mb-1">ASIENTO</p>
                        <p className="font-display-md text-4xl md:text-5xl font-bold text-white">
                          {ticket.seat_number}
                        </p>
                      </div>

                      {/* Simulación de QR Code */}
                      <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-xl p-2 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        <span className="material-symbols-outlined text-[64px] md:text-[96px] text-zinc-950 font-light">
                          qr_code_2
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
