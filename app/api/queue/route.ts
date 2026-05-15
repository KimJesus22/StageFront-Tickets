import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  joinQueue,
  getQueuePosition,
  executeCycle,
  reportLatency,
  isUserAdmitted,
  getQueueStats,
  CYCLE_INTERVAL_MS,
} from "@/lib/queue-engine";
import { sendAppNotification } from "@/lib/services/notifications";

// ---------------------------------------------------------------------------
// Helper: obtener sesión del cookie
// ---------------------------------------------------------------------------
async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("insforge_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/queue — Gestión de la fila virtual
// ---------------------------------------------------------------------------
// Body: { action: "join", eventId }
// Body: { action: "status", eventId }
// Body: { action: "cycle", eventId }            (admin/server)
// Body: { action: "report-latency", eventId, latencyMs }
// Body: { action: "stats", eventId }             (admin)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { action, eventId } = body;

  if (!eventId) {
    return NextResponse.json(
      { error: "Falta eventId" },
      { status: 400 }
    );
  }

  // ─── JOIN: Unirse a la fila ───
  if (action === "join") {
    const position = joinQueue(eventId, session.id, session.email);
    return NextResponse.json(position);
  }

  // ─── STATUS: Consultar posición ───
  if (action === "status") {
    // También verificar si ya fue admitido
    const admitted = isUserAdmitted(eventId, session.id);
    if (admitted) {
      return NextResponse.json({
        admitted: true,
        position: 0,
        statusMessage: "¡Es tu turno! Redirigiendo al mapa de asientos...",
      });
    }

    const position = getQueuePosition(eventId, session.id);
    return NextResponse.json({ admitted: false, ...position });
  }

  // ─── CYCLE: Ejecutar ciclo de desfogue ───
  if (action === "cycle") {
    // Simular una medición de latencia del DB
    const start = Date.now();
    // En producción aquí harías una query real al DB
    // Simulamos una latencia variable
    const simulatedLatency = Math.floor(Math.random() * 300) + 50;
    reportLatency(eventId, simulatedLatency);

    const admittedIds = executeCycle(eventId);

    // Enviar notificaciones de "Es tu turno"
    for (const admittedId of admittedIds) {
      sendAppNotification( // Sin await para no bloquear el ciclo
        admittedId,
        "warning",
        "¡Tu turno está cerca!",
        "Prepárate, eres el siguiente en la fila para la zona VIP.",
        `/event/${eventId}/seats`
      );
    }

    return NextResponse.json({
      cycleExecuted: true,
      admittedCount: admittedIds.length,
      admittedIds,
      reportedLatency: simulatedLatency,
    });
  }

  // ─── REPORT-LATENCY: Reportar latencia ───
  if (action === "report-latency") {
    const { latencyMs } = body;
    if (typeof latencyMs !== "number") {
      return NextResponse.json(
        { error: "latencyMs debe ser un número" },
        { status: 400 }
      );
    }
    reportLatency(eventId, latencyMs);
    return NextResponse.json({ reported: true });
  }

  // ─── STATS: Obtener estadísticas (admin) ───
  if (action === "stats") {
    const stats = getQueueStats(eventId);
    return NextResponse.json(stats);
  }

  return NextResponse.json(
    { error: `Acción desconocida: ${action}` },
    { status: 400 }
  );
}
