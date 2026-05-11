'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useIntegrityFilter } from '@/hooks/useIntegrityFilter';
import { useSeatGraph } from '@/hooks/useSeatGraph';
import type { SeatNode } from '@/lib/graph/SeatGraph';

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

interface SelectedSeat {
  id: string;
  zona: string;
  label: string;
  tipo: string;
  precio: number;
  color: string;
}

/** Simulated zone data for the stadium map */
const ZONES = [
  { id: 'vip-l', zona: 'VIP L', label: 'Fila A, Asiento', tipo: 'Admisión General VIP', precio: 500, color: '#c084fc', maxSeats: 4 },
  { id: 'vip-r', zona: 'VIP R', label: 'Fila A, Asiento', tipo: 'Admisión General VIP', precio: 500, color: '#c084fc', maxSeats: 4 },
  { id: 'general-a', zona: 'General A', label: 'Fila B, Asiento', tipo: 'Admisión General', precio: 250, color: '#a3defe', maxSeats: 6 },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SeatSelectionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [scale, setScale] = useState(1);

  // Integrity Filter — bot detection
  const integrity = useIntegrityFilter();
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [integrityVerdict, setIntegrityVerdict] = useState<'human' | 'suspect' | 'bot'>('human');
  const [integrityOtp, setIntegrityOtp] = useState('');
  const [integrityOtpError, setIntegrityOtpError] = useState('');

  // Seat Graph — adjacency matrix for orphan detection
  const seatGraph = useSeatGraph();

  const handleZoomIn = useCallback(() => setScale((s) => Math.min(s + 0.2, 3)), []);
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(s - 0.2, 0.5)), []);
  const handleReset = useCallback(() => setScale(1), []);

  // Event data (fetched dynamically)
  const [eventData, setEventData] = useState<{
    title: string;
    venue: string;
    city: string;
    date: string;
    image_url: string | null;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((ev) => { if (ev) setEventData(ev); })
      .catch(() => {});
  }, [params.id]);

  const shortDate = eventData?.date
    ? new Intl.DateTimeFormat('es-MX', { month: 'short', day: 'numeric' }).format(new Date(eventData.date))
    : '...';

  // Counter per zone to generate unique seat IDs
  const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({});

  const toggleZone = useCallback((zone: typeof ZONES[number]) => {
    setSelectedSeats((prev) => {
      const existing = prev.find((s) => s.zona === zone.zona);
      if (existing) {
        // Remove all seats from this zone
        return prev.filter((s) => s.zona !== zone.zona);
      }
      // Add a seat to this zone
      const count = (zoneCounts[zone.id] || 0) + 1;
      setZoneCounts((c) => ({ ...c, [zone.id]: count }));
      return [
        ...prev,
        {
          id: `${zone.id}-${count}`,
          zona: zone.zona,
          label: `${zone.label} ${count}`,
          tipo: zone.tipo,
          precio: zone.precio,
          color: zone.color,
        },
      ];
    });
  }, [zoneCounts]);

  const addSeatToZone = useCallback((zone: typeof ZONES[number]) => {
    const currentCount = selectedSeats.filter((s) => s.zona === zone.zona).length;
    if (currentCount >= zone.maxSeats) return; // max reached
    const seatNum = currentCount + 1;
    setSelectedSeats((prev) => [
      ...prev,
      {
        id: `${zone.id}-${Date.now()}`,
        zona: zone.zona,
        label: `${zone.label} ${seatNum}`,
        tipo: zone.tipo,
        precio: zone.precio,
        color: zone.color,
      },
    ]);
  }, [selectedSeats]);

  // ─── Graph seat toggle (individual seat-level clicks) ───
  const handleSeatToggle = useCallback((zoneId: string, row: number, col: number) => {
    const seatId = `${zoneId}-${row}-${col}`;
    const zone = ZONES.find((z) => z.id === zoneId);
    if (!zone) return;

    const currentStatus = seatGraph.getZoneSeats(zoneId).find(
      (s) => s.id === seatId
    )?.status;

    if (currentStatus === 'selected') {
      // Deselect from graph
      seatGraph.deselectSeat(seatId);
      // Remove from local state
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
    } else if (currentStatus === 'available') {
      // Select in graph
      seatGraph.selectSeat(zoneId, row, col);
      // Add to local state
      const label = `Fila ${String.fromCharCode(65 + row)}, Asiento ${col + 1}`;
      setSelectedSeats((prev) => [
        ...prev,
        {
          id: seatId,
          zona: zone.zona,
          label,
          tipo: zone.tipo,
          precio: zone.precio,
          color: zone.color,
        },
      ]);
    }
  }, [seatGraph]);

  const removeSeat = useCallback((seatId: string) => {
    seatGraph.deselectSeat(seatId);
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  }, [seatGraph]);

  const clearAll = useCallback(() => {
    seatGraph.clearSelections();
    setSelectedSeats([]);
  }, [seatGraph]);

  const total = selectedSeats.reduce((sum, s) => sum + s.precio, 0);

  const handleCheckout = useCallback(async () => {
    if (selectedSeats.length === 0) return;

    // ─── Integrity Check (bot detection) ───
    const result = await integrity.validate();

    if (result.verdict === 'bot') {
      // Hard block — mostrar modal de rechazo
      setIntegrityVerdict('bot');
      setShowIntegrityModal(true);
      return;
    }

    if (result.verdict === 'suspect') {
      // Soft block — pedir OTP de verificación extra
      setIntegrityVerdict('suspect');
      setShowIntegrityModal(true);
      return;
    }

    // ─── Human verified — continuar al checkout ───
    proceedToCheckout();
  }, [selectedSeats, integrity]);

  const proceedToCheckout = useCallback(() => {
    sessionStorage.setItem('stagefront_seats', JSON.stringify(selectedSeats));
    if (params.id) sessionStorage.setItem('stagefront_event_id', params.id);
    router.push(`/payment/${selectedSeats[0].id}`);
  }, [selectedSeats, router, params.id]);

  const handleIntegrityOtpSubmit = useCallback(() => {
    // Simular verificación OTP (en producción, validar contra servidor)
    if (integrityOtp.length >= 4) {
      setShowIntegrityModal(false);
      setIntegrityOtp('');
      setIntegrityOtpError('');
      proceedToCheckout();
    } else {
      setIntegrityOtpError('Código de verificación inválido');
    }
  }, [integrityOtp, proceedToCheckout]);

  const isZoneSelected = (zoneId: string) =>
    selectedSeats.some((s) => s.id.startsWith(zoneId));

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-on-background">
      {/* ============ Top Event Banner ============ */}
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant/30 flex-shrink-0 z-20 relative">
        <div className="flex items-center justify-between px-gutter py-stack-sm h-20">
          <div className="flex items-center gap-stack-md">
            <Link
              href={`/event/${params.id}/queue`}
              className="text-on-surface hover:text-primary transition-colors flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/5"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="flex items-center gap-stack-sm">
              {/* Artist avatar */}
              <div className="w-12 h-12 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-on-surface-variant">groups</span>
              </div>
              <div>
                <h1 className="font-headline-md text-headline-md text-primary">{eventData?.title ?? 'Cargando...'}</h1>
                <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  <span>{shortDate}</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant" />
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span>{eventData?.venue ?? '...'}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Info pill (desktop) */}
          <div className="hidden md:flex items-center">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Información Importante: Límite de edad...</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============ Main Workspace ============ */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ---- Left: Map Area ---- */}
        <section className="flex-1 relative bg-surface overflow-hidden flex items-center justify-center">
          {/* Map Legend (Top Left) */}
          <div className="absolute top-stack-md left-stack-md z-10 bg-surface-container/40 backdrop-blur-[20px] border border-white/10 rounded-lg p-4 flex flex-col gap-3">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Simbología</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#a3defe] shadow-[0_0_12px_rgba(163,222,254,0.5)]" />
              <span className="font-body-md text-body-md text-on-surface text-sm">Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#c084fc] shadow-[0_0_12px_rgba(192,132,252,0.5)]" />
              <span className="font-body-md text-body-md text-on-surface text-sm">VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-surface-variant border border-outline-variant" />
              <span className="font-body-md text-body-md text-on-surface-variant text-sm">Ocupado</span>
            </div>
          </div>

          {/* Floating Zoom Controls (Right Edge) */}
          <div className="absolute right-stack-md top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
            <button onClick={handleZoomIn} className="bg-surface-container/40 backdrop-blur-[20px] border border-white/10 w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button onClick={handleZoomOut} className="bg-surface-container/40 backdrop-blur-[20px] border border-white/10 w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button onClick={handleReset} className="bg-surface-container/40 backdrop-blur-[20px] border border-white/10 w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors mt-2">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>

          {/* ---- Stadium Map Graphic ---- */}
          <div className="w-full h-full relative flex items-center justify-center opacity-80" style={{ transform: `scale(${scale})`, transition: 'transform 0.3s ease', transformOrigin: 'center' }}>
            <div className="relative w-[800px] h-[600px]">
              {/* Outer gradas (decorative) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-40 border-t-4 border-l-4 border-r-4 border-surface-container-high rounded-t-[400px] opacity-30" />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-32 border-t-4 border-l-4 border-r-4 border-surface-container-high rounded-t-[350px] opacity-50" />

              {/* General A — zone + individual seats */}
              <div
                className={`absolute bottom-[340px] left-1/2 -translate-x-1/2 w-[600px] h-40 rounded-t-[100px] backdrop-blur-sm transition-all duration-300 border overflow-hidden ${
                  isZoneSelected('general-a')
                    ? 'bg-[#a3defe]/15 border-[#a3defe] shadow-[0_0_20px_rgba(163,222,254,0.4)]'
                    : 'bg-[#a3defe]/5 border-[#a3defe]/30 hover:bg-[#a3defe]/10'
                }`}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2">
                  <span className="font-label-caps text-[10px] text-white/50 uppercase tracking-widest">General A — $250</span>
                </div>
                {/* Individual seat dots */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, 1fr)', padding: '28px 60px 12px' }}>
                    {seatGraph.getZoneSeats('general-a').map((seat) => {
                      const isOrphan = seatGraph.orphanAnalysis.orphanSeats.some((o) => o.id === seat.id);
                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatToggle('general-a', seat.row, seat.col)}
                          disabled={seat.status === 'occupied'}
                          title={`${seat.label} ${seat.status === 'occupied' ? '(Ocupado)' : seat.status === 'selected' ? '(Seleccionado)' : isOrphan ? '(Huérfano)' : '(Disponible)'}`}
                          className={`w-5 h-5 rounded-full transition-all duration-200 border-2 ${
                            seat.status === 'occupied'
                              ? 'bg-zinc-700/60 border-zinc-600/40 cursor-not-allowed opacity-40'
                              : seat.status === 'selected'
                              ? 'bg-[#a3defe] border-[#a3defe] shadow-[0_0_10px_rgba(163,222,254,0.8)] scale-110'
                              : isOrphan
                              ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                              : 'bg-white/10 border-white/20 hover:bg-[#a3defe]/40 hover:border-[#a3defe]/60 hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* VIP L — zone + individual seats */}
              <div
                className={`absolute bottom-48 left-[25%] w-48 h-32 rounded-lg backdrop-blur-sm transition-all duration-300 border overflow-hidden ${
                  isZoneSelected('vip-l')
                    ? 'bg-[#c084fc]/15 border-[#c084fc] shadow-[0_0_20px_rgba(192,132,252,0.5)]'
                    : 'bg-[#c084fc]/5 border-[#c084fc]/50 hover:bg-[#c084fc]/10 shadow-[0_0_12px_rgba(192,132,252,0.3)]'
                }`}
              >
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2">
                  <span className="font-label-caps text-[9px] text-white/50 uppercase tracking-widest">VIP L — $500</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', padding: '24px 16px 8px' }}>
                    {seatGraph.getZoneSeats('vip-l').map((seat) => {
                      const isOrphan = seatGraph.orphanAnalysis.orphanSeats.some((o) => o.id === seat.id);
                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatToggle('vip-l', seat.row, seat.col)}
                          disabled={seat.status === 'occupied'}
                          title={`${seat.label} ${seat.status === 'occupied' ? '(Ocupado)' : seat.status === 'selected' ? '(Seleccionado)' : isOrphan ? '(Huérfano)' : '(Disponible)'}`}
                          className={`w-5 h-5 rounded-full transition-all duration-200 border-2 ${
                            seat.status === 'occupied'
                              ? 'bg-zinc-700/60 border-zinc-600/40 cursor-not-allowed opacity-40'
                              : seat.status === 'selected'
                              ? 'bg-[#c084fc] border-[#c084fc] shadow-[0_0_10px_rgba(192,132,252,0.8)] scale-110'
                              : isOrphan
                              ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                              : 'bg-white/10 border-white/20 hover:bg-[#c084fc]/40 hover:border-[#c084fc]/60 hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* VIP R — zone + individual seats */}
              <div
                className={`absolute bottom-48 right-[25%] w-48 h-32 rounded-lg backdrop-blur-sm transition-all duration-300 border overflow-hidden ${
                  isZoneSelected('vip-r')
                    ? 'bg-[#c084fc]/15 border-[#c084fc] shadow-[0_0_20px_rgba(192,132,252,0.5)]'
                    : 'bg-[#c084fc]/5 border-[#c084fc]/50 hover:bg-[#c084fc]/10 shadow-[0_0_12px_rgba(192,132,252,0.3)]'
                }`}
              >
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2">
                  <span className="font-label-caps text-[9px] text-white/50 uppercase tracking-widest">VIP R — $500</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', padding: '24px 16px 8px' }}>
                    {seatGraph.getZoneSeats('vip-r').map((seat) => {
                      const isOrphan = seatGraph.orphanAnalysis.orphanSeats.some((o) => o.id === seat.id);
                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatToggle('vip-r', seat.row, seat.col)}
                          disabled={seat.status === 'occupied'}
                          title={`${seat.label} ${seat.status === 'occupied' ? '(Ocupado)' : seat.status === 'selected' ? '(Seleccionado)' : isOrphan ? '(Huérfano)' : '(Disponible)'}`}
                          className={`w-5 h-5 rounded-full transition-all duration-200 border-2 ${
                            seat.status === 'occupied'
                              ? 'bg-zinc-700/60 border-zinc-600/40 cursor-not-allowed opacity-40'
                              : seat.status === 'selected'
                              ? 'bg-[#c084fc] border-[#c084fc] shadow-[0_0_10px_rgba(192,132,252,0.8)] scale-110'
                              : isOrphan
                              ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                              : 'bg-white/10 border-white/20 hover:bg-[#c084fc]/40 hover:border-[#c084fc]/60 hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stage */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-32 rounded-t-[200px] bg-gradient-to-t from-surface-container-high to-surface-variant border-t-2 border-[#c084fc] flex items-center justify-center shadow-[0_-20px_60px_rgba(192,132,252,0.2)]">
                <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-widest">ESCENARIO</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Right: Sidebar (Desktop) ---- */}
        <aside className="hidden md:flex w-[400px] bg-surface-container-low border-l border-white/10 flex-col z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
          {/* Filters Header */}
          <div className="p-6 border-b border-white/5 flex flex-col gap-4">
            <h2 className="font-headline-md text-headline-md text-primary">Filtros</h2>
            <div className="grid grid-cols-3 gap-2">
              <button className="bg-white/5 backdrop-blur-md border border-white/10 py-2 px-3 rounded text-sm font-body-md text-on-surface-variant flex items-center justify-between hover:text-white transition-colors">
                Cantidad <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              <button className="bg-white/5 backdrop-blur-md border border-white/10 py-2 px-3 rounded text-sm font-body-md text-on-surface-variant flex items-center justify-between hover:text-white transition-colors">
                Precio <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              <button className="bg-white/5 backdrop-blur-md border border-white/10 py-2 px-3 rounded text-sm font-body-md text-on-surface-variant flex items-center justify-between hover:text-white transition-colors">
                Tipo <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Selected Seats List */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {selectedSeats.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                    {selectedSeats.length} {selectedSeats.length === 1 ? 'Asiento Seleccionado' : 'Asientos Seleccionados'}
                  </span>
                  <button onClick={clearAll} className="text-error text-sm font-body-md hover:underline">Limpiar</button>
                </div>

                {selectedSeats.map((seat) => (
                  <div key={seat.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: seat.color }} />
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <span className="font-label-caps text-label-caps uppercase tracking-wider block mb-1" style={{ color: seat.color }}>
                          Zona {seat.zona}
                        </span>
                        <h4 className="font-headline-md text-headline-md text-white text-lg">{seat.label}</h4>
                      </div>
                      <button onClick={() => removeSeat(seat.id)} className="text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    <div className="flex justify-between items-end pl-2 mt-2 border-t border-white/5 pt-3">
                      <span className="font-body-md text-body-md text-on-surface-variant text-sm">{seat.tipo}</span>
                      <span className="font-headline-md text-headline-md text-white">${seat.precio.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-60">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">touch_app</span>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[220px]">
                  Da clic en una zona del mapa para seleccionar tus asientos
                </p>
              </div>
            )}
          </div>

          {/* Checkout Footer */}
          <div className="p-6 bg-surface-container-highest border-t border-white/10 mt-auto">
            {/* Orphan Seat Warning */}
            {seatGraph.hasWarning && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-400 text-[20px] mt-0.5">warning</span>
                  <div className="flex-1">
                    <p className="text-amber-300 text-sm font-medium mb-1">{seatGraph.orphanAnalysis.message}</p>
                    {seatGraph.orphanAnalysis.suggestions.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2">
                        {seatGraph.orphanAnalysis.suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (s.type === 'select') {
                                const parts = s.seatId.split('-');
                                const row = parseInt(parts[parts.length - 2]);
                                const col = parseInt(parts[parts.length - 1]);
                                const zoneId = parts.slice(0, -2).join('-');
                                handleSeatToggle(zoneId, row, col);
                              } else {
                                removeSeat(s.seatId);
                              }
                            }}
                            className="text-left text-amber-400/80 text-xs hover:text-amber-300 transition-colors flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {s.type === 'select' ? 'add_circle' : 'remove_circle'}
                            </span>
                            {s.description}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={seatGraph.dismissWarning}
                      className="text-amber-400/40 text-[10px] mt-2 hover:text-amber-400/70 transition-colors"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <span className="font-body-md text-body-md text-on-surface-variant text-lg">Total</span>
              <span className="font-headline-lg text-headline-lg text-white">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={selectedSeats.length === 0}
              className={`w-full font-label-caps text-label-caps py-4 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 font-bold transition-colors ${
                selectedSeats.length > 0
                  ? 'bg-primary text-background hover:bg-white/90'
                  : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
              }`}
            >
              Continuar al Pago
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </aside>

        {/* ---- Mobile: Floating Summary / Bottom Sheet ---- */}
        <div className="md:hidden fixed bottom-0 left-0 w-full z-50">
          {/* Collapsed bar */}
          {!mobileSheetOpen && (
            <button
              onClick={() => setMobileSheetOpen(true)}
              className="w-full bg-surface-container-highest/95 backdrop-blur-2xl border-t border-white/10 px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative">
                  <span className="material-symbols-outlined text-on-surface-variant">shopping_cart</span>
                  {selectedSeats.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-background">
                      {selectedSeats.length}
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-body-md text-on-surface-variant text-xs">
                    {selectedSeats.length} {selectedSeats.length === 1 ? 'asiento' : 'asientos'}
                  </p>
                  <p className="font-headline-md text-primary text-lg font-bold">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">expand_less</span>
            </button>
          )}

          {/* Expanded sheet */}
          {mobileSheetOpen && (
            <div className="bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl max-h-[70vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.7)]">
              {/* Handle */}
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="w-full flex justify-center py-3"
              >
                <div className="w-10 h-1 rounded-full bg-on-surface-variant/40" />
              </button>

              <div className="px-6 pb-2 flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Asiento' : 'Asientos'}
                </span>
                {selectedSeats.length > 0 && (
                  <button onClick={clearAll} className="text-error text-sm font-body-md hover:underline">Limpiar</button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-3">
                {selectedSeats.length === 0 ? (
                  <p className="text-center text-on-surface-variant/60 py-8 font-body-md">
                    Da clic en una zona del mapa para seleccionar asientos
                  </p>
                ) : (
                  selectedSeats.map((seat) => (
                    <div key={seat.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-10 rounded-full" style={{ backgroundColor: seat.color }} />
                        <div>
                          <span className="font-label-caps text-[10px] uppercase tracking-wider" style={{ color: seat.color }}>{seat.zona}</span>
                          <p className="font-body-md text-white text-sm">{seat.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-headline-md text-white">${seat.precio}</span>
                        <button onClick={() => removeSeat(seat.id)} className="text-on-surface-variant hover:text-error">
                          <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout */}
              <div className="px-6 pb-6 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-body-md text-on-surface-variant">Total</span>
                  <span className="font-headline-lg text-headline-lg text-white">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={selectedSeats.length === 0}
                  className={`w-full font-label-caps text-label-caps py-4 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 font-bold transition-colors ${
                    selectedSeats.length > 0
                      ? 'bg-primary text-background hover:bg-white/90'
                      : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                  }`}
                >
                  Continuar al Pago
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* ============ Integrity Filter Modal ============ */}
      {showIntegrityModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            {integrityVerdict === 'bot' ? (
              /* ─── Hard Block: Bot Detected ─── */
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-400 text-4xl">shield</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-white mb-3">Acceso Restringido</h3>
                <p className="font-body-md text-body-md text-zinc-400 mb-6">
                  Nuestro sistema de integridad detectó un patrón de navegación automatizado.
                  Si crees que esto es un error, intenta recargar la página y navegar normalmente.
                </p>
                <div className="flex items-center gap-2 justify-center text-red-400/60 text-sm mb-6">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Score de riesgo: {integrity.score}/100</span>
                </div>
                <button
                  onClick={() => {
                    setShowIntegrityModal(false);
                    integrity.reset();
                  }}
                  className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors font-label-caps text-label-caps"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              /* ─── Soft Block: Suspect — OTP Required ─── */
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-400 text-4xl">verified_user</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-white mb-3">Verificación Adicional</h3>
                <p className="font-body-md text-body-md text-zinc-400 mb-6">
                  Para proteger tu compra, necesitamos una verificación adicional.
                  Ingresa el código enviado a tu dispositivo.
                </p>
                <div className="mb-4">
                  <input
                    type="text"
                    value={integrityOtp}
                    onChange={(e) => {
                      setIntegrityOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setIntegrityOtpError('');
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-4 px-6 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-amber-400 focus:ring-0 focus:outline-none placeholder:text-zinc-600"
                    autoFocus
                  />
                  {integrityOtpError && (
                    <p className="text-red-400 text-sm mt-2">{integrityOtpError}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 justify-center text-amber-400/60 text-sm mb-6">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  <span>Filtro de integridad activo</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowIntegrityModal(false);
                      setIntegrityOtp('');
                      setIntegrityOtpError('');
                    }}
                    className="flex-1 py-3 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors font-label-caps text-label-caps"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleIntegrityOtpSubmit}
                    disabled={integrityOtp.length < 4}
                    className={`flex-1 py-3 rounded-lg font-label-caps text-label-caps transition-colors ${
                      integrityOtp.length >= 4
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Verificar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
