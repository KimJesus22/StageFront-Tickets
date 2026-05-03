import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("insforge_session");
  const isAuthenticated = !!sessionCookie?.value;

  let session = null;
  if (isAuthenticated) {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {}
  }

  const { pathname } = request.nextUrl;

  // Proteger rutas de admin
  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    if (!isAuthenticated || (session?.email !== adminEmail && session?.email !== "jesus@top.com.mx")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Proteger /wallet, /portal y cualquier ruta dentro de /checkout
  const isProtectedPath = pathname === "/wallet" || pathname === "/portal" || pathname.startsWith("/checkout") || pathname.startsWith("/event") || pathname.startsWith("/payment") || pathname.startsWith("/success");

  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    // Podemos pasar la url a la que intentaba ir para redirigirlo después
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Evitar que usuarios autenticados vayan al login
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/wallet", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/wallet/:path*", 
    "/portal/:path*",
    "/checkout/:path*", 
    "/event/:path*",
    "/payment/:path*",
    "/success",
    "/login"
  ],
};
