import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

/**
 * GET /api/insforge
 * Health-check del backend InsForge.
 * Verifica que la conexión con InsForge esté activa.
 */
export async function GET() {
  try {
    // Intenta una operación simple para verificar la conexión
    const { error } = await insforge.database
      .from("_health_check_nonexistent")
      .select()
      .limit(1);

    // Si el error es de tabla inexistente, la conexión funciona
    // Si no hay error, también está bien
    return NextResponse.json({
      status: "ok",
      message: "Conexión con InsForge activa",
      backend: process.env.NEXT_PUBLIC_INSFORGE_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: "No se pudo conectar con InsForge",
        error: err instanceof Error ? err.message : "Error desconocido",
      },
      { status: 503 }
    );
  }
}
