import Link from "next/link";
import Image from "next/image";
import { getUserTickets } from "@/lib/actions/orders";

export const metadata = {
  title: "Mis Pases — StageFront Tickets",
  description:
    "Tu billetera digital con todos tus accesos exclusivos. Presenta tu código QR en el acceso principal.",
};

export default async function WalletPage() {
  const orders = await getUserTickets();

  const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="bg-background text-on-background min-h-screen relative overflow-x-hidden antialiased selection:bg-primary selection:text-background">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 py-4">
        {/* Brand */}
        <div className="text-2xl font-bold text-zinc-50 tracking-tight font-headline-lg">
          Mis Pases
        </div>
        {/* Trailing Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-zinc-50 hover:opacity-70 transition-opacity active:scale-95 duration-200 focus:outline-none"
          >
            <span className="material-symbols-outlined">notifications</span>
          </Link>
          <Link
            href="/"
            className="text-zinc-50 hover:opacity-70 transition-opacity active:scale-95 duration-200 focus:outline-none"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </Link>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="pt-[100px] pb-[120px] md:pb-[100px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col items-center min-h-screen gap-12">
        {orders.length === 0 ? (
          /* ─── Estado Vacío ─── */
          <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center py-20">
            {/* Icono decorativo */}
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-full bg-surface-container-high/40 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <span
                  className="material-symbols-outlined text-6xl text-on-surface-variant/60"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  account_balance_wallet
                </span>
              </div>
              {/* Glow sutil detrás */}
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10" />
            </div>

            <h1 className="font-display-xl text-[40px] md:text-display-xl text-primary leading-none mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              Sin Pases
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mx-auto mb-10 leading-relaxed">
              Tu billetera está vacía. Descubre los próximos eventos y asegura
              tu lugar antes de que se agoten.
            </p>

            <Link
              href="/"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-full font-label-caps text-label-caps tracking-widest uppercase hover:bg-white/90 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                explore
              </span>
              Explorar Eventos
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        ) : (
          /* ─── Lista de Boletos Skeuomorphic ─── */
          orders.map((order) => {
            const ticket = order.tickets_inventory;
            const event = ticket?.events;
            const artist = event?.artists;

            if (!ticket || !event || !artist) return null;

            const eventDate = new Date(event.date);
            const formattedDate = shortDateFormatter
              .format(eventDate)
              .toUpperCase();

            return (
              <div
                key={order.id}
                className="relative w-full max-w-md mx-auto rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] bg-surface border border-white/10 group"
              >
                {/* Ticket Background Layer (Concert Vibe) */}
                <div className="absolute inset-0 z-0">
                  {(event.image_url || artist.image_url) && (
                    <Image
                      src={event.image_url || artist.image_url}
                      alt={`Concierto ${artist.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 448px"
                      className="object-cover opacity-60 mix-blend-screen scale-105 group-hover:scale-110 transition-transform duration-[20s] ease-linear"
                      unoptimized
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background backdrop-blur-md" />
                </div>

                {/* Top Section: Event Info */}
                <div className="relative z-10 p-8 flex flex-col h-full">
                  {/* Tour Context */}
                  <div className="flex justify-between items-center mb-stack-md">
                    <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                      {event.title}
                    </span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Artist Main Typography */}
                  <div className="mt-2 mb-stack-sm">
                    <h2 className="font-display-xl text-display-xl text-primary leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      {artist.name}
                    </h2>
                  </div>

                  {/* Venue Info */}
                  <div className="flex items-center gap-2 text-on-surface mb-stack-lg">
                    <span
                      className="material-symbols-outlined text-on-surface-variant text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      location_on
                    </span>
                    <span className="font-body-md text-body-md">
                      {event.venue}, {event.city}
                    </span>
                  </div>

                  {/* Detailed Seat Info Grid */}
                  <div className="grid grid-cols-2 gap-gutter bg-surface-container-high/40 p-6 rounded-xl border border-white/5 backdrop-blur-xl mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">
                        ZONA
                      </span>
                      <span className="font-headline-md text-headline-md text-primary">
                        {ticket.zone.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">
                        ASIENTO
                      </span>
                      <span className="font-headline-md text-headline-md text-primary">
                        {ticket.seat_number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skeuomorphic Divider with Punched Holes (Notches) */}
                <div className="relative w-full h-8 flex items-center -my-4 z-20">
                  {/* Left Notch */}
                  <div className="absolute -left-4 w-8 h-8 rounded-full bg-background shadow-[inset_-2px_0_5px_rgba(0,0,0,0.5)] border-r border-white/10" />
                  {/* Perforated Line */}
                  <div className="w-full border-t-[2px] border-dashed border-white/20 mx-6" />
                  {/* Right Notch */}
                  <div className="absolute -right-4 w-8 h-8 rounded-full bg-background shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)] border-l border-white/10" />
                </div>

                {/* Bottom Section: QR Code */}
                <div className="relative z-10 p-8 pt-10 flex flex-col items-center justify-center bg-gradient-to-t from-surface-container-low to-transparent">
                  <div className="bg-primary p-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] relative group/qr cursor-pointer">
                    {/* Subtle glow effect behind QR */}
                    <div className="absolute inset-0 bg-primary/50 blur-xl rounded-2xl group-hover/qr:bg-primary/70 transition-colors" />
                    {/* QR Code placeholder — Material icon simulating QR */}
                    <div className="relative w-40 h-40 flex items-center justify-center rounded-lg border border-black/10 bg-white">
                      <span className="material-symbols-outlined text-[120px] text-zinc-900 mix-blend-multiply opacity-90">
                        qr_code_2
                      </span>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md text-center">
                    Presenta este código en el acceso principal
                  </p>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 bg-zinc-950/80 backdrop-blur-2xl rounded-t-3xl border-t border-white/5 z-50 shadow-2xl">
        {/* Wallet (Active) */}
        <Link
          href="/wallet"
          className="flex flex-col items-center justify-center text-zinc-50 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] active:scale-90 transition-transform focus:outline-none"
        >
          <span
            className="material-symbols-outlined mb-1"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance_wallet
          </span>
          <span className="font-headline-lg text-[10px] font-medium uppercase tracking-widest">
            Wallet
          </span>
        </Link>
        {/* Events (Inactive) */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined mb-1">
            confirmation_number
          </span>
          <span className="font-headline-lg text-[10px] font-medium uppercase tracking-widest">
            Events
          </span>
        </Link>
        {/* Explore (Inactive) */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined mb-1">explore</span>
          <span className="font-headline-lg text-[10px] font-medium uppercase tracking-widest">
            Explore
          </span>
        </Link>
        {/* Account (Inactive) */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined mb-1">person</span>
          <span className="font-headline-lg text-[10px] font-medium uppercase tracking-widest">
            Account
          </span>
        </Link>
      </nav>
    </div>
  );
}
