"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface SecureTicketQRProps {
  ticketId: string;
  orderId: string;
  eventId: string;
  seatNumber: string;
  zone: string;
  eventTitle: string;
  artistName: string;
  onClose: () => void;
}

interface TOTPData {
  code: string;
  periodStart: number;
  secondsRemaining: number;
  qrPayload: string;
  microDotSignature: number[][];
  period: number;
}

// ---------------------------------------------------------------------------
// QR Code generator (minimal, self-contained)
// Generates a data matrix suitable for QR-like display
// ---------------------------------------------------------------------------

function generateQRMatrix(data: string): boolean[][] {
  // Simple deterministic matrix from data for visual representation
  // In production, use a proper QR library. This creates a visually
  // convincing pattern that changes with each TOTP rotation.
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Hash the data to create a deterministic pattern
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const chr = data.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }

  // Finder patterns (corners) — standard QR markers
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = x === 0 || x === 6 || y === 0 || y === 6;
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[oy + y][ox + x] = isOuter || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 7; i < size - 7; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data area — fill with deterministic pattern based on hash + data
  const seed = Math.abs(hash);
  let prng = seed;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip finder pattern areas
      if (
        (x < 8 && y < 8) ||
        (x >= size - 8 && y < 8) ||
        (x < 8 && y >= size - 8)
      )
        continue;
      // Skip timing
      if (x === 6 || y === 6) continue;

      // PRNG (xorshift32)
      prng ^= prng << 13;
      prng ^= prng >> 17;
      prng ^= prng << 5;
      matrix[y][x] = (Math.abs(prng) % 3) !== 0;
    }
  }

  return matrix;
}

// ---------------------------------------------------------------------------
// Component: SecureTicketQR
// ---------------------------------------------------------------------------

