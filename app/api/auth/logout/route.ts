import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Elimina la cookie httpOnly `insforge_session` del servidor.
 * Este endpoint es llamado por el UserDropdown (client component)
 * ya que las cookies httpOnly no se pueden manipular desde el cliente.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("insforge_session");

  return NextResponse.json({ success: true });
}
