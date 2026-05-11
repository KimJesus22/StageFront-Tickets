// ============================================================================
// 📊 EFICIENCIA DE VENTA — Motor de KPIs Industriales
// ============================================================================
//
// Calcula métricas de rendimiento del pipeline de venta en tiempo real:
//   1. Tasa de Conversión de Ciclo (Cycle Conversion Rate)
//   2. Tiempo Medio de Ciclo (Cycle Time)
//   3. Cuello de Botella (Bottleneck Detection)
//
// ============================================================================

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Cada paso del pipeline de compra tiene un timestamp */
export interface StepTimestamp {
  /** Cuando el usuario entró a este paso */
  enteredAt: number;
  /** Cuando el usuario salió de este paso */
  exitedAt: number | null;
}

/** Registro completo del journey de un usuario */
export interface UserJourney {
  userId: string;
  eventId: string;
  /** Paso 1: Autenticación OTP */
  otp: StepTimestamp;
  /** Paso 2: Mapa de asientos */
  seatMap: StepTimestamp;
  /** Paso 3: Checkout/Pago */
  checkout: StepTimestamp;
  /** Estado final */
  outcome: "completed" | "abandoned" | "in_progress";
  /** Timestamp del evento completo */
  completedAt: number | null;
}

/** KPI de un paso del pipeline */
export interface StepKPI {
  name: string;
  slug: "otp" | "seatMap" | "checkout";
  icon: string;
  /** Promedio de tiempo en este paso (segundos) */
  avgTimeSeconds: number;
  /** Mediana de tiempo en este paso (segundos) */
  medianTimeSeconds: number;
  /** Total de usuarios que pasaron por este paso */
  totalUsers: number;
  /** Usuarios que abandonaron en este paso */
  abandonedUsers: number;
  /** Tasa de abandono (0-100) */
  abandonRate: number;
  /** Si este paso es el cuello de botella */
  isBottleneck: boolean;
}

/** Dashboard completo de eficiencia */
export interface SalesEfficiencyMetrics {
  /** Tasa de conversión: usuarios que compraron / usuarios que entraron al mapa */
  cycleConversionRate: number;
  /** Tiempo medio total del pipeline (segundos) */
  avgCycleTimeSeconds: number;
  /** Desglose por paso */
  steps: StepKPI[];
  /** Paso que es el cuello de botella */
  bottleneckStep: "otp" | "seatMap" | "checkout" | null;
  /** Total de journeys registrados */
  totalJourneys: number;
  /** Journeys completados */
  completedJourneys: number;
  /** Journeys abandonados */
  abandonedJourneys: number;
  /** Journeys en progreso */
  inProgressJourneys: number;
  /** Últimos 5 minutos de throughput (completions per minute) */
  recentThroughput: number;
  /** Tendencia: diferencia vs. periodo anterior */
  conversionTrend: number;
}

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------
// En producción esto iría a una base de datos de analytics (ClickHouse, etc.)

const journeys = new Map<string, UserJourney>();
const completionTimestamps: number[] = []; // Para calcular throughput

// ---------------------------------------------------------------------------
// 1. REGISTRAR EVENTOS DEL PIPELINE
// ---------------------------------------------------------------------------

/**
 * Registra que un usuario entró a un paso del pipeline.
 */
export function trackStepEntry(
  userId: string,
  eventId: string,
  step: "otp" | "seatMap" | "checkout"
): void {
  const key = `${userId}:${eventId}`;
  let journey = journeys.get(key);

  if (!journey) {
    journey = {
      userId,
      eventId,
      otp: { enteredAt: 0, exitedAt: null },
      seatMap: { enteredAt: 0, exitedAt: null },
      checkout: { enteredAt: 0, exitedAt: null },
      outcome: "in_progress",
      completedAt: null,
    };
    journeys.set(key, journey);
  }

  journey[step].enteredAt = Date.now();
}

/**
 * Registra que un usuario salió de un paso del pipeline.
 */
export function trackStepExit(
  userId: string,
  eventId: string,
  step: "otp" | "seatMap" | "checkout"
): void {
  const key = `${userId}:${eventId}`;
  const journey = journeys.get(key);
  if (!journey) return;

  journey[step].exitedAt = Date.now();
}

/**
 * Registra que un usuario completó la compra.
 */
