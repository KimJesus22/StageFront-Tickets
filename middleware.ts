import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Interceptación de Rutas: Solo proteger rutas bajo /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('insforge_session');

    // Validación de Rol (O(1)): Si no hay sesión activa, redirige inmediatamente a /login
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Extrae el objeto del usuario parseando la cookie (cero latencia de red)
      const session = JSON.parse(sessionCookie.value);
      
      // Si role !== 'admin', lanza una redirección HTTP 307 (Temporary Redirect)
      if (session.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url), 307);
      }
    } catch (e) {
      // Si el token está malformado o no se puede parsear
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configura el matcher del middleware para que intercepte cualquier petición a /admin/*
export const config = {
  matcher: ['/admin/:path*'],
};
