"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types (matches API response)
// ---------------------------------------------------------------------------

interface StepKPI {
  name: string;
  slug: "otp" | "seatMap" | "checkout";
  icon: string;
  avgTimeSeconds: number;
  medianTimeSeconds: number;
  totalUsers: number;
  abandonedUsers: number;
  abandonRate: number;
  isBottleneck: boolean;
}

interface EfficiencyData {
  cycleConversionRate: number;
  avgCycleTimeSeconds: number;
  steps: StepKPI[];
  bottleneckStep: string | null;
  totalJourneys: number;
  completedJourneys: number;
  abandonedJourneys: number;
  inProgressJourneys: number;
  recentThroughput: number;
  conversionTrend: number;
}

// ---------------------------------------------------------------------------
// Helper: format time
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SalesEfficiencyPanel() {
  const [data, setData] = useState<EfficiencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/efficiency");
      if (res.ok) {
        const metrics: EfficiencyData = await res.json();
        setData(metrics);
      }
    } catch {
      /* retry on next interval */
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll every 10 seconds for real-time feel
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl p-8">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
          <span className="text-zinc-400 font-body-md text-sm">
            Cargando métricas de eficiencia...
          </span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Determine the bottleneck step for highlighting
  const bottleneck = data.steps.find((s) => s.isBottleneck);

  // Find max time for bar scaling
  const maxStepTime = Math.max(...data.steps.map((s) => s.avgTimeSeconds), 1);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              monitoring
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-white">
              Eficiencia de Venta
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              Pipeline en tiempo real • Actualización cada 10s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-500 font-label-caps text-label-caps">
            LIVE
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversion Rate */}
        <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-[40px] group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
              <span className="material-symbols-outlined text-[20px]">
                conversion_path
              </span>
            </div>
            {data.conversionTrend !== 0 && (
              <span
                className={`font-label-caps text-label-caps flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  data.conversionTrend > 0
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-red-400 bg-red-500/10"
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {data.conversionTrend > 0
                    ? "trending_up"
                    : "trending_down"}
                </span>
                {data.conversionTrend > 0 ? "+" : ""}
                {data.conversionTrend}%
              </span>
            )}
          </div>
          <div className="relative z-10">
            <p className="text-zinc-500 font-label-caps text-label-caps mb-1">
              Conversión de Ciclo
            </p>
            <p className="font-headline-lg text-headline-lg text-white tracking-tight">
              {data.cycleConversionRate}%
            </p>
            <p className="text-[11px] text-zinc-600 mt-1">
              {data.completedJourneys} compras / {data.totalJourneys -
                data.inProgressJourneys}{" "}
              entraron al mapa
            </p>
          </div>
        </div>

        {/* Cycle Time */}
        <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-violet-500/10 rounded-full blur-[40px] group-hover:bg-violet-500/20 transition-all" />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">
              <span className="material-symbols-outlined text-[20px]">
                timer
              </span>
            </div>
            <span className="font-label-caps text-label-caps text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
              Promedio
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-zinc-500 font-label-caps text-label-caps mb-1">
              Cycle Time Medio
            </p>
            <p className="font-headline-lg text-headline-lg text-white tracking-tight">
              {formatDuration(data.avgCycleTimeSeconds)}
            </p>
            <p className="text-[11px] text-zinc-600 mt-1">
              OTP → Checkout completado
            </p>
          </div>
        </div>

        {/* Bottleneck */}
        <div
          className={`backdrop-blur-[20px] border rounded-xl p-6 relative overflow-hidden group transition-colors ${
            bottleneck
              ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
              : "bg-white/5 border-white/10 hover:border-white/20"
          }`}
        >
          <div
            className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[40px] transition-all ${
              bottleneck
                ? "bg-red-500/15 group-hover:bg-red-500/25"
                : "bg-orange-500/10 group-hover:bg-orange-500/20"
            }`}
          />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div
              className={`p-1.5 rounded-lg ${
                bottleneck
                  ? "bg-red-500/15 text-red-400"
                  : "bg-orange-500/10 text-orange-400"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {bottleneck ? "error" : "check_circle"}
              </span>
            </div>
            {bottleneck && (
              <span className="text-red-400 font-label-caps text-label-caps flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Crítico
              </span>
            )}
          </div>
          <div className="relative z-10">
            <p
              className={`font-label-caps text-label-caps mb-1 ${
                bottleneck ? "text-red-400/70" : "text-zinc-500"
              }`}
            >
              Cuello de Botella
            </p>
            <p
              className={`font-headline-lg text-headline-lg tracking-tight ${
                bottleneck ? "text-red-400" : "text-white"
              }`}
            >
              {bottleneck ? bottleneck.name : "Ninguno"}
            </p>
            {bottleneck && (
              <p className="text-[11px] text-red-400/60 mt-1">
                {formatDuration(bottleneck.avgTimeSeconds)} promedio •{" "}
                {bottleneck.abandonRate}% abandono
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Steps Breakdown */}
      <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-zinc-400 text-[20px]">
              route
            </span>
            <h4 className="font-headline-md text-headline-md text-white text-lg">
              Desglose del Pipeline
            </h4>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              Tiempo promedio
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
              Bottleneck
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-6">
          {data.steps.map((step, idx) => {
            const barWidth = Math.max(
              (step.avgTimeSeconds / maxStepTime) * 100,
              8
            );

            return (
              <div key={step.slug} className="relative">
                {/* Step header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Step number circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                        step.isBottleneck
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : "bg-white/5 border-white/10 text-zinc-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          step.isBottleneck
                            ? "text-red-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {step.icon}
                      </span>
                      <span
                        className={`font-medium text-sm ${
                          step.isBottleneck ? "text-red-400" : "text-white"
                        }`}
                      >
                        {step.name}
                      </span>
                      {step.isBottleneck && (
                        <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                          Bottleneck
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span
                      className={`font-['Space_Grotesk'] font-bold ${
                        step.isBottleneck ? "text-red-400" : "text-white"
                      }`}
                    >
                      {formatDuration(step.avgTimeSeconds)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="ml-10">
                  <div className="h-7 w-full bg-black/30 rounded-md overflow-hidden border border-white/5 relative">
                    <div
                      className={`h-full rounded-md transition-all duration-700 ease-out ${
                        step.isBottleneck
                          ? "bg-gradient-to-r from-red-500/60 to-red-400/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                          : "bg-gradient-to-r from-cyan-500/30 to-cyan-400/50"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    {/* Inner stats overlay */}
                    <div className="absolute inset-0 flex items-center px-3 justify-between">
                      <span className="text-[10px] text-white/50">
                        {step.totalUsers} usuarios
                      </span>
                      <span
                        className={`text-[10px] ${
                          step.abandonRate > 10
                            ? "text-red-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {step.abandonRate}% abandono
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connector line between steps */}
                {idx < data.steps.length - 1 && (
                  <div className="ml-[13px] mt-1 mb-1 w-px h-3 bg-white/10" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        <div className="px-6 py-4 bg-zinc-950/50 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[11px] text-zinc-500">
            <span>
              <strong className="text-zinc-300">{data.totalJourneys}</strong>{" "}
              journeys totales
            </span>
            <span>
              <strong className="text-emerald-400">
                {data.completedJourneys}
              </strong>{" "}
              completados
            </span>
            <span>
              <strong className="text-red-400">
                {data.abandonedJourneys}
              </strong>{" "}
              abandonados
            </span>
            <span>
              <strong className="text-cyan-400">
                {data.inProgressJourneys}
              </strong>{" "}
              en progreso
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-zinc-500">
              speed
            </span>
            <span className="text-zinc-500">Throughput:</span>
            <span className="text-white font-medium font-['Space_Grotesk']">
              {data.recentThroughput}/min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