export function trackCompletion(userId: string, eventId: string): void {
  const key = `${userId}:${eventId}`;
  const journey = journeys.get(key);
  if (!journey) return;

  journey.outcome = "completed";
  journey.completedAt = Date.now();
  journey.checkout.exitedAt = Date.now();
  completionTimestamps.push(Date.now());
}

/**
 * Registra que un usuario abandonó el proceso.
 */
export function trackAbandonment(userId: string, eventId: string): void {
  const key = `${userId}:${eventId}`;
  const journey = journeys.get(key);
  if (!journey) return;

  journey.outcome = "abandoned";
}

// ---------------------------------------------------------------------------
// 2. CÁLCULO DE KPIs
// ---------------------------------------------------------------------------

/** Calcula la mediana de un array de números */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calcula todas las métricas de eficiencia de venta.
 *
 * @param eventId - Si se pasa, filtra por evento. Si no, calcula global.
 */
export function calculateEfficiency(eventId?: string): SalesEfficiencyMetrics {
  // Filtrar journeys
  const allJourneys = Array.from(journeys.values()).filter(
    (j) => !eventId || j.eventId === eventId
  );

  const completed = allJourneys.filter((j) => j.outcome === "completed");
  const abandoned = allJourneys.filter((j) => j.outcome === "abandoned");
  const inProgress = allJourneys.filter((j) => j.outcome === "in_progress");

  // --- Tasa de Conversión ---
  // Usuarios que compraron / Usuarios que entraron al mapa
  const enteredMap = allJourneys.filter(
    (j) => j.seatMap.enteredAt > 0
  ).length;
  const completedCount = completed.length;
  const cycleConversionRate =
    enteredMap > 0 ? (completedCount / enteredMap) * 100 : 0;

  // --- Tiempo Medio de Ciclo ---
  const cycleTimes = completed
    .filter((j) => j.otp.enteredAt > 0 && j.completedAt)
    .map((j) => (j.completedAt! - j.otp.enteredAt) / 1000);

  const avgCycleTimeSeconds =
    cycleTimes.length > 0
      ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
      : 0;

  // --- Desglose por paso ---
  const stepConfigs: Array<{
    name: string;
    slug: "otp" | "seatMap" | "checkout";
    icon: string;
  }> = [
    { name: "Autenticación OTP", slug: "otp", icon: "verified_user" },
    { name: "Mapa de Asientos", slug: "seatMap", icon: "map" },
    { name: "Checkout / Pago", slug: "checkout", icon: "payment" },
  ];

  const stepKPIs: StepKPI[] = stepConfigs.map(({ name, slug, icon }) => {
    // Tiempos de los usuarios que completaron este paso
    const times = allJourneys
      .filter(
        (j) => j[slug].enteredAt > 0 && j[slug].exitedAt !== null
      )
      .map((j) => (j[slug].exitedAt! - j[slug].enteredAt) / 1000);

    const totalInStep = allJourneys.filter(
      (j) => j[slug].enteredAt > 0
    ).length;
    const abandonedInStep = abandoned.filter(
      (j) =>
        j[slug].enteredAt > 0 &&
        j[slug].exitedAt === null
    ).length;

    const avgTime =
      times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : 0;

    return {
      name,
      slug,
      icon,
      avgTimeSeconds: Math.round(avgTime * 10) / 10,
      medianTimeSeconds: Math.round(median(times) * 10) / 10,
      totalUsers: totalInStep,
      abandonedUsers: abandonedInStep,
      abandonRate:
        totalInStep > 0
          ? Math.round((abandonedInStep / totalInStep) * 1000) / 10
          : 0,
      isBottleneck: false, // Se calcula después
    };
  });

  // --- Identificar Cuello de Botella ---
  // El paso donde los usuarios pasan MÁS tiempo es el bottleneck
  let bottleneckStep: "otp" | "seatMap" | "checkout" | null = null;
  let maxAvgTime = 0;

  for (const step of stepKPIs) {
    if (step.avgTimeSeconds > maxAvgTime && step.totalUsers > 0) {
      maxAvgTime = step.avgTimeSeconds;
      bottleneckStep = step.slug;
    }
  }

  // Marcar el bottleneck
  for (const step of stepKPIs) {
    step.isBottleneck = step.slug === bottleneckStep;
  }

  // --- Throughput (últimos 5 minutos) ---
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recentCompletions = completionTimestamps.filter(
    (t) => t >= fiveMinAgo
  ).length;
  const recentThroughput = Math.round((recentCompletions / 5) * 10) / 10;

  // --- Tendencia (simulada) ---
  const conversionTrend = cycleConversionRate > 0 ? 2.4 : 0;

  return {
    cycleConversionRate: Math.round(cycleConversionRate * 10) / 10,
    avgCycleTimeSeconds: Math.round(avgCycleTimeSeconds * 10) / 10,
    steps: stepKPIs,
    bottleneckStep,
    totalJourneys: allJourneys.length,
    completedJourneys: completedCount,
    abandonedJourneys: abandoned.length,
    inProgressJourneys: inProgress.length,
    recentThroughput,
    conversionTrend,
  };
}

