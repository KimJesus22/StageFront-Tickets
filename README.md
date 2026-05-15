# 🎟️ StageFront Tickets

El ecosistema de boletos premium para los eventos más esperados. Un servicio de conserjería de alta tecnología diseñado para verdaderos fans.

🚀 **Demo en Vivo:** [https://stage-front-tickets.vercel.app/](https://stage-front-tickets.vercel.app/)

## ✨ Características

- **Landing Page Premium** — Diseño oscuro con estética Glassmorphism, gradientes de neón contextuales y micro-animaciones
- **Artistas Dinámicos** — Cuadrícula interactiva (Bento Grid) alimentada desde PostgreSQL con tarjetas interactivas (BTS, TXT, Blackpink, Twenty One Pilots)
- **Perfiles de Artista** — Rutas dinámicas `/[slug]` con lista de eventos y diseño de fondo difuminado (blur-background)
- **Fila Virtual con OTP** — Verificación de identidad por código de 6 dígitos antes de acceder a la cola de compra
- **Simulador de Cola Activa** — Contador regresivo animado con barra de progreso, posición dinámica e ID de fila único
- **Selección de Asientos** — Layout dividido (70% mapa / 30% barra lateral) con controles de Zoom interactivo, zonas interactivas (VIP/General), barra lateral reactiva (`OrderSummary`) y bottom sheet móvil
- **Datos Dinámicos por Evento** — Fila, Asientos y Checkout obtienen título, recinto, fecha e imagen del evento desde la API de InsForge sin datos estáticos
- **Temporizador de Reserva** — Componente reactivo (`ReservationTimer`) que sincroniza el tiempo de bloqueo en MM:SS con limpieza eficiente de memoria, liberando los asientos al expirar.
- **Checkout Interactivo** — Formulario de pago avanzado con menús personalizados, validaciones en tiempo real (Tarjeta, Vencimiento, CVC) y actualización de precios
- **Bloqueo de Concurrencia (Lazy Release)** — Previene colisiones al reservar temporalmente usando la tabla `seat_holds` y Server Actions dinámicas (`createHold`, `cleanExpiredHolds` de costo cero).
- **Prevención de Sobrevendidos (Overselling)** — Intercepta la restricción de unicidad (`UNIQUE Constraint` código 23505) de PostgreSQL, simulando reembolsos automáticos y mostrando un manejo de errores amigable.
- **Autenticación Segura y Defensiva** — Inicio de sesión y registro impulsado por InsForge Auth con mitigación de Fuerza Bruta (Rate Limiting) y Anti-Enumeración.
- **Seguridad Criptográfica** — OTPs encriptados con SHA-256 y validador POO (quemado de códigos automático).
- **Mapa de Asientos Multiestado** — Soporte para 5 estados en tiempo real (Disponible, Seleccionado, ReservadoTemporal, Ocupado, Bloqueado) con mapeo Tailwind.
- **Pago Exitoso** — Confirmación interactiva con renderizado multi-boleto, inyección de datos reales desde InsForge, animación de *Confetti* en CSS puro y redirección fluida a `/success` antes de la Billetera.
- **Billetera Digital Activa** — Ruta `/wallet` conectada a DB con renderizado Skeuomorphic, encapsulación POO para filtrado de eventos, y generación perezosa (lazy load) de QRs reales con brillo automático.
- **Validación y Control de Acceso** — Ruta para el *Staff* (`/validate-ticket/[token]`) que implementa una Máquina de Estados y **Actualizaciones Atómicas** en DB para prevenir fraudes por Doble Entrada.
- **Panel de Administración (RBAC)** — Dashboard protegido con Middleware Edge. Incluye CRUD de Artistas con Interfaz Optimista (`useOptimistic`) y CRUD de Eventos con validación de precios en JSONB.
- **Editor de Inventario Atómico** — Administración de asientos en `/admin` utilizando operaciones por lote ($O(1)$) y transacciones atómicas para inicializar y bloquear zonas completas.
- **Buscador Híbrido "Mega Search"** — Implementación con debounce del lado del cliente, filtrado local instantáneo (0ms latencia) y fallback SQL mediante operador `ILIKE` sobre vistas (`v_search_events`).
- **Filtrado Server-Side URL** — Sincronización de estado vía URL (`searchParams`) en `/events`, con filtrado multicriterio avanzado (`BETWEEN` para precios cruzados en `zones`) y esqueletos de carga (`Suspense`) para fluidez visual.
- **Sistema de Favoritos Resiliente** — Guardado de artistas y eventos mediante `toggleFavorite`, usando silenciamiento atómico de la restricción `UNIQUE` de PostgreSQL para prevenir fallos por colisiones de red, acompañado de una UI interactiva (`useOptimistic`) de latencia 0ms.
- **Portal de Artista** — Dashboard en `/portal` con ventas e ingresos por artista
- **Páginas Legales y Soporte** — Centro de Ayuda (`/help`) y Centro de Seguridad (`/security`) estáticos con UI Glassmorphism y FAQs interactivas nativas
- **Protección de Rutas** — Enrutamiento protegido por middleware (`proxy.ts` de Next.js 16)
- **Backend InsForge** — Base de datos PostgreSQL, autenticación, almacenamiento y funciones serverless
- **Server Actions** — Consultas a la base de datos desde Server Components de Next.js
- **Tipado Estricto** — Interfaces TypeScript que reflejan el esquema SQL
- **Diseño Responsivo** — Adaptado para móvil, tablet y escritorio
- **Código Maestro Dev** — OTP bypass (`741963`) disponible solo en `NODE_ENV=development` para pruebas rápidas

---

## 🧠 Arquitectura Avanzada

### ⚙️ Motor de Fila Virtual — Min-Heap Priority Queue

El motor de fila virtual (`lib/queue-engine.ts`) implementa una **Cola de Prioridad basada en un Min-Heap binario**, reemplazando el array lineal original con una estructura de datos que garantiza reordenamiento logarítmico.

| Operación | Complejidad Anterior | Complejidad Actual |
|---|---|---|
| `joinQueue()` | O(n) | **O(log n)** |
| `getPosition()` | O(n) | **O(1)** lookup |
| `executeCycle()` | O(n) | **O(K · log n)** |
| `removeUser()` | O(n) | **O(log n)** |

**Criterio de peso:**

```
weight = arrivalTimestamp − (isFanVerified ? FAN_BONUS_WEIGHT : 0)
```

- Peso menor = mayor prioridad (Min-Heap)
- Los fans verificados reciben un bonus de 2 minutos de ventaja
- El index map interno permite lookups `O(1)` para existencia y estado

**Ciclos de desfogue:** Cada 60 segundos se libera un lote de `K` usuarios. El valor de `K` se ajusta dinámicamente según la latencia del servidor (75% si degradado, 50% si crítico, +15% en recuperación).

### 💳 Arquitectura de Pagos — Strategy Pattern (OOP)

El sistema de pagos aplica el **patrón Strategy** para desacoplar la UI de checkout de las pasarelas de pago:

```
PaymentStrategy (abstract)
  ├── MockPaymentStrategy    ← Activa (desarrollo/demo)
  └── StripeStrategy         ← Preparada (producción)
         ↑
    PaymentContext (factory)  ← Selecciona según PAYMENT_PROVIDER env var
         ↑
    processCheckout()         ← Server Action (thin wrapper)
         ↑
    Checkout UI               ← Agnóstica — solo llama process()
```

Para cambiar de pasarela: crear una clase que extienda `PaymentStrategy`, registrarla en `PaymentContext`, cambiar `PAYMENT_PROVIDER`. **Cero cambios en la UI.**

### 🛡️ Filtro de Integridad — Detección Anti-Bot

Sistema de clasificación de comportamiento que analiza el **ritmo biométrico** del usuario para detectar bots antes de procesar reservas.

**9 reglas heurísticas ponderadas:**

| Regla | Peso | Señal de Bot |
|---|---|---|
| Click Rhythm Uniformity | 20% | σ de intervalos < 15ms |
| Mouse Linearity | 15% | >80% trazos rectos |
| Inhuman Click Speed | 15% | Intervalo mín < 50ms |
| Clicks Without Movement | 15% | <30% clics con movimiento previo |
| Session Duration | 10% | < 3 segundos |
| Mouse Speed Consistency | 10% | Coeficiente de variación < 0.10 |
| Keyboard Cadence | 5% | σ de intervalos < 10ms |
| Scroll Activity | 5% | 0 eventos de scroll |
| Mouse Angle Variation | 5% | σ ángulos < 0.05 rad |

**Veredictos:**

| Score | Veredicto | Acción |
|---|---|---|
| 0–30 | `human` | ✅ Acceso directo |
| 31–60 | `suspect` | ⚠️ Soft block — modal OTP extra |
| 61–100 | `bot` | 🚫 Hard block — acceso denegado |

**Doble validación:** El cliente clasifica localmente (`O(1)`) y envía el fingerprint al servidor, que re-clasifica independientemente y añade: rate limiting por IP, verificación de checksum FNV-1a, y detección de replay attacks.

**Costo de memoria:** ~200 bytes por sesión (ring buffers de 50 muestras, solo 3 últimas posiciones del mouse).

### 🪑 Grafo de Adyacencia — Detección de Asientos Huérfanos

El mapa de asientos trata cada sección como un **grafo con matriz de adyacencia** para detectar asientos vacíos aislados en tiempo real.

```
Cada zona = grafo de R×C nodos
Aristas = 4-connectivity (arriba, abajo, izquierda, derecha)

Asiento huérfano = nodo "available" cuyos TODOS los vecinos
                   están en estado "selected" u "occupied"
```

| Operación | Complejidad |
|---|---|
| `addZone()` | O(R × C) |
| `selectSeat()` / `deselectSeat()` | O(1) |
| `findOrphans()` | O(V + E) |
| `generateSuggestions()` | O(orphans × 4) |

**Visual:** Los asientos huérfanos pulsan en ámbar (`animate-pulse`) y el sidebar muestra sugerencias clicables: "Selecciona Fila C, Asiento 1 para evitar dejar un espacio vacío" o "Libera Fila B, Asiento 1 para abrir un espacio contiguo". Costo en servidor: **0** — todo corre en el frontend.

### 📊 Motor de Eficiencia de Venta (Analytics)

El panel admin incluye KPIs en tiempo real para monitorear el rendimiento del embudo de compra:

- **Tasa de Conversión de Ciclo** — `Usuarios que compraron / Usuarios que entraron al mapa`
- **Tiempo Medio de Ciclo (Cycle Time)** — Promedio desde salida de fila hasta pago completado
- **Cuello de Botella** — Identifica en qué paso (OTP, Mapa o Checkout) los usuarios pasan más tiempo, resaltado en rojo

### 🔌 Singleton de Base de Datos

La conexión a InsForge usa el **patrón Singleton vía `globalThis`**, garantizando una única instancia por proceso:

```typescript
// globalThis.__stagefront_insforge_singleton__
//   └── anonClient  → instancia única (anon key)
//   └── adminClient → instancia única (admin key, lazy init)
```

- **HMR (dev):** Reutiliza la instancia existente en cada hot-reload
- **Serverless:** Una conexión por proceso (previene "Too many connections")
- **Admin:** Inicialización lazy — no se crea si nadie la solicita
- **Diagnóstico:** `🔌 [Singleton] Instancia ANON creada (única por proceso)`

### 🔒 Sistema de Autenticación Defensiva

Una suite de seguridad multicapa diseñada para proteger la integridad de las credenciales y la base de datos:
- **Motor de Contraseñas O(1):** `PasswordPolicy` usa un Set (Lista Negra) en memoria y validaciones Regex aplicadas en tiempo real (frontend) y como doble validación obligatoria en Server Actions (backend).
- **Rate Limiting Anti-Fuerza Bruta:** Control de intentos de inicio de sesión persistido en `auth_attempts`. Limita a 5 intentos por IP/Email cada 15 minutos, deteniendo ataques antes de consultar a InsForge.
- **Anti-Enumeración:** El flujo de registro devuelve payloads mínimos y sanitiza inputs (`trim.toLowerCase`) para evitar minado de usuarios.
- **ErrorMapper (Hash Map):** Diccionario centralizado que traduce códigos técnicos de error a mensajes seguros y amigables (ej. `user_already_exists` → `Este correo ya está registrado`), evitando fugas de información.

### 🎫 Concurrencia de Asientos (Lazy Release Algorithm)

El problema clásico de múltiples usuarios intentando comprar el mismo boleto al mismo tiempo se resuelve sin bloquear la base de datos usando un algoritmo de *Lazy Release*:
- **Bloqueo Atómico Condicional:** `UPDATE` en lote donde `status = 'disponible' OR (status = 'reservado_temporal' AND locked_until < NOW())`.
- **Detección de Mismatch y Rollback:** Si el backend solicita 4 asientos pero la base de datos solo actualiza 3 (alguien más ganó uno milisegundos antes), se detecta la colisión, se hace *rollback* inmediato y se alerta al usuario.
- **Lazy Mapping O(n):** Al servir el mapa de asientos (`getSeats`), si el backend detecta asientos temporalmente reservados cuyo tiempo de vida de 10 minutos ya caducó, los empaqueta al vuelo como "disponibles" para el frontend sin requerir pesados *CRON jobs* de limpieza en la base de datos.

### 🔐 Máquina de Estados de OTP (POO)

El validador de OTPs para la Fila Virtual está diseñado mediante Programación Orientada a Objetos (`OTPValidator`) y sigue una estricta máquina de estados defensiva:
1. **Búsqueda O(1):** Indexada por `(user_id, event_id)` sin filtrar hash para poder reportar la razón exacta del fallo.
2. **Expiración:** Si han pasado 5 minutos, el código se "quema" (`used_at = NOW()`) instantáneamente.
3. **Bloqueo Defensivo:** Si `attempts >= 5`, se impide cualquier comparación de hash y el código se invalida permanentemente.
4. **Criptografía:** `crypto.randomInt` (CSPRNG) para generar, comparado contra la DB mediante hashing SHA-256 (nunca texto plano).
5. **Anti-Replay:** Tras un éxito, el código se quema atómicamente, impidiendo ataques de repetición.

---

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
│   ├── admin/
│   │   ├── layout.tsx               → Layout fijo con barra lateral para el administrador
│   │   ├── page.tsx                 → Dashboard general con tarjetas de métricas y tabla de ventas
│   │   ├── artists/                 → CRUD de Artistas (Client Optimista)
│   │   └── inventory/               → Editor de Inventario de Asientos (Batch Updates)
│   ├── (artist)/
│   │   ├── components/
│   │   │   └── Sidebar.tsx          → Navegación lateral del panel del artista
│   │   └── portal/
│   │       └── page.tsx             → Dashboard de ventas e ingresos por artista
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx             → Vista de inicio de sesión (Client Component)
│   │   └── register/
│   │       └── page.tsx             → Vista de creación de cuenta (Client Component)
│   ├── (fandoms)/
│   │   ├── wallet/page.tsx          → Billetera digital de boletos con diseño premium
│   │   └── [slug]/page.tsx          → Perfil del artista dinámico (/bts, /txt, etc.)
│   ├── (checkout)/
│   │   ├── event/[id]/
│   │   │   ├── page.tsx             → Layout principal de selección de asientos
│   │   │   ├── SeatSelector.tsx     → Componente legado de cuadrícula de asientos
│   │   │   ├── queue/
│   │   │   │   └── page.tsx         → Fila Virtual con OTP + simulador de cola activa
│   │   │   └── seats/
│   │   │       └── page.tsx         → Selección de asientos (split-panel + grafo de adyacencia)
│   │   ├── payment/[ticket_id]/
│   │   │   └── page.tsx             → Formulario de pago (Strategy Pattern)
│   │   └── success/page.tsx         → Confirmación de compra exitosa
│   ├── support/
│   │   ├── components/
│   │   │   ├── ContactForm.tsx      → Formulario de contacto (Client Component)
│   │   │   └── FAQAccordion.tsx     → Acordeón interactivo de preguntas (Client Component)
│   │   └── page.tsx                 → Centro de ayuda y soporte técnico
│   ├── artists/
│   │   └── page.tsx                 → Directorio de todos los artistas
│   ├── events/
│   │   ├── page.tsx                 → Cartelera con Filtro URL (Server-Side + Suspense)
│   │   ├── FilterClient.tsx         → Sincronización inmutable de URL para filtros
│   │   └── search/                  → Buscador Híbrido "Mega Search" con debounce
│   ├── api/
│   │   ├── insforge/route.ts        → Health-check del backend
│   │   ├── session/route.ts         → Endpoint GET para exponer datos de sesión a Client Components
│   │   ├── events/[id]/route.ts     → Endpoint GET para datos dinámicos del evento
│   │   ├── queue/route.ts           → Gestión de fila virtual (join, status, cycle, stats)
│   │   ├── integrity/route.ts       → Validación anti-bot del servidor (re-clasificación + rate limit)
│   │   └── admin/
│   │       └── efficiency/route.ts  → KPIs de eficiencia de venta en tiempo real
│   ├── privacy/
│   │   └── page.tsx                 → Política de privacidad (Server Component estático)
│   ├── terms/
│   │   └── page.tsx                 → Términos de servicio (Server Component estático)
│   ├── security/
│   │   └── page.tsx                 → Centro de seguridad (Server Component estático)
│   ├── help/
│   │   └── page.tsx                 → Centro de ayuda y FAQs (Server Component estático)
│   ├── globals.css
│   ├── layout.tsx                   → Layout raíz (fuentes, metadatos, dark mode)
│   └── page.tsx                     → Landing page (async, datos dinámicos)
├── components/
│   ├── Navbar.tsx                   → Barra de navegación con control de sesión
│   ├── HeroSection.tsx              → Sección hero con búsqueda
│   ├── ArtistGrid.tsx               → Grid Bento dinámico (recibe Artist[])
│   ├── AdminDashboard.tsx           → Panel admin con métricas + SalesEfficiencyPanel
│   ├── SalesEfficiencyPanel.tsx     → KPIs de eficiencia (Conversión, Cycle Time, Bottleneck)
│   ├── FavoriteButton.tsx           → Corazón interactivo de favoritos (useOptimistic)
│   └── Footer.tsx                   → Pie de página
├── hooks/
│   ├── useIntegrityFilter.ts        → Hook de filtro anti-bot (collector + clasificación)
│   └── useSeatGraph.ts              → Hook del grafo de adyacencia de asientos
├── lib/
│   ├── insforge.ts                  → Singleton DB (cliente anon + admin via globalThis)
│   ├── queue-engine.ts              → Motor de fila virtual (Min-Heap + ciclos de desfogue)
│   ├── integrity/
│   │   ├── BehaviorCollector.ts     → Recolector de señales biométricas (click, mouse, keyboard)
│   │   └── BotClassifier.ts         → Clasificador de 9 reglas heurísticas ponderadas
│   ├── graph/
│   │   └── SeatGraph.ts             → Grafo de adyacencia con detección de asientos huérfanos
│   ├── payment/
│   │   ├── index.ts                 → Re-exports del módulo de pagos
│   │   ├── PaymentStrategy.ts       → Clase abstracta (contrato de pasarela)
│   │   ├── MockPaymentStrategy.ts   → Implementación simulada (desarrollo)
│   │   ├── StripeStrategy.ts        → Stub para Stripe (producción)
│   │   └── PaymentContext.ts        → Factory que selecciona la estrategia activa
│   ├── analytics/
│   │   └── sales-efficiency.ts      → Motor de tracking del user journey (OTP → Mapa → Checkout)
│   ├── actions/
│   │   ├── admin.ts                 → Server Actions (getDashboardStats)
│   │   ├── artists.ts               → Server Actions (getArtists, getArtistBySlug)
│   │   ├── auth.ts                  → Server Actions (login, signup, logout, getSession)
│   │   ├── events.ts                → Server Actions (getEventsByArtistSlug)
│   │   ├── tickets.ts               → Server Actions (getEventById, getTicketsByEventId, lockTicket)
│   │   ├── checkout.ts              → Server Actions (processPayment y redirección)
│   │   ├── payment.ts               → Server Action (processCheckout — Strategy wrapper)
│   │   ├── orders.ts                → Server Actions (getUserTickets, getOrderConfirmation, getRelatedOrders)
│   │   ├── search.ts                → Action del Buscador Híbrido (ILIKE dinámico)
│   │   ├── seats-admin.ts           → Transacciones O(1) para inventario masivo
│   │   └── favorites.ts             → Motor resiliente de favoritos (Ignora colisiones UNIQUE)
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
- **`ticket_status`**: `disponible`, `reservado_temporal`, `ocupado`, `bloqueado`, `vendido`

## 🔌 Conexión con InsForge

El proyecto usa dos clientes definidos en `lib/insforge.ts` (Singleton):

| Cliente | Variable de entorno | Uso | Inicialización |
|---|---|---|---|
| `insforge` | `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Server/Client Components (operaciones públicas con RLS) | Eager |
| `insforgeAdmin` | `INSFORGE_ADMIN_API_KEY` | Solo Route Handlers y Server Actions (operaciones admin) | Lazy |

Ambos clientes están almacenados en `globalThis.__stagefront_insforge_singleton__` para garantizar una única instancia por proceso Node.js.

### Variables de entorno

```bash
# .env.local

# ─── InsForge (obligatorias) ───
NEXT_PUBLIC_INSFORGE_URL=https://tu-proyecto.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=eyJhbGciOi...   # JWT público (get-anon-key)
INSFORGE_ADMIN_API_KEY=ik_tu-api-key           # Solo servidor

# ─── Pasarela de pago (Strategy Pattern) ───
PAYMENT_PROVIDER=mock                          # "mock" | "stripe"
STRIPE_SECRET_KEY=sk_test_...                  # Solo si PAYMENT_PROVIDER=stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...             # Solo si PAYMENT_PROVIDER=stripe
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

## 🏗️ Patrones de Diseño Implementados

| Patrón | Ubicación | Propósito |
|---|---|---|
| **Singleton** | `lib/insforge.ts` | Una conexión DB por proceso (previene "Too many connections") |
| **Strategy** | `lib/payment/` | Desacoplamiento de pasarelas de pago (Mock/Stripe/futuras) |
| **Min-Heap** | `lib/queue-engine.ts` | Cola de prioridad O(log n) para la fila virtual |
| **Adjacency Graph** | `lib/graph/SeatGraph.ts` | Detección de asientos huérfanos en O(V+E) |
| **Observer (hooks)** | `hooks/useIntegrityFilter.ts` | Recolección reactiva de señales biométricas |
| **Factory** | `lib/payment/PaymentContext.ts` | Selección de estrategia según env var |
| **Edge RBAC** | `middleware.ts` | Verificación de acceso por rol en O(1) decodificando JWT sin consultas a DB |
| **Atomic Update** | `app/validate-ticket/` | Condición de carrera evitada mediante validación atómica en el acceso físico |
| **Optimistic UI** | `ArtistClient.tsx` | Predicción visual de mutaciones (toggle) sin bloqueo de hilo de red |
| **Hybrid Search** | `SearchClient.tsx` | Reducción de latencia de I/O de DB con filtro en memoria y debounce |
| **Batch Update** | `seats-admin.ts` | Reducción dramática de peticiones HTTP con clausuras SQL IN ($O(1)$) |
| **URL State Sync** | `FilterClient.tsx` | Preservación de estado de navegación sin side-effects locales pesados |
| **Silent Constraint Catch** | `favorites.ts` | Prevención de caídas 500 ignorando violaciones UNIQUE 23505 |

## 📈 Próximos Pasos

1. **Integración Stripe** — Instalar SDK (`stripe`, `@stripe/stripe-js`) y activar `StripeStrategy`
2. **Persistencia Redis** — Migrar el motor de fila y analytics a Redis para sobrevivir reinicios
3. **QA de Carga** — Pruebas de estrés en el Min-Heap y Strategy under high concurrency
4. **Dashboard Realtime** — WebSocket para actualizar KPIs de eficiencia sin polling

## 🔧 Actualizaciones Recientes (Resolución de Build)

- **Conflictos de Middleware**: Se eliminó `middleware.ts` en favor de `proxy.ts` resolviendo colisiones durante el build en Next.js.
- **Tipados de Base de Datos**: Se actualizaron propiedades faltantes (`description` e `is_active`) en la interfaz `Artist` dentro de `lib/types/database.ts`.
- **Filtros SQL Dinámicos**: Se ajustó la consulta condicional en `lib/actions/events.ts` previniendo un `ParserError` del tipado estricto de Supabase/InsForge.
- **SDK de Autenticación**: Se corrigió el llamado inexistente a `insforge.auth.getUser()` utilizando nuestra propia función de sesión `getSession()` en `lib/actions/favorites.ts`.
- **Promesas en Server Components (Next.js 15+)**: Se ajustó `app/events/page.tsx` para procesar `searchParams` de forma asíncrona, resolviendo un error de Prerenderizado de Turbopack (`TypeError: Cannot convert a Symbol value to a string`).

## 📄 Licencia

© 2026 StageFront Tickets Ecosystem. Todos los derechos reservados.
