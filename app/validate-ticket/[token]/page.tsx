import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { insforge } from "@/lib/insforge";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SERVER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default async function ValidateTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();

  // 1. Seguridad: Verificación de sesión
  if (!session) {
    redirect("/login");
  }

  // Verificar rol (Asumimos la tabla "profiles". Si falla o no es admin/staff, denegamos)
  const { data: profile, error: profileError } = await insforge.database
    .from("profiles")
    .select("role")
    .eq("id", session.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "staff") {
    return (
      <EstadoInexistente
        titulo="ACCESO RESTRINGIDO"
        mensaje="Esta ruta es exclusiva para personal autorizado."
      />
    );
  }

  // 2. Búsqueda O(1) del token exacto
  // Utilizamos tickets_inventory ya que es la tabla que guarda el inventario real
  // Si tu tabla se llama literalmente "tickets", cambia esto a "tickets"
  const { data: ticket, error: searchError } = await insforge.database
    .from("tickets_inventory")
    .select("*, events(title)")
    .eq("id", token) // Asumiendo que el token QR es el ID del ticket o usar unique_token
    .single();

  // 3. Algoritmo de Validación
  if (searchError || !ticket) {
    return <EstadoInexistente />;
  }

  if (ticket.status === "cancelled") {
    return <EstadoCancelado />;
  }

  if (ticket.status === "used") {
    return <EstadoYaUsado time={ticket.used_at} />;
  }

  // 4. Actualización Atómica (Prevención de Doble Entrada)
  if (ticket.status === "active" || !ticket.status) {
    const now = new Date().toISOString();
    
    // UPDATE atómico: solo afecta si el status sigue siendo 'active'
    const { data: updatedData, error: updateError } = await insforge.database
      .from("tickets_inventory")
      .update({ status: "used", used_at: now })
      .eq("id", token)
      .eq("status", ticket.status) // asegura que nadie lo cambió mientras tanto
      .select();

    // Si retornó 0 filas (alguien más lo escaneó fracciones de segundo antes)
    if (updateError || !updatedData || updatedData.length === 0) {
      return <EstadoYaUsado time="Recientemente" />;
    }

    // 1 fila afectada -> Éxito
    return <EstadoValido zone={ticket.zone} seat={ticket.seat_number} />;
  }

  return <EstadoInexistente />;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES DE ESTADO (UI basda en el diseño de Stich)
// ─────────────────────────────────────────────────────────────────────────────

const BackgroundTexture = () => (
  <div
    className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center mix-blend-overlay"
    style={{
      backgroundImage:
        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAmjD5n0u8i0cJHh79dMxwY1LHpf0ZPiGyHL_9epDsKJmQy10lfUaPodPnYszBddLHuvWLqQvuTi9ZaYfOVyEid-p4RWr8GSvYWtsQrBzh1aogA4KPhnjCkm066nVEaOhnYf0Fa9_dbIoFK2sOBYfyWBx2NI_tFCz5Fy5yDJ8g3ZtYrcL-aQtn4xvmA-hAsBAZ7J-oW3HwQrFlhq80M3-jzcfcnZwfvuLEnw_LsETNWbgWb7qV2cfmgk0INyl5HJlhzfmcbgy3pNu4')",
    }}
  />
);

function EstadoValido({ zone, seat }: { zone?: string; seat?: string }) {
  return (
    <div className="bg-background text-on-background antialiased min-h-screen w-full flex flex-col font-['Inter'] dark">
      <BackgroundTexture />
      <section className="min-h-screen w-full relative flex flex-col justify-between p-6 z-10 bg-surface-container-lowest">
        <header className="w-full flex justify-between items-center px-4 py-2">
          <span className="text-[12px] text-outline uppercase tracking-widest font-semibold">
            Portal Sur
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[12px] text-on-surface-variant font-semibold">
              Online
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
          <div className="w-full flex flex-col items-center justify-center p-12 rounded-[2rem] bg-surface/40 backdrop-blur-3xl border border-primary/30 shadow-[0_0_60px_rgba(255,255,255,0.05)] relative overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/10 rounded-full blur-[80px]"></div>
            <span
              className="material-symbols-outlined text-[140px] text-primary mb-6 relative z-10"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-bold text-primary text-center mb-2 relative z-10 tracking-tight">
              ACCESO PERMITIDO
            </h1>
            <p className="text-lg text-on-surface-variant text-center relative z-10">
              {zone || "General"} - {seat || "Asiento Libre"}
            </p>
          </div>
        </main>

        <footer className="w-full max-w-md mx-auto pb-8">
          <Link href="/scan" className="w-full py-6 rounded-full bg-primary text-on-primary font-['Space_Grotesk'] text-2xl font-medium flex justify-center items-center gap-4 hover:bg-tertiary transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Escanear Siguiente Boleto
          </Link>
        </footer>
      </section>
    </div>
  );
}