export default function SecureTicketQR({
  ticketId,
  orderId,
  eventId,
  seatNumber,
  zone,
  eventTitle,
  artistName,
  onClose,
}: SecureTicketQRProps) {
  const [totpData, setTotpData] = useState<TOTPData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "valid" | "invalid" | "checking"
  >("idle");
  const [pulseKey, setPulseKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ──────────────────────────────────────────────────────────────
  // Fetch TOTP from server
  // ──────────────────────────────────────────────────────────────

  const fetchTOTP = useCallback(async () => {
    try {
      const res = await fetch("/api/ticket-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          ticketId,
          orderId,
          eventId,
          seatNumber,
          zone,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al generar código de seguridad");
      }

      const data: TOTPData = await res.json();
      setTotpData(data);
      setSecondsLeft(data.secondsRemaining);
      setIsLoading(false);
      setError(null);
      setPulseKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setIsLoading(false);
    }
  }, [ticketId, orderId, eventId, seatNumber, zone]);

  // ──────────────────────────────────────────────────────────────
  // Setup rotation interval
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchTOTP();

    // Refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchTOTP();
    }, 30 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTOTP]);

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchTOTP();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchTOTP]);

  // ──────────────────────────────────────────────────────────────
  // Verify handler (simulates scanning)
  // ──────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!totpData) return;
    setVerifyStatus("checking");

    try {
      const res = await fetch("/api/ticket-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          qrPayload: totpData.qrPayload,
          ticketId,
        }),
      });

      const result = await res.json();
      setVerifyStatus(result.valid ? "valid" : "invalid");

      // Reset after 3 seconds
      setTimeout(() => setVerifyStatus("idle"), 3000);
    } catch {
      setVerifyStatus("invalid");
      setTimeout(() => setVerifyStatus("idle"), 3000);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Render QR matrix
  // ──────────────────────────────────────────────────────────────

  const qrMatrix = totpData
    ? generateQRMatrix(totpData.qrPayload)
    : null;

  const progressPercent = (secondsLeft / 30) * 100;

  // Determine ring color based on time remaining
  const ringColor =
    secondsLeft > 15
      ? "stroke-emerald-400"
      : secondsLeft > 7
      ? "stroke-amber-400"
      : "stroke-red-400";

  const ringGlow =
    secondsLeft > 15
      ? "drop-shadow(0 0 8px rgba(52,211,153,0.5))"
      : secondsLeft > 7
      ? "drop-shadow(0 0 8px rgba(251,191,36,0.5))"
      : "drop-shadow(0 0 8px rgba(248,113,113,0.5))";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-50 p-2 rounded-full hover:bg-white/10"
        aria-label="Cerrar"
      >
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>

      <div className="w-full max-w-md mx-4">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />

          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-caps text-label-caps text-zinc-500 uppercase tracking-widest">
                  Pase Digital Seguro
                </p>
                <h3 className="font-headline-md text-headline-md text-white mt-1">
                  {artistName}
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">{eventTitle}</p>
              </div>
              <div className="flex flex-col items-center">
                {/* Shield icon with security status */}
                <div
                  className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 ${
                    verifyStatus === "valid"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : verifyStatus === "invalid"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-violet-500/10 text-violet-400"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {verifyStatus === "valid"
                      ? "verified_user"
                      : verifyStatus === "invalid"
                      ? "gpp_bad"
                      : "shield"}
                  </span>
                  {/* Pulse ring */}
                  <span
                    className="absolute inset-0 rounded-full border-2 border-violet-400/30 animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                </div>
              </div>
            </div>

            {/* Seat info chips */}
            <div className="flex items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
                <span className="material-symbols-outlined text-[14px]">
                  stadium
                </span>
                {zone}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
                <span className="material-symbols-outlined text-[14px]">
                  event_seat
                </span>
                {seatNumber}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 ml-auto">
                <span className="material-symbols-outlined text-[14px]">
                  lock
                </span>
                TOTP Activo
              </span>
            </div>
          </div>

          {/* QR Code area */}
          <div className="px-6 py-6 flex flex-col items-center">
            <div className="relative">
              {/* Circular countdown ring */}
              <svg
                className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]"
                viewBox="0 0 100 100"
                style={{ filter: ringGlow }}
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  className="text-white/5"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className={`${ringColor} transition-all duration-1000`}
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 48 * (1 - progressPercent / 100)
                  }`}
                  transform="rotate(-90 50 50)"
                />
              </svg>

              {/* QR Matrix */}
              <div
                key={pulseKey}
                className="relative bg-white rounded-2xl p-3 shadow-lg shadow-white/5"
                style={{
                  animation: "qrFadeIn 0.4s ease-out",
                }}
              >
                {isLoading ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : error ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-red-500 text-sm text-center p-4">
                    {error}
                  </div>
                ) : qrMatrix ? (
                  <svg
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    width="200"
                    height="200"
                    className="block"
                  >
                    {qrMatrix.map((row, y) =>
                      row.map((cell, x) =>
                        cell ? (
                          <rect
                            key={`${x}-${y}`}
                            x={x}
                            y={y}
                            width="1"
                            height="1"
                            fill="#18181b"
                            rx="0.15"
                          />
                        ) : null
                      )
                    )}
                    {/* Micro-dot invisible signature layer */}
                    {totpData?.microDotSignature.map(([dx, dy], i) => (
                      <circle
                        key={`dot-${i}`}
                        cx={dx * qrMatrix.length}
                        cy={dy * qrMatrix.length}
                        r="0.15"
                        fill="#18181b"
                        opacity="0.03"
                        data-sf-sig="true"
                      />
                    ))}
                    {/* Center logo area */}
                    <rect
                      x={qrMatrix.length / 2 - 3}
                      y={qrMatrix.length / 2 - 3}
                      width="6"
                      height="6"
                      fill="white"
                      rx="1"
                    />
                    <text
                      x={qrMatrix.length / 2}
                      y={qrMatrix.length / 2 + 1.2}
                      textAnchor="middle"
                      fontSize="3"
                      fontWeight="bold"
                      fill="#18181b"
                      fontFamily="sans-serif"
                    >
                      SF
                    </text>
                  </svg>
                ) : null}
              </div>
            </div>

            {/* Countdown display */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="material-symbols-outlined text-[16px]">
                  timer
                </span>
                <span>Siguiente rotación en</span>
              </div>
              <span
                className={`font-mono text-lg font-bold tabular-nums ${
                  secondsLeft > 15
                    ? "text-emerald-400"
                    : secondsLeft > 7
                    ? "text-amber-400"
                    : "text-red-400 animate-pulse"
                }`}
              >
                {String(secondsLeft).padStart(2, "0")}s
              </span>
            </div>

            {/* TOTP code display (partially masked for security) */}
            {totpData && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-zinc-600 font-mono">
                  TOTP:{" "}
                  {totpData.code.substring(0, 4)}••••
                  {totpData.code.substring(8)}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* Divider with tear */}
          <div className="relative px-6">
            <div className="border-t border-dashed border-white/10" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-black/80" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-black/80" />
          </div>

          {/* Bottom section */}
          <div className="px-6 py-5 space-y-4">
            {/* Security indicators */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-emerald-500">
                  encrypted
                </span>
                Firma HMAC-SHA256
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-violet-400">
                  fingerprint
                </span>
                Micro-dot embedded
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-cyan-400">
                  sync
                </span>
                Rotación 30s
              </div>
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={verifyStatus === "checking" || !totpData}
              className={`w-full py-3.5 rounded-xl font-label-caps text-label-caps transition-all duration-300 flex items-center justify-center gap-2 ${
                verifyStatus === "valid"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : verifyStatus === "invalid"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {verifyStatus === "checking" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando integridad...
                </>
              ) : verifyStatus === "valid" ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Boleto Auténtico ✓
                </>
              ) : verifyStatus === "invalid" ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>
                  Boleto No Auténtico
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    qr_code_scanner
                  </span>
                  Verificar Integridad
                </>
              )}
            </button>

            {/* Anti-screenshot warning */}
            <p className="text-center text-[10px] text-zinc-600 leading-tight">
              Este código se regenera cada 30 segundos. Las capturas de pantalla
              no son válidas como método de entrada.
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}
