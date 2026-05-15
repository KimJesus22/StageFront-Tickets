import type { NextConfig } from "next";

// ============================================================================
// 🛡️ SECURITY HEADERS — Capa de Seguridad HTTP (AppSec Layer)
// ============================================================================
//
// Estas cabeceras se inyectan en TODAS las respuestas HTTP del servidor.
// Protegen contra: Clickjacking, XSS, MIME-sniffing, data leaks,
// y acceso no autorizado a hardware del dispositivo.
//
// Referencia: https://owasp.org/www-project-secure-headers/
// ============================================================================

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

const securityHeaders = [
  // ── DNS Prefetching ───────────────────────────────────────────────────
  // Permite al navegador resolver DNS de recursos externos anticipadamente,
  // mejorando la latencia percibida en enlaces salientes.
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },

  // ── HSTS (HTTP Strict Transport Security) ─────────────────────────────
  // Fuerza HTTPS estricto durante 2 años (63072000s).
  // includeSubDomains: aplica a todos los subdominios.
  // preload: permite inclusión en la lista HSTS preload de navegadores.
  //
  // ⚠️ Una vez activado con preload, es MUY difícil revertirlo.
  //    Solo activar si el dominio de producción ya tiene HTTPS estable.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // ── Clickjacking Protection ───────────────────────────────────────────
  // Bloquea que la aplicación sea embebida en un <iframe> externo.
  // SAMEORIGIN: solo permite iframes desde el mismo origen.
  //
  // Nota: frame-ancestors en CSP es la versión moderna de esto,
  //       pero X-Frame-Options se mantiene como fallback para IE/Edge Legacy.
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },

  // ── MIME-Type Sniffing Protection ─────────────────────────────────────
  // Evita que el navegador intente "adivinar" el Content-Type.
  // Sin esto, un atacante podría subir un .txt con JS y el navegador
  // lo ejecutaría como script (MIME confusion attack).
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // ── Referrer Policy ───────────────────────────────────────────────────
  // Controla qué información del referer se envía en navegaciones.
  // strict-origin-when-cross-origin:
  //   - Same-origin: envía URL completa
  //   - Cross-origin HTTPS→HTTPS: envía solo el origen (dominio)
  //   - HTTPS→HTTP (downgrade): no envía nada
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // ── Permissions Policy (Feature Policy) ───────────────────────────────
  // Bloquea el acceso a APIs de hardware que la boletera no necesita.
  // camera=(), microphone=(), geolocation=() → deshabilitados para
  // todos los orígenes, incluyendo el propio.
  //
  // Esto previene que scripts de terceros (analytics, ads) puedan
  // activar cámara/micrófono/GPS sin que el usuario lo sepa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },

  // ── Content Security Policy (CSP) ─────────────────────────────────────
  // La directiva más poderosa de seguridad web. Define de dónde puede
  // cargar recursos el navegador.
  //
  // Política actual:
  //   • default-src 'self'        → Solo recursos del mismo origen
  //   • script-src 'unsafe-eval'  → Requerido por Next.js en dev/HMR
  //   • script-src 'unsafe-inline'→ Requerido por Next.js inline scripts
  //   • style-src 'unsafe-inline' → Requerido por Tailwind/CSS-in-JS
  //   • img-src https:            → Permite imágenes de CDNs externos (HTTPS)
  //   • object-src 'none'         → Bloquea <object>, <embed>, <applet>
  //   • frame-ancestors 'none'    → Bloquea embedding (complementa X-Frame-Options)
  //
  // TODO (Producción Hardening):
  //   • Reemplazar 'unsafe-inline' con nonces (require next/script)
  //   • Agregar report-uri o report-to para monitoreo de violaciones CSP
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "media.ticketmaster.com",
      },
      {
        protocol: "https",
        hostname: "prismic-images.tmol.io",
      },
    ],
  },

  // ── Security Headers (aplica a TODAS las rutas) ───────────────────────
  async headers() {
    return [
      {
        // Matcher universal: todas las rutas de la aplicación
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