function EstadoYaUsado({ time }: { time?: string }) {
  const displayTime = time
    ? new Date(time).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) + " hrs"
    : "Desconocida";

  return (
    <div className="bg-background text-on-background antialiased min-h-screen w-full flex flex-col font-['Inter'] dark">
      <BackgroundTexture />
      <section className="min-h-screen w-full relative flex flex-col justify-between p-6 z-10 bg-surface-container">
        <header className="w-full flex justify-between items-center px-4 py-2">
          <span className="text-[12px] text-outline uppercase tracking-widest font-semibold">
            Portal Sur
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[12px] text-on-surface-variant font-semibold">
              Online
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
          <div className="w-full flex flex-col items-center justify-center p-12 rounded-[2rem] bg-surface-variant/50 backdrop-blur-3xl border border-outline-variant relative overflow-hidden">
            <span
              className="material-symbols-outlined text-[120px] text-on-surface-variant mb-6 relative z-10"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history
            </span>
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-on-surface text-center mb-4 relative z-10 tracking-tight">
              ACCESO DENEGADO
            </h2>
            <div className="bg-surface/50 px-6 py-3 rounded-full border border-outline-variant/50 relative z-10">
              <p className="text-lg text-inverse-surface text-center font-semibold">
                Ya escaneado
              </p>
            </div>
            <p className="text-base text-on-surface-variant text-center mt-4 relative z-10">
              Escaneado a las {displayTime}
            </p>
          </div>
        </main>

        <footer className="w-full max-w-md mx-auto pb-8">
          <Link href="/scan" className="w-full py-6 rounded-full bg-surface-bright text-on-surface font-['Space_Grotesk'] text-2xl font-medium flex justify-center items-center gap-4 hover:bg-surface-variant transition-colors border border-outline-variant active:scale-95 duration-200">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Escanear Siguiente Boleto
          </Link>
        </footer>
      </section>
    </div>
  );
}

function EstadoCancelado() {
  return (
    <div className="bg-background text-on-background antialiased min-h-screen w-full flex flex-col font-['Inter'] dark">
      <BackgroundTexture />
      <section className="min-h-screen w-full relative flex flex-col justify-between p-6 z-10 bg-[#2d0a0a]">
        <div className="absolute inset-0 bg-error-container/20 backdrop-blur-sm -z-10"></div>
        <header className="w-full flex justify-between items-center px-4 py-2">
          <span className="text-[12px] text-error-container uppercase tracking-widest font-semibold">
            Portal Sur
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span className="text-[12px] text-error-container font-semibold">
              Online
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
          <div className="w-full flex flex-col items-center justify-center p-12 rounded-[2rem] bg-error-container/40 backdrop-blur-3xl border border-error/50 shadow-[0_0_80px_rgba(255,180,171,0.1)] relative overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-error/10 rounded-full blur-[80px]"></div>
            <span
              className="material-symbols-outlined text-[120px] text-error mb-6 relative z-10"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-error text-center mb-4 relative z-10 tracking-tight">
              ACCESO DENEGADO
            </h2>
            <div className="bg-surface/80 px-6 py-3 rounded-full border border-error/30 relative z-10">
              <p className="text-lg text-error-container text-center font-semibold">
                Cancelado
              </p>
            </div>
          </div>
        </main>

        <footer className="w-full max-w-md mx-auto pb-8">
          <Link href="/scan" className="w-full py-6 rounded-full bg-error text-on-error font-['Space_Grotesk'] text-2xl font-medium flex justify-center items-center gap-4 hover:opacity-80 transition-opacity active:scale-95 duration-200">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Escanear Siguiente Boleto
          </Link>
        </footer>
      </section>
    </div>
  );
}

function EstadoInexistente({ titulo = "FRAUDE", mensaje = "Retener documento e informar a supervisión inmediatamente." }: { titulo?: string; mensaje?: string }) {
  return (
    <div className="bg-background text-on-background antialiased min-h-screen w-full flex flex-col font-['Inter'] dark">
      <BackgroundTexture />
      <section className="min-h-screen w-full relative flex flex-col justify-between p-6 z-10 bg-surface-container-highest overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wLDRMNCwweiIgc3Ryb2tlPSIjZmYwMDAwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] pointer-events-none"></div>
        <header className="w-full flex justify-between items-center px-4 py-2 relative z-10">
          <span className="text-[12px] text-error uppercase tracking-widest font-semibold">
            Portal Sur
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span className="text-[12px] text-error font-semibold">
              Alerta
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto relative z-10">
          <div className="w-full flex flex-col items-center justify-center p-12 rounded-[2rem] bg-surface-container-lowest/90 backdrop-blur-xl border-2 border-error relative overflow-hidden">
            <span
              className="material-symbols-outlined text-[140px] text-error mb-6 relative z-10"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <h1 className="font-['Space_Grotesk'] text-5xl md:text-6xl font-bold text-error text-center mb-2 relative z-10 tracking-tighter">
              {titulo}
            </h1>
            {titulo === "FRAUDE" && (
              <p className="font-['Space_Grotesk'] text-2xl font-medium text-on-surface text-center relative z-10 uppercase tracking-widest mt-2">
                Inexistente
              </p>
            )}
            <p className="text-base text-outline text-center mt-8 relative z-10">
              {mensaje}
            </p>
          </div>
        </main>

        <footer className="w-full max-w-md mx-auto pb-8 relative z-10">
          <Link href="/scan" className="w-full py-6 rounded-full bg-surface-container text-on-surface font-['Space_Grotesk'] text-2xl font-medium flex justify-center items-center gap-4 hover:bg-surface-variant transition-colors border-2 border-error/50 active:scale-95 duration-200">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Escanear Siguiente Boleto
          </Link>
        </footer>
      </section>
    </div>
  );
}
