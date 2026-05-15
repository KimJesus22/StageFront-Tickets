import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── 1. Recuperar Sesión del SSR Cookie ──
  const sessionCookie = request.cookies.get('insforge_session')?.value;
  let session = null;
  
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie);
    } catch {}
  }

  const isAuth = !!session;
  const isAdmin = session?.role === 'admin';

  // ── 2. Lógica de Autorización (Admin) ──
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/unauthenticated', request.url));
    }
  }

  // ── 3. Lógica de Autenticación (Rutas Privadas) ──
  const privateRoutes = ['/wallet', '/checkout', '/profile'];
  const isPrivateRoute = privateRoutes.some(route => pathname.startsWith(route));

  // Rutas dinámicas de acción de eventos (compra o fila virtual)
  const isEventActionRoute = pathname.match(/^\/event\/[^/]+\/(queue|seats)/);

  if ((isPrivateRoute || isEventActionRoute) && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si pasa todas las validaciones, continuar
  return NextResponse.next();
}

// ── 4. Rendimiento (Performance Matcher) ──
export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto aquellas que comiencen con:
     * - api (Las API routes tienen su propia validación getSession)
     * - _next/static (archivos estáticos de React/Next)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - Cualquier extensión de imagen común (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
