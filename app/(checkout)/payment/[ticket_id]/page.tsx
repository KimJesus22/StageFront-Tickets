'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createMockOrder } from '@/lib/actions/checkout';

interface SelectedSeat {
  id: string;
  zona: string;
  label: string;
  tipo: string;
  precio: number;
}

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export default function CheckoutPage({ params }: { params: Promise<{ ticket_id: string }> }) {
  // Use React.use to unwrap params if needed
  const { ticket_id } = use(params);
  const router = useRouter();

  // State
  const [seats, setSeats] = useState<SelectedSeat[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes = 600 seconds
  const [parkingCount, setParkingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventData, setEventData] = useState<{
    id: string;
    title: string;
    venue: string;
    city: string;
    date: string;
    image_url: string | null;
  } | null>(null);

  // Form States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const truncated = val.slice(0, 16);
    const formatted = truncated.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4);
    }
    setExpiry(val);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvc(e.target.value.replace(/\D/g, '').slice(0, 4));
  };

  // Initialize from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('stagefront_seats');
    const storedEventId = sessionStorage.getItem('stagefront_event_id');
    if (stored) {
      try {
        setSeats(JSON.parse(stored));
      } catch (e) {
        setSeats([]);
      }
    }
    if (storedEventId) {
      fetch(`/api/events/${storedEventId}`)
        .then(res => res.json())
        .then(data => setEventData(data))
        .catch(err => console.error("Error fetching event data", err));
    }
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      // Time is up
      alert('El tiempo se ha agotado. Los boletos han sido liberados.');
      router.push('/');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculations
  const basePrice = seats.reduce((acc, seat) => acc + seat.precio, 0);
  const serviceFee = basePrice * 0.15; // 15% service fee
  const PARKING_FEE = 350;
  const extrasTotal = parkingCount * PARKING_FEE;
  const grandTotal = basePrice + serviceFee + extrasTotal;

  // Mock Payment Function
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const orderId = await createMockOrder(seats, eventData?.id || '');
      
      // Cleanup session storage
      sessionStorage.removeItem('stagefront_seats');

      // Redirect to success
      router.push(`/success?order_id=${orderId}`);
    } catch (error) {
      console.error(error);
      alert('Hubo un error procesando el pago.');
      setIsProcessing(false);
    }
  };

  const shortDate = eventData?.date
    ? new Intl.DateTimeFormat('es-MX', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(eventData.date))
    : '...';
  const shortTime = eventData?.date
    ? new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(eventData.date))
    : '...';

  return (
    <div className="bg-zinc-950 text-white antialiased min-h-screen flex flex-col">
      {/* Top Banner (Urgency) */}
      <header className="w-full bg-black border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="border-b-2 border-cyan-400 pb-1">
          <h1 className="font-headline-lg text-headline-lg text-white">CHECKOUT</h1>
        </div>
        <div className="flex items-center gap-2 text-red-400 font-label-caps text-label-caps">
          <span className="material-symbols-outlined text-[18px]">timer</span>
          <span>Tiempo restante {formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column (65%) */}
        <div className="lg:col-span-8 flex flex-col gap-stack-md">
          {/* Card 1: Delivery */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
            <h2 className="font-headline-md text-headline-md mb-6">ENTREGA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-zinc-400">País</label>
                <select className="bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-cyan-400 focus:ring-0 focus:outline-none appearance-none">
                  <option>México</option>
                  <option>Estados Unidos</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className="font-label-caps text-label-caps text-zinc-400">Estado</label>
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-cyan-400 focus:outline-none flex justify-between items-center"
                  >
                    <span>{selectedState || 'Selecciona un estado'}</span>
                    <span className="material-symbols-outlined text-zinc-400">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="absolute left-0 top-full mt-2 w-full max-h-60 overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-lg z-50 shadow-2xl">
                      {ESTADOS_MEXICO.map((estado) => (
                        <li
                          key={estado}
                          onClick={() => {
                            setSelectedState(estado);
                            setIsOpen(false);
                          }}
                          className="px-4 py-3 cursor-pointer text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {estado}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-white/10 rounded-lg bg-black/20">
              <span className="material-symbols-outlined text-cyan-400">smartphone</span>
              <div className="flex-grow">
                <h3 className="font-body-lg text-body-lg mb-1">Boleto digital</h3>
                <p className="font-body-md text-body-md text-zinc-400">Accede a tus boletos directamente desde tu dispositivo móvil.</p>
              </div>
              <span className="font-label-caps text-label-caps text-cyan-400">GRATIS</span>
            </div>
          </section>

          {/* Card 2: Extras */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
            <h2 className="font-headline-md text-headline-md mb-6">EXTRAS</h2>
            <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-black/20 hover:border-white/20 transition-all">
              <div>
                <h3 className="font-body-lg text-body-lg mb-1">Pase de Estacionamiento</h3>
                <p className="font-body-md text-body-md text-zinc-400">${PARKING_FEE.toFixed(2)} MXN c/u</p>
              </div>
              <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-2 border border-white/10">
                <button
                  type="button"
                  onClick={() => setParkingCount((c) => Math.max(0, c - 1))}
                  className="text-zinc-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <span className="font-body-md text-body-md font-bold">{parkingCount}</span>
                <button
                  type="button"
                  onClick={() => setParkingCount((c) => c + 1)}
                  className="text-zinc-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
            </div>
          </section>

          {/* Card 3: Payment */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
            <h2 className="font-headline-md text-headline-md mb-6">MÉTODO DE PAGO</h2>
            <form id="payment-form" onSubmit={handlePayment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-zinc-400">Número de Tarjeta</label>
                <div className="relative">
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 pl-12 text-white focus:border-cyan-400 focus:ring-0 focus:outline-none"
                    placeholder="0000 0000 0000 0000"
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 top-3.5 text-zinc-400">credit_card</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-label-caps text-zinc-400">Vencimiento</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-cyan-400 focus:ring-0 focus:outline-none"
                    placeholder="MM/YY"
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-label-caps text-zinc-400">CVC</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-cyan-400 focus:ring-0 focus:outline-none"
                    placeholder="123"
                    type="password"
                    value={cvc}
                    onChange={handleCvcChange}
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column (35% Sticky) */}
        <div className="lg:col-span-4 flex flex-col gap-stack-md relative">
          <div className="sticky top-24 flex flex-col gap-stack-md">
            {/* Card 1: Event Details */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex gap-4">
              <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 relative">
                {eventData?.image_url && (
                  <Image
                    src={eventData.image_url}
                    alt={eventData.title}
                    fill
                    className="object-cover opacity-80"
                    unoptimized
                  />
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-headline-md text-headline-md mb-2">{eventData?.title || 'Cargando evento...'}</h3>
                <p className="font-body-md text-body-md text-zinc-400 mb-1">
                  <span className="material-symbols-outlined text-[16px] align-middle mr-1">calendar_today</span> {shortDate}
                </p>
                <p className="font-body-md text-body-md text-zinc-400 mb-1">
                  <span className="material-symbols-outlined text-[16px] align-middle mr-1">schedule</span> {shortTime} HRS
                </p>
                <p className="font-body-md text-body-md text-zinc-400">
                  <span className="material-symbols-outlined text-[16px] align-middle mr-1">location_on</span> {eventData?.venue || '...'}, {eventData?.city || '...'}
                </p>
              </div>
            </section>

            {/* Card 2: Summary */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
              <h2 className="font-headline-md text-headline-md mb-6">TOTAL</h2>
              <div className="flex flex-col gap-4 mb-6 font-body-md text-body-md">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Boletos ({seats.length})</span>
                  <span>${basePrice.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cargos por servicio</span>
                  <span>${serviceFee.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Extras (Estacionamiento)</span>
                  <span>${extrasTotal.toFixed(2)} MXN</span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-6 mb-8 flex justify-between items-center">
                <span className="font-headline-md text-headline-md text-zinc-400">Total</span>
                <span className="font-headline-lg text-headline-lg">${grandTotal.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                form="payment-form"
                disabled={isProcessing || seats.length === 0}
                className={`w-full font-label-caps text-label-caps py-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isProcessing
                    ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    PROCESANDO...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">lock</span>
                    PROCEDER AL PAGO
                  </>
                )}
              </button>
              <p className="text-center font-body-md text-zinc-500 text-[12px] mt-4 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified_user</span> Transacción segura
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full py-16 px-8 flex flex-col md:flex-row justify-between items-center gap-8 bg-zinc-950 border-t border-zinc-800">
        <div className="text-lg font-black text-white">StageFront</div>
        <div className="flex flex-wrap gap-6 justify-center">
          <Link href="/privacy" className="font-label-caps text-label-caps text-zinc-400 hover:text-white transition-colors duration-200">Política de Privacidad</Link>
          <Link href="/terms" className="font-label-caps text-label-caps text-zinc-400 hover:text-white transition-colors duration-200">Términos de Servicio</Link>
          <Link href="/security" className="font-label-caps text-label-caps text-zinc-400 hover:text-white transition-colors duration-200">Seguridad</Link>
          <Link href="/help" className="font-label-caps text-label-caps text-zinc-400 hover:text-white transition-colors duration-200">Centro de Ayuda</Link>
        </div>
        <div className="font-label-caps text-label-caps text-zinc-400">© 2026 StageFront. Acceso de Alta Fidelidad.</div>
      </footer>
    </div>
  );
}
