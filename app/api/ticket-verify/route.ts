import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateTOTP,
  verifyTicketSign,
  deriveTicketSecret,
  type TicketSignPayload,
  TOTP_PERIOD_SECONDS,
} from "@/lib/crypto/ticket-sign";

// ---------------------------------------------------------------------------
// Secreto maestro — En producción, usar un KMS o Vault
// ---------------------------------------------------------------------------
const MASTER_SECRET =
  process.env.TICKET_SIGNING_SECRET || "sf-tickets-master-secret-change-in-production";

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
// POST /api/ticket-verify — Genera un nuevo código TOTP para un boleto
// ---------------------------------------------------------------------------
// Body: { action: "generate", ticketId, orderId, eventId, seatNumber, zone }
// Body: { action: "verify",  qrPayload }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido" },
      { status: 400 }
    );
  }

  const { action } = body;

  // ────────────────────────────────────────────────────────────
  // ACTION: generate — genera un nuevo TOTP + firma invisible
  // ────────────────────────────────────────────────────────────
  if (action === "generate") {
    const { ticketId, orderId, eventId, seatNumber, zone } = body;

    if (!ticketId || !orderId || !eventId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: ticketId, orderId, eventId" },
        { status: 400 }
      );
    }

    const payload: TicketSignPayload = {
      ticketId,
      orderId,
      userId: session.id,
      eventId,
      seatNumber: seatNumber || "",
      zone: zone || "",
    };

    // Derivar secreto único por boleto
    const ticketSecret = await deriveTicketSecret(MASTER_SECRET, ticketId);

    const totp = await generateTOTP(payload, ticketSecret);

    return NextResponse.json({
      code: totp.code,
      periodStart: totp.periodStart,
      secondsRemaining: totp.secondsRemaining,
      qrPayload: totp.qrPayload,
      microDotSignature: totp.microDotSignature,
      period: TOTP_PERIOD_SECONDS,
    });
  }

  // ────────────────────────────────────────────────────────────
  // ACTION: verify — verifica un QR escaneado
  // ────────────────────────────────────────────────────────────
  if (action === "verify") {
    const { qrPayload, ticketId } = body;

    if (!qrPayload || !ticketId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: qrPayload, ticketId" },
        { status: 400 }
      );
    }

    const ticketSecret = await deriveTicketSecret(MASTER_SECRET, ticketId);
    const result = await verifyTicketSign(qrPayload, session.id, ticketSecret);

    return NextResponse.json(result);
  }

  return NextResponse.json(
    { error: `Acción desconocida: ${action}` },
    { status: 400 }
  );
}
