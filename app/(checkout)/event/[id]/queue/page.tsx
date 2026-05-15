'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';
import { logEvent } from '@/lib/services/logger';

// 🔑 Dev-only master OTP code (bypasses real verification)
const DEV_MASTER_CODE = '741963';
const DEV_FAST_CODE = '111222';
const IS_DEV = process.env.NODE_ENV === 'development';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mask an email: j**********5@gmail.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

/** Generate a fake UUID-style queue ID */
function generateQueueId(): string {
  const hex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

export default function VirtualQueuePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  // Queue state
  const [isQueued, setIsQueued] = useState(false);

  // Active queue state — powered by queue-engine
  const [isInActiveQueue, setIsInActiveQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [initialQueuePosition, setInitialQueuePosition] = useState(0);
  const [queueId, setQueueId] = useState('');

  // Batch cycle state
  const [batchNumber, setBatchNumber] = useState(0);
  const [currentK, setCurrentK] = useState(150);
  const [cycleCountdown, setCycleCountdown] = useState(60);
  const [healthStatus, setHealthStatus] = useState<'optimal' | 'degraded' | 'critical'>('optimal');
  const [statusMessage, setStatusMessage] = useState('');
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [estimatedWaitSeconds, setEstimatedWaitSeconds] = useState(0);
  const [lastBatchSize, setLastBatchSize] = useState(0);
  const [isAdmitted, setIsAdmitted] = useState(false);

  // Event data (fetched dynamically)
  const [eventData, setEventData] = useState<{
    title: string;
    venue: string;
    city: string;
    date: string;
    image_url: string | null;
    artists?: { name: string; image_url: string | null };
  } | null>(null);

  // OTP / Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch event data + session on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [eventRes, sessionRes] = await Promise.all([
          fetch(`/api/events/${params.id}`),
          fetch('/api/session'),
        ]);
        if (eventRes.ok) {
          const ev = await eventRes.json();
          setEventData(ev);
        }
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session?.email) setUserEmail(session.email);
        }
      } catch { /* silently ignore */ }
    }
    loadData();
  }, [params.id]);

  // Format date helper
  const formattedDate = eventData?.date
    ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(eventData.date))
    : '';
  const formattedTime = eventData?.date
    ? new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(eventData.date))
    : '';

  // ------ Step 1: Send OTP & show modal ------
  const handleJoinQueue = useCallback(async () => {
    if (isSending || isQueued) return;
    setAuthError(null);
    setIsSending(true);

    try {
      if (!userEmail) {
        setAuthError('Debes iniciar sesión para continuar.');
        setIsSending(false);
        return;
      }

      // In dev mode, skip the real API call and just show the modal
      if (IS_DEV) {
        console.log(`[DEV] Código maestro OTP: ${DEV_MASTER_CODE}`);
        setShowAuthModal(true);
      } else {
        const { error } = await insforge.auth.resendVerificationEmail({
          email: userEmail,
        });

        if (error) {
          setAuthError(error.message || 'No se pudo enviar el código.');
          setIsSending(false);
          return;
        }

        setShowAuthModal(true);
      }
    } catch {
      setAuthError('Error de red. Intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  }, [isSending, isQueued, userEmail]);

  // ------ Step 2: Verify OTP code ------
  const handleVerifyCode = useCallback(async () => {
    if (isVerifying || !userEmail) return;
    setAuthError(null);
    setIsVerifying(true);

    try {
      // Dev bypass: accept master code without calling the API
      const isDevBypass = IS_DEV && otpCode === DEV_MASTER_CODE;
      const isFastBypass = IS_DEV && otpCode === DEV_FAST_CODE;

      if (!isDevBypass && !isFastBypass) {
        const { error } = await insforge.auth.verifyEmail({
          email: userEmail,
          otp: otpCode,
        });

        if (error) {
          await logEvent(null, "OTP_FAILED", `OTP verification failed for ${userEmail}: ${error.message}`);
          setAuthError(error.message || 'Código inválido.');
          setIsVerifying(false);
          return;
        }
      }

      // Success → close modal & join queue via engine
      setShowAuthModal(false);
      setIsQueued(true);
      setQueueId(generateQueueId());

      try {
        const res = await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', eventId: params.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setQueuePosition(data.position);
          setInitialQueuePosition(data.position);
          setBatchNumber(data.batchNumber);
          setCurrentK(data.cycleState?.currentK ?? 150);
          setCycleCountdown(data.cycleState?.secondsUntilNextCycle ?? 60);
          setHealthStatus(data.cycleState?.healthStatus ?? 'optimal');
          setStatusMessage(data.statusMessage);
          setTotalInQueue(data.totalInQueue);
          setEstimatedWaitSeconds(data.estimatedWaitSeconds);
          setLastBatchSize(data.cycleState?.lastBatchSize ?? 0);
        } else {
          // Fallback: simulated position
          const pos = isFastBypass ? Math.floor(Math.random() * 50) + 1 : Math.floor(Math.random() * 1000) + 1;
          setQueuePosition(pos);
          setInitialQueuePosition(pos);
        }
      } catch {
        const pos = Math.floor(Math.random() * 500) + 1;
        setQueuePosition(pos);
        setInitialQueuePosition(pos);
      }

      setIsInActiveQueue(true);
    } catch {
      setAuthError('Error de red. Intenta de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, userEmail, otpCode]);

  // ------ Resend OTP ------
  const handleResendCode = useCallback(async () => {
    if (isSending || !userEmail) return;
    setAuthError(null);
    setIsSending(true);
    try {
      await insforge.auth.resendVerificationEmail({ email: userEmail });
    } catch { /* ignore */ }
    setIsSending(false);
  }, [isSending, userEmail]);

  // ------ Batch Cycle polling & countdown ------
  useEffect(() => {
    if (!isInActiveQueue || isAdmitted) return;

    // Poll queue status every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', eventId: params.id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.admitted) {
            setIsAdmitted(true);
            setQueuePosition(0);
            setStatusMessage(data.statusMessage);
            return;
          }
          setQueuePosition(data.position);
          setBatchNumber(data.batchNumber);
          setCurrentK(data.cycleState?.currentK ?? currentK);
          setCycleCountdown(data.cycleState?.secondsUntilNextCycle ?? 60);
          setHealthStatus(data.cycleState?.healthStatus ?? 'optimal');
          setStatusMessage(data.statusMessage);
          setTotalInQueue(data.totalInQueue);
          setEstimatedWaitSeconds(data.estimatedWaitSeconds);
          setLastBatchSize(data.cycleState?.lastBatchSize ?? 0);
        }
      } catch { /* silently retry on next interval */ }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isInActiveQueue, isAdmitted, params.id]);

  // Local countdown timer (ticks every second)
  useEffect(() => {
    if (!isInActiveQueue || isAdmitted) return;

    const ticker = setInterval(() => {
      setCycleCountdown((prev) => {
        if (prev <= 1) {
          // Trigger a cycle execution (in a real app, a cron/serverless function would do this)
          fetch('/api/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'cycle', eventId: params.id }),
          }).catch(() => {});
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [isInActiveQueue, isAdmitted, params.id]);

  // ------ Redirect when admitted ------
  useEffect(() => {
    if (isAdmitted || (isInActiveQueue && queuePosition === 0)) {
      const timeout = setTimeout(() => {
        router.push(`/event/${params.id}/seats`);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isAdmitted, isInActiveQueue, queuePosition, params.id, router]);

  // Progress percentage
  const progressPercent = initialQueuePosition > 0
    ? Math.min(((initialQueuePosition - queuePosition) / initialQueuePosition) * 100, 100)
    : 0;

  // Cycle countdown progress (for the ring)
  const cycleProgressPercent = (cycleCountdown / 60) * 100;

  return (
    <>
      {/* TopNavBar (Hidden on Mobile, Visible on md+) */}
      <nav className="hidden md:flex fixed top-0 w-full z-50 justify-between items-center px-6 py-4 bg-zinc-950/50 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tighter text-white font-headline-lg"
          >
            StageFront
          </Link>
          <div className="flex gap-8">
            <Link
              href="/events"
              className="text-zinc-400 hover:text-white transition-colors duration-300 px-3 py-2 rounded-lg font-headline-md text-sm hover:bg-white/5 active:scale-90"
            >
              Eventos
            </Link>
            <Link
              href="/marketplace"
              className="text-zinc-400 hover:text-white transition-colors duration-300 px-3 py-2 rounded-lg font-headline-md text-sm hover:bg-white/5 active:scale-90"
            >
              Mercado
            </Link>
            <Link
              href="/wallet"
              className="text-zinc-400 hover:text-white transition-colors duration-300 px-3 py-2 rounded-lg font-headline-md text-sm hover:bg-white/5 active:scale-90"
            >
              Billetera
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4 text-white">
          <button className="hover:bg-white/5 transition-all duration-300 p-2 rounded-full active:scale-90">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hover:bg-white/5 transition-all duration-300 p-2 rounded-full active:scale-90">
            <span className="material-symbols-outlined">person</span>
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-20 pb-32 md:pb-gutter flex flex-col relative">
        {/* Background Atmospheric Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* Event Header Section */}
        <section className="relative w-full overflow-hidden flex flex-col items-center text-center pt-16 pb-12 z-10">
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
            {eventData?.image_url && (
              <Image
                src={eventData.image_url}
                alt={eventData.title}
                unoptimized
                fill
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>

          <div className="relative z-10 max-w-container-max mx-auto px-gutter mt-stack-md">
            {/* Active waiting room badge */}
            <div className="inline-flex items-center justify-center bg-surface-container-highest/80 backdrop-blur-md border border-outline-variant/30 rounded-full px-4 py-1.5 mb-6 shadow-[0_0_12px_rgba(255,255,255,0.05)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
              <span className="font-label-caps text-label-caps text-on-surface">
                SALA DE ESPERA ACTIVA
              </span>
            </div>

            <h1 className="font-display-xl text-display-xl text-on-surface uppercase drop-shadow-2xl">
              {eventData?.title ?? 'Cargando evento...'}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-stack-sm font-body-lg text-body-lg text-on-surface-variant">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  calendar_today
                </span>
                {formattedDate || '...'}
              </span>
              <span className="hidden sm:inline opacity-50">•</span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  schedule
                </span>
                {formattedTime ? `${formattedTime} HRS` : '...'}
              </span>
              <span className="hidden sm:inline opacity-50">•</span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  location_on
                </span>
                {eventData?.venue ?? '...'}
              </span>
            </div>
          </div>
        </section>

        {/* Progress Stepper */}
        <section className="w-full max-w-4xl mx-auto px-gutter mb-stack-lg z-10 relative">
          <div className="relative">
            {/* Background line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -translate-y-1/2 z-0" />
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 w-[66%] h-[2px] bg-primary shadow-[0_0_10px_rgba(255,255,255,0.5)] -translate-y-1/2 z-0" />

            <div className="relative z-10 flex justify-between">
              {/* Step 1 – Lobby */}
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                <span className="font-label-caps text-label-caps text-on-surface opacity-70">
                  Lobby
                </span>
              </div>
              {/* Step 2 – Sala de Espera */}
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                <span className="font-label-caps text-label-caps text-on-surface opacity-70">
                  Sala de Espera
                </span>
              </div>
              {/* Step 3 – Fila Virtual (Active) */}
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-background shadow-[0_0_15px_rgba(255,255,255,0.8)] relative">
                  <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
                </div>
                <span className="font-label-caps text-label-caps text-primary shadow-sm">
                  Fila Virtual
                </span>
              </div>
              {/* Step 4 – Selecciona tus Asientos */}
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-4 h-4 rounded-full bg-surface-container-high ring-4 ring-background" />
                <span className="font-label-caps text-label-caps text-on-surface-variant opacity-50 text-center">
                  Selecciona tus
                  <br />
                  Asientos
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Conditional: Static CTA vs Active Queue ===== */}
        {!isInActiveQueue ? (
          <>
            {/* Main CTA Card */}
            <section className="w-full max-w-3xl mx-auto px-gutter z-10 relative">
              <div className="bg-surface-container-high/40 backdrop-blur-[40px] border border-outline-variant/30 rounded-xl p-stack-lg flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm tracking-tight">
                  BOLETOS YA A LA VENTA EN ESTE MOMENTO
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto mb-stack-md">
                  Para comprar boletos, por favor incorpórate a la Fila Virtual
                  donde te proporcionaremos información adicional y te asignaremos
                  un turno.
                </p>

                <button
                  id="join-queue-btn"
                  onClick={handleJoinQueue}
                  disabled={isQueued || isSending}
                  className={`font-label-caps text-label-caps px-8 py-4 rounded-full transition-all duration-300 transform flex items-center gap-2 ${
                    isQueued || isSending
                      ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed scale-100'
                      : 'bg-primary text-on-primary hover:bg-surface-tint hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
                  }`}
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando código...
                    </>
                  ) : (
                    <>
                      Únete a la Fila Virtual
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
                {authError && !showAuthModal && (
                  <p className="mt-4 font-body-md text-sm text-error">{authError}</p>
                )}
              </div>
            </section>

            {/* Info Card */}
            <section className="w-full max-w-3xl mx-auto px-gutter mt-stack-md z-10 relative">
              <div className="bg-surface-container-lowest/60 border border-outline-variant/20 rounded-lg p-6 flex gap-4 backdrop-blur-md items-start">
                <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                <div>
                  <h3 className="font-label-caps text-label-caps text-on-surface mb-2">Recomendaciones Importantes</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Tu posición en la fila se asignará de manera automática. No
                    refresques esta página o perderás tu lugar. Asegúrate de tener
                    una conexión a internet estable.
                  </p>
                </div>
              </div>
            </section>

            {/* Advice Grid */}
            <section className="w-full max-w-5xl mx-auto px-gutter mt-stack-lg z-10 relative">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 flex flex-col items-center text-center gap-3 hover:bg-surface-container transition-colors">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface text-[24px]">person</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md text-on-surface text-lg">Verifica tu Cuenta</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Inicia sesión con anticipación para un proceso más rápido.</p>
                </div>
                <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 flex flex-col items-center text-center gap-3 hover:bg-surface-container transition-colors">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface text-[24px]">smartphone</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md text-on-surface text-lg">Mantén tu teléfono cerca</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Podríamos requerir verificación mediante SMS.</p>
                </div>
                <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 flex flex-col items-center text-center gap-3 hover:bg-surface-container transition-colors">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface text-[24px]">credit_card</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md text-on-surface text-lg">Prepara tu método de pago</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Ten a la mano tu tarjeta de crédito o débito.</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* ============ Active Queue Card (Glassmorphism + Batch Cycles) ============ */}
            <section className="w-full max-w-2xl mx-auto px-gutter z-10 relative">
              <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                {/* Inner subtle glow for depth */}
                <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[60px] pointer-events-none transition-all duration-700 ${
                  healthStatus === 'critical' ? 'bg-red-500/10' :
                  healthStatus === 'degraded' ? 'bg-amber-500/10' :
                  'bg-surface-tint/10 group-hover:bg-surface-tint/20'
                }`} />

                {/* Health Status Badge */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${
                    healthStatus === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    healthStatus === 'degraded' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      healthStatus === 'critical' ? 'bg-red-400 animate-pulse' :
                      healthStatus === 'degraded' ? 'bg-amber-400 animate-pulse' :
                      'bg-emerald-400'
                    }`} />
                    {healthStatus === 'critical' ? 'Alta demanda' :
                     healthStatus === 'degraded' ? 'Optimizando' :
                     'Sistema óptimo'}
                  </div>
                </div>

                {/* Title */}
                <h1 className="font-headline-lg text-headline-lg text-primary text-center tracking-tight mb-2">
                  {queuePosition === 0 ? '¡ES TU TURNO!' : 'YA ESTÁS EN LA FILA VIRTUAL'}
                </h1>

                {/* Batch group indicator */}
                {queuePosition > 0 && (
                  <p className="text-center font-label-caps text-label-caps text-on-surface-variant/70 tracking-widest mb-6">
                    GRUPO #{batchNumber} • LOTE DE {currentK} USUARIOS
                  </p>
                )}

                {/* Giant Counter */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="font-display-xl text-[96px] md:text-[144px] leading-none text-primary drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tighter transition-all duration-500">
                    {queuePosition}
                  </div>
                  <div className="font-label-caps text-label-caps text-on-surface-variant tracking-[0.3em] mt-4 uppercase">
                    {queuePosition === 0 ? 'Redirigiendo...' : 'Personas delante de ti'}
                  </div>
                </div>

                {/* ─── Cycle Countdown Section ─── */}
                {queuePosition > 0 && (
                  <div className="mt-8 mb-6">
                    {/* Status message — the key user feedback */}
                    <div className={`text-center py-3 px-6 rounded-xl border backdrop-blur-md mb-6 ${
                      healthStatus === 'critical' ? 'bg-red-500/5 border-red-500/10 text-red-300' :
                      healthStatus === 'degraded' ? 'bg-amber-500/5 border-amber-500/10 text-amber-300' :
                      'bg-white/[0.03] border-white/5 text-on-surface-variant'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`material-symbols-outlined text-[18px] ${
                          healthStatus === 'critical' ? 'text-red-400' :
                          healthStatus === 'degraded' ? 'text-amber-400' :
                          'text-primary'
                        }`}>
                          {healthStatus === 'critical' ? 'warning' :
                           healthStatus === 'degraded' ? 'speed' :
                           'rocket_launch'}
                        </span>
                        <p className="font-body-md text-sm">{statusMessage}</p>
                      </div>
                    </div>

                    {/* Cycle countdown with visual ring */}
                    <div className="flex items-center justify-center gap-8">
                      {/* Circular countdown */}
                      <div className="relative w-20 h-20">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                          <circle
                            cx="50" cy="50" r="42" fill="none" strokeWidth="3" strokeLinecap="round"
                            className={`transition-all duration-1000 ${
                              cycleCountdown > 30 ? 'stroke-emerald-400' :
                              cycleCountdown > 10 ? 'stroke-amber-400' :
                              'stroke-red-400'
                            }`}
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset={`${2 * Math.PI * 42 * (1 - cycleProgressPercent / 100)}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`font-mono text-xl font-bold tabular-nums ${
                            cycleCountdown > 30 ? 'text-emerald-400' :
                            cycleCountdown > 10 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>{cycleCountdown}</span>
                          <span className="text-[8px] text-on-surface-variant uppercase tracking-wider">seg</span>
                        </div>
                      </div>

                      {/* Cycle stats */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">En fila</div>
                          <div className="font-headline-md text-lg text-primary">{totalInQueue}</div>
                        </div>
                        <div>
                          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">Cap. (K)</div>
                          <div className="font-headline-md text-lg text-primary">{currentK}</div>
                        </div>
                        <div>
                          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">Último lote</div>
                          <div className="font-headline-md text-lg text-primary">{lastBatchSize}</div>
                        </div>
                        <div>
                          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">Est. espera</div>
                          <div className="font-headline-md text-lg text-primary">
                            {estimatedWaitSeconds > 60 ? `${Math.ceil(estimatedWaitSeconds / 60)}m` : `${estimatedWaitSeconds}s`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Progress Bar */}
                <div className="w-full mt-6 mb-8 relative">
                  {/* Track */}
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    {/* Fill */}
                    <div
                      className="h-full bg-gradient-to-r from-surface-tint to-primary rounded-full relative shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {/* Thumb positioned at end of fill */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center border-2 border-background z-10 transition-all duration-700 ease-out"
                    style={{ left: `${progressPercent}%` }}
                  >
                    <span className="text-background font-bold text-[10px] font-headline-md">S</span>
                  </div>
                </div>

                {/* Queue ID */}
                <div className="border-t border-white/5 pt-6">
                  <p className="font-body-md text-body-md text-on-surface-variant/60 text-center text-[13px] tracking-wide font-mono">
                    ID DE FILA VIRTUAL: {queueId}
                  </p>
                </div>
              </div>
            </section>

            {/* Informational text below card */}
            <p className="mt-8 text-center text-on-surface-variant/70 max-w-md mx-auto font-body-md text-body-md text-[14px] z-10 relative">
              Tu posición se actualiza automáticamente con cada ciclo de desfogue. No actualices esta página.
            </p>
          </>
        )}
      </main>

      {/* BottomNavBar (Visible on Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-zinc-950/80 backdrop-blur-2xl rounded-t-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 font-headline-md text-[10px] uppercase tracking-widest transition-all"
        >
          <span className="material-symbols-outlined mb-1">explore</span>
          <span>Explore</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 font-headline-md text-[10px] uppercase tracking-widest transition-all"
        >
          <span className="material-symbols-outlined mb-1">
            confirmation_number
          </span>
          <span>Tickets</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-white bg-white/10 rounded-xl px-4 py-1 font-headline-md text-[10px] uppercase tracking-widest transition-all"
        >
          <span
            className="material-symbols-outlined mb-1"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            hourglass_empty
          </span>
          <span>Queue</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 font-headline-md text-[10px] uppercase tracking-widest transition-all"
        >
          <span className="material-symbols-outlined mb-1">person</span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* ============ OTP Authentication Modal ============ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_200ms_ease-out]">
          <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur-[40px] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            {/* Subtle glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="font-headline-md text-headline-md text-primary">Autentica tu cuenta</h2>
              <button
                aria-label="Cerrar modal"
                onClick={() => { setShowAuthModal(false); setOtpCode(''); setAuthError(null); }}
                className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-6">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Tu código de autenticación ha sido enviado a{' '}
                <span className="text-primary font-semibold">
                  {userEmail ? maskEmail(userEmail) : '...'}
                </span>. Introduce tu código a continuación para continuar.
              </p>

              {/* OTP Input */}
              <div className="relative group">
                <input
                  aria-label="Código de autenticación"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 font-headline-md text-headline-md text-center text-primary tracking-[0.5em] focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/30 outline-none"
                  maxLength={6}
                  placeholder="••••••"
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(val);
                    setAuthError(null);
                  }}
                  autoFocus
                />
              </div>

              {/* Error message */}
              {authError && (
                <p className="font-body-md text-sm text-error text-center -mt-2">{authError}</p>
              )}

              {/* Resend */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={handleResendCode}
                  disabled={isSending}
                  className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary underline decoration-white/20 underline-offset-4 transition-colors disabled:opacity-50"
                  type="button"
                >
                  {isSending ? 'Enviando...' : 'Solicita un nuevo código'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 p-6 bg-white/[0.02] border-t border-white/5">
              <button
                className="px-6 py-3 rounded-lg font-body-md text-body-md font-medium text-on-surface hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                type="button"
                onClick={() => { setShowAuthModal(false); setOtpCode(''); setAuthError(null); }}
              >
                Cancelar
              </button>
              <button
                className="px-6 py-3 rounded-lg bg-primary text-background font-body-md text-body-md font-semibold hover:bg-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                type="button"
                onClick={handleVerifyCode}
                disabled={otpCode.length < 6 || isVerifying}
              >
                {isVerifying && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isVerifying ? 'Verificando...' : 'Confirma código'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
