import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("insforge_session")?.value;

  if (!sessionData) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionData);
    // Only expose non-sensitive fields to the client
    return NextResponse.json({
      id: session.id,
      email: session.email,
      name: session.name,
    });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
