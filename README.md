# 🎟️ StageFront Tickets

El ecosistema de boletos premium para los eventos más esperados. Un servicio de conserjería de alta tecnología diseñado para verdaderos fans.

## ✨ Características

- **Landing Page Premium** — Diseño oscuro con estética Glassmorphism, gradientes de neón contextuales y micro-animaciones
- **Artistas Exclusivos** — Grid Bento con tarjetas interactivas para BTS, TXT, Blackpink y Twenty One Pilots
- **Rutas Dinámicas** — Páginas individuales por artista con generación estática (SSG)
- **Backend InsForge** — Base de datos PostgreSQL, autenticación, almacenamiento y funciones serverless
- **Diseño Responsivo** — Adaptado para móvil, tablet y escritorio

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Next.js** | 16.2.4 | Framework React con App Router |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.4.17 | Sistema de diseño y estilos |
| **InsForge SDK** | 1.2.6 | Backend-as-a-Service |
| **pnpm** | 10.x | Gestor de paquetes |

## 📁 Estructura del Proyecto

```
├── app/
│   ├── (fandoms)/
│   │   └── [artist]/page.tsx      → /bts, /txt, /blackpink, /twenty-one-pilots
│   ├── (checkout)/
│   │   ├── seats/page.tsx         → /seats
│   │   └── payment/page.tsx       → /payment
│   ├── api/insforge/route.ts      → API endpoint InsForge
│   ├── globals.css
│   ├── layout.tsx                 → Layout raíz con fuentes y metadatos
│   └── page.tsx                   → Landing page principal
├── components/
│   ├── Navbar.tsx                 → Barra de navegación con glassmorphism
│   ├── HeroSection.tsx            → Sección hero con búsqueda
│   ├── ArtistGrid.tsx             → Grid Bento de artistas
│   └── Footer.tsx                 → Pie de página
├── lib/
│   └── insforge.ts                → Cliente InsForge inicializado
├── tailwind.config.ts             → Tokens del sistema de diseño
├── next.config.ts                 → Configuración de Next.js
└── .env.local                     → Variables de entorno (no versionado)
```

## 🚀 Inicio Rápido

### Requisitos previos

- Node.js 18+
- pnpm 10+

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/KimJesus22/StageFront-Tickets.git
cd StageFront-Tickets

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de InsForge
```

### Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Producción

```bash
pnpm build
pnpm start
```

## 🎨 Sistema de Diseño

- **Tema**: Ethereal Tech — oscuro, premium, misterioso
- **Tipografía**: Space Grotesk (headlines) + Inter (body)
- **Colores base**: `bg-zinc-950` con acentos de neón contextuales por artista
- **Elevación**: Glassmorphism con blur y bordes semi-transparentes

## 📄 Licencia

© 2026 StageFront Tickets Ecosystem. Todos los derechos reservados.
