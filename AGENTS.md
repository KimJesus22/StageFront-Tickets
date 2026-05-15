<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ⚠️ Stack-Specific Rules — READ BEFORE WRITING ANY CODE

## 1. Next.js 16 — NOT 15

- **Use `proxy.ts`**, NOT `middleware.ts`. Middleware was replaced by Proxy in Next.js 16.
- Both files CANNOT coexist — the build will fail.
- The proxy file exports a default function: `export default function proxy(request: NextRequest) { ... }`

## 2. InsForge SDK — NOT Supabase

This project uses `@insforge/sdk`, **NOT** `@supabase/ssr` or `@supabase/supabase-js`.
The APIs are DIFFERENT. Do NOT copy Supabase patterns.

### Auth methods that DO NOT EXIST:
- ❌ `insforge.auth.getUser()` — Use `getSession()` from `@/lib/actions/auth`
- ❌ `insforge.auth.updateUser()` — Use `insforge.auth.resetPassword()` flow
- ❌ `insforge.auth.getSession()` — Use cookie-based `getSession()` from `@/lib/actions/auth`

### Realtime — NOT Supabase channels:
- ❌ `insforge.channel()` — Does not exist
- ❌ `insforge.removeChannel()` — Does not exist
- ✅ `insforge.realtime.connect()` → establish WebSocket
- ✅ `insforge.realtime.subscribe('channel-name')` → join channel
- ✅ `insforge.realtime.on('event', callback)` → listen for events
- ✅ `insforge.realtime.unsubscribe('channel-name')` → leave channel
- ✅ `insforge.realtime.disconnect()` → close connection

### Auth singleton:
- `insforge` (anon client) — safe for Client + Server Components
- `insforgeAdmin` (admin client) — Server only, type is `InsforgeClient | null`, ALWAYS null-check before use

## 3. Zod v4 — NOT v3

### Breaking changes from Zod v3:
- ❌ `z.string({ required_error: "..." })` → ✅ `z.string({ error: "..." })`
- ❌ `z.number({ invalid_type_error: "..." })` → ✅ `z.number({ error: "..." })`
- ❌ `.error.errors[0].message` → ✅ `.error.issues[0].message`
- The `ZodError` object has `.issues`, NOT `.errors`

## 4. Session Pattern

This project uses **cookie-based sessions**, not JWT tokens from the SDK.

```ts
// ✅ CORRECT — How to get the current user in Server Components / Server Actions:
import { getSession } from "@/lib/actions/auth";
const session = await getSession();
// session = { id, email, name, accessToken, role }

// ❌ WRONG — These do NOT exist:
// insforge.auth.getUser()
// insforge.auth.getSession()
```
