# 🎟️ StageFront Tickets

El ecosistema de boletos premium para los eventos más esperados. Un servicio de conserjería de alta tecnología diseñado para verdaderos fans.

🚀 **Demo en Vivo:** [https://stage-front-tickets.vercel.app/](https://stage-front-tickets.vercel.app/)

## ✨ Características

- **Landing Page Premium** — Diseño oscuro con estética Glassmorphism, gradientes de neón contextuales y micro-animaciones
- **Artistas Dinámicos** — Grid Bento alimentado desde PostgreSQL con tarjetas interactivas (BTS, TXT, Blackpink, Twenty One Pilots)
- **Perfiles de Artista** — Rutas dinámicas `/[slug]` con lista de eventos y diseño blur-background
- **Checkout Interactivo** — Selección de asientos por zona en `/event/[id]` con actualización de precios en tiempo real
- **Bloqueo de Concurrencia** — Prevención de doble venta en base de datos al seleccionar asientos
- **Autenticación Segura** — Inicio de sesión y registro impulsado por InsForge Auth y Server Actions
- **Billetera Digital** — Ruta `/wallet` con boletos de diseño Skeuomorphic (perforaciones y QR simulados)
- **Panel de Administración** — Dashboard en `/admin` con métricas clave, control de acceso y ventas recientes
- **Protección de Rutas** — Enrutamiento protegido por middleware (`proxy.ts` de Next.js 16)
- **Backend InsForge** — Base de datos PostgreSQL, autenticación, almacenamiento y funciones serverless
- **Server Actions** — Consultas a la base de datos desde Server Components de Next.js
- **Tipado Estricto** — Interfaces TypeScript que reflejan el esquema SQL
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
│   ├── (admin)/
│   │   ├── layout.tsx               → Layout fijo con barra lateral para el administrador
│   │   └── page.tsx                 → Dashboard general con tarjetas de métricas y tabla de ventas
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx             → Layout principal de acceso (Server Component)
│   │       └── LoginForm.tsx        → Componente interactivo de inicio de sesión/registro
│   ├── (fandoms)/
│   │   ├── wallet/page.tsx          → Billetera digital de boletos con diseño premium
│   │   └── [slug]/page.tsx          → Perfil del artista dinámico (/bts, /txt, etc.)
│   ├── (checkout)/
│   │   ├── event/[id]/
│   │   │   ├── page.tsx             → Layout principal de selección de asientos
│   │   │   └── SeatSelector.tsx     → Componente interactivo de cuadrícula de asientos
│   │   ├── payment/[ticket_id]/
│   │   │   └── page.tsx             → Formulario de pago simulado
│   │   └── success/page.tsx         → Confirmación de compra exitosa
│   ├── artists/
│   │   └── page.tsx                 → Directorio de todos los artistas
│   ├── events/
│   │   └── page.tsx                 → Cartelera completa de próximos eventos
│   ├── api/insforge/route.ts        → Health-check del backend
│   ├── globals.css
│   ├── layout.tsx                   → Layout raíz (fuentes, metadatos, dark mode)
│   └── page.tsx                     → Landing page (async, datos dinámicos)
├── components/
│   ├── Navbar.tsx                   → Barra de navegación con control de sesión
│   ├── HeroSection.tsx              → Sección hero con búsqueda
│   ├── ArtistGrid.tsx               → Grid Bento dinámico (recibe Artist[])
│   └── Footer.tsx                   → Pie de página
├── lib/
│   ├── insforge.ts                  → Cliente público + cliente admin
│   ├── actions/
│   │   ├── admin.ts                 → Server Actions (getDashboardStats)
│   │   ├── artists.ts               → Server Actions (getArtists, getArtistBySlug)
│   │   ├── auth.ts                  → Server Actions (login, signup, logout, getSession)
│   │   ├── events.ts                → Server Actions (getEventsByArtistSlug)
│   │   ├── tickets.ts               → Server Actions (getEventById, getTicketsByEventId, lockTicket)
│   │   ├── checkout.ts              → Server Actions (processPayment)
│   │   └── orders.ts                → Server Actions (getUserTickets)
│   └── types/
│       └── database.ts              → Tipos TypeScript del esquema SQL
├── tailwind.config.ts               → Tokens del sistema de diseño Ethereal Tech
├── next.config.ts                   → Dominios de imágenes permitidos
├── proxy.ts                         → Middleware de autorización para rutas sensibles
├── .env.local                       → Variables de entorno (no versionado)
└── .env.example                     → Plantilla de variables de entorno
```

## 🗄️ Base de Datos (InsForge / PostgreSQL)

### Esquema

```
artists ──────< events ──────< tickets_inventory ──────< orders
```

| Tabla | Columnas principales |
|---|---|
| **artists** | `id` (UUID), `name`, `slug` (unique), `genre`, `fandom_name`, `image_url`, `display_order` |
| **events** | `id` (UUID), `artist_id` (FK), `title`, `venue`, `city`, `date`, `status` |
| **tickets_inventory** | `id` (UUID), `event_id` (FK), `zone`, `seat_number`, `price`, `status` |
| **orders** | `id` (UUID), `user_name`, `user_email`, `ticket_id` (FK), `amount_paid`, `created_at` |

### Enums

- **`event_status`**: `programado`, `en_venta`, `agotado`, `cancelado`, `finalizado`
- **`ticket_status`**: `disponible`, `bloqueado`, `vendido`

## 🔌 Conexión con InsForge

El proyecto usa dos clientes definidos en `lib/insforge.ts`:

| Cliente | Variable de entorno | Uso |
|---|---|---|
| `insforge` | `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Server/Client Components (operaciones públicas con RLS) |
| `insforgeAdmin` | `INSFORGE_ADMIN_API_KEY` | Solo Route Handlers y Server Actions (operaciones admin) |

### Variables de entorno

```bash
# .env.local
NEXT_PUBLIC_INSFORGE_URL=https://tu-proyecto.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=eyJhbGciOi...   # JWT público (get-anon-key)
INSFORGE_ADMIN_API_KEY=ik_tu-api-key           # Solo servidor
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