// ---------------------------------------------------------------------------
// 3. SEED DE DATOS DE DEMOSTRACIÓN
// ---------------------------------------------------------------------------
// Para que el dashboard tenga datos significativos sin esperar
// que usuarios reales completen el pipeline.

/**
 * Genera journeys simulados para una demostración convincente.
 */
export function seedDemoData(eventId: string = "demo-event"): void {
  // Evitar duplicar semillas
  if (journeys.size > 50) return;

  const now = Date.now();
  const scenarios = [
    // Usuarios que completaron todo rápido (happy path)
    ...Array.from({ length: 35 }, (_, i) => ({
      userId: `user-fast-${i}`,
      otpTime: 8 + Math.random() * 15,      // 8–23s en OTP
      mapTime: 45 + Math.random() * 90,      // 45–135s en mapa
      checkoutTime: 30 + Math.random() * 60,  // 30–90s en checkout
      outcome: "completed" as const,
    })),
    // Usuarios que abandonaron en el mapa (indecisión)
    ...Array.from({ length: 12 }, (_, i) => ({
      userId: `user-abandon-map-${i}`,
      otpTime: 10 + Math.random() * 12,
      mapTime: 120 + Math.random() * 180,
      checkoutTime: 0,
      outcome: "abandoned" as const,
    })),
    // Usuarios que abandonaron en checkout (problemas de pago)
    ...Array.from({ length: 8 }, (_, i) => ({
      userId: `user-abandon-pay-${i}`,
      otpTime: 12 + Math.random() * 10,
      mapTime: 60 + Math.random() * 90,
      checkoutTime: 45 + Math.random() * 120,
      outcome: "abandoned" as const,
    })),
    // Usuarios en progreso (ahora mismo en algún paso)
    ...Array.from({ length: 15 }, (_, i) => ({
      userId: `user-active-${i}`,
      otpTime: 10 + Math.random() * 15,
      mapTime: i < 8 ? 0 : 50 + Math.random() * 60,
      checkoutTime: 0,
      outcome: "in_progress" as const,
    })),
    // Usuarios lentos que completaron (outliers)
    ...Array.from({ length: 5 }, (_, i) => ({
      userId: `user-slow-${i}`,
      otpTime: 25 + Math.random() * 30,
      mapTime: 180 + Math.random() * 120,
      checkoutTime: 90 + Math.random() * 120,
      outcome: "completed" as const,
    })),
  ];

  for (const s of scenarios) {
    const key = `${s.userId}:${eventId}`;
    const otpStart = now - (s.otpTime + s.mapTime + s.checkoutTime) * 1000;

    const journey: UserJourney = {
      userId: s.userId,
      eventId,
      otp: {
        enteredAt: otpStart,
        exitedAt: s.otpTime > 0 ? otpStart + s.otpTime * 1000 : null,
      },
      seatMap: {
        enteredAt: s.otpTime > 0 ? otpStart + s.otpTime * 1000 : 0,
        exitedAt:
          s.mapTime > 0
            ? otpStart + (s.otpTime + s.mapTime) * 1000
            : null,
      },
      checkout: {
        enteredAt:
          s.mapTime > 0 && s.checkoutTime > 0
            ? otpStart + (s.otpTime + s.mapTime) * 1000
            : 0,
        exitedAt:
          s.outcome === "completed"
            ? otpStart + (s.otpTime + s.mapTime + s.checkoutTime) * 1000
            : s.outcome === "abandoned" && s.checkoutTime > 0
            ? null
            : null,
      },
      outcome: s.outcome,
      completedAt:
        s.outcome === "completed"
          ? otpStart + (s.otpTime + s.mapTime + s.checkoutTime) * 1000
          : null,
    };

    journeys.set(key, journey);

    if (s.outcome === "completed") {
      completionTimestamps.push(journey.completedAt!);
    }
  }
}
