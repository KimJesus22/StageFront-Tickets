import { NextRequest, NextResponse } from "next/server";
import {
  calculateEfficiency,
  seedDemoData,
  trackStepEntry,
  trackStepExit,
  trackCompletion,
  trackAbandonment,
} from "@/lib/analytics/sales-efficiency";

// ---------------------------------------------------------------------------
// GET /api/admin/efficiency — Obtener métricas de eficiencia
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId") || undefined;

  // Seed demo data if empty (for development)
  seedDemoData(eventId || "demo-event");

  const metrics = calculateEfficiency(eventId);
  return NextResponse.json(metrics);
}

// ---------------------------------------------------------------------------
// POST /api/admin/efficiency — Registrar eventos del pipeline
// ---------------------------------------------------------------------------
// Body: { action: "enter"|"exit"|"complete"|"abandon", userId, eventId, step }

export async function POST(req: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { action, userId, eventId, step } = body;

  if (!userId || !eventId) {
    return NextResponse.json(
      { error: "Faltan userId o eventId" },
      { status: 400 }
    );
  }

  switch (action) {
    case "enter":
      if (!step) return NextResponse.json({ error: "Falta step" }, { status: 400 });
      trackStepEntry(userId, eventId, step);
      break;
    case "exit":
      if (!step) return NextResponse.json({ error: "Falta step" }, { status: 400 });
      trackStepExit(userId, eventId, step);
      break;
    case "complete":
      trackCompletion(userId, eventId);
      break;
    case "abandon":
      trackAbandonment(userId, eventId);
      break;
    default:
      return NextResponse.json(
        { error: `Acción desconocida: ${action}` },
        { status: 400 }
      );
  }

  return NextResponse.json({ tracked: true });
}
