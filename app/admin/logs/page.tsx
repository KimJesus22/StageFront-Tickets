import { verifyAdmin } from "@/lib/actions/auth";
import { insforgeAdmin } from "@/lib/insforge";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; time?: string }>;
}) {
  // Aseguramos que solo los administradores puedan acceder
  try {
    await verifyAdmin();
  } catch (err) {
    redirect("/");
  }

  const { type, time } = await searchParams;

  if (!insforgeAdmin) {
    throw new Error("Admin client not configured");
  }

  // Construir la consulta a la tabla de logs
  let query = insforgeAdmin.database
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Filtro básico por tipo de evento
  if (type && type !== "all") {
    if (type === "success") {
      query = query.in("event_type", ["LOGIN_SUCCESS", "REGISTER", "ORDER_CREATED", "TICKET_GENERATED", "SEAT_RESERVED"]);
    } else if (type === "failure") {
      query = query.in("event_type", ["LOGIN_FAILED", "OTP_FAILED"]);
    } else if (type === "admin") {
      query = query.eq("event_type", "ADMIN_EDIT_EVENT");
    }
  }

  // Filtro por tiempo
  if (time) {
    const now = new Date();
    if (time === "24h") {
      now.setHours(now.getHours() - 24);
      query = query.gte("created_at", now.toISOString());
    } else if (time === "7d") {
      now.setDate(now.getDate() - 7);
      query = query.gte("created_at", now.toISOString());
    } else if (time === "30d") {
      now.setDate(now.getDate() - 30);
      query = query.gte("created_at", now.toISOString());
    }
  }

  const { data: logs, error } = await query;

  if (error) {
    console.error("Error cargando logs:", error);
  }

  // Helper para determinar el estilo visual según el tipo de log
  const getLogStyle = (eventType: string) => {
    if (["LOGIN_SUCCESS", "REGISTER", "ORDER_CREATED", "TICKET_GENERATED", "SEAT_RESERVED"].includes(eventType)) {
      return {
        label: "Success",
        containerClass: "border-[#4ade80]/30 bg-[#4ade80]/10 text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.15)]",
        dotClass: "bg-[#4ade80] animate-pulse",
        rowClass: "hover:bg-white/[0.03]",
      };
    }
    if (["LOGIN_FAILED", "OTP_FAILED"].includes(eventType)) {
      return {
        label: "Failure",
        containerClass: "border-error/30 bg-error/10 text-error shadow-[0_0_12px_rgba(255,180,171,0.15)]",
        dotClass: "bg-error",
        rowClass: "bg-error-container/10 hover:bg-white/[0.03]",
      };
    }
    if (["ADMIN_EDIT_EVENT"].includes(eventType)) {
      return {
        label: "Admin Action",
        containerClass: "border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#60a5fa] shadow-[0_0_12px_rgba(96,165,250,0.15)]",
        dotClass: "bg-[#60a5fa]",
        rowClass: "hover:bg-white/[0.03]",
      };
    }
    return {
      label: eventType,
      containerClass: "border-white/30 bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]",
      dotClass: "bg-white",
      rowClass: "hover:bg-white/[0.03]",
    };
  };

  return (
    <div className="pt-24 px-margin-desktop pb-margin-desktop flex-1 flex flex-col max-w-container-max mx-auto w-full">
      {/* TopAppBar simulado */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center h-16 px-gutter font-label-caps text-label-caps">
        <div className="flex items-center gap-stack-md">
          <span className="font-headline-sm text-headline-sm tracking-tight text-primary">Admin Core</span>
          <span className="text-on-surface-variant opacity-50">/</span>
          <span className="text-on-surface font-semibold uppercase tracking-wider">Audit Logs</span>
        </div>
        <div className="flex items-center gap-stack-md">
          <div className="relative focus-within:ring-1 focus-within:ring-primary rounded-lg overflow-hidden flex items-center bg-white/5 border border-white/10 h-8 px-stack-sm group hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-unit">search</span>
            <input className="bg-transparent border-none text-on-surface font-body-md text-body-md focus:ring-0 placeholder:text-on-surface-variant/50 w-64 h-full p-0 outline-none" placeholder="Search Logs..." type="text" />
          </div>
        </div>
      </header>

      {/* Filtros y Controles */}
      <div className="flex items-center justify-between mb-stack-md">
        <h2 className="font-headline-lg text-headline-lg text-primary">System Audit Trail</h2>
        <div className="flex gap-stack-sm">
          <form className="flex gap-stack-sm" method="GET">
            <div className="relative">
              <select name="type" defaultValue={type || "all"} onChange={(e) => e.target.form?.submit()} className="appearance-none bg-white/5 border border-white/10 rounded-lg py-unit pl-stack-sm pr-10 text-on-surface font-body-md text-body-md hover:bg-white/10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors h-10">
                <option className="bg-surface text-on-surface" value="all">All Event Types</option>
                <option className="bg-surface text-on-surface" value="success">Success</option>
                <option className="bg-surface text-on-surface" value="failure">Failure</option>
                <option className="bg-surface text-on-surface" value="admin">Admin Action</option>
              </select>
              <span className="material-symbols-outlined absolute right-stack-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
            </div>
            <div className="relative">
              <select name="time" defaultValue={time || "all"} onChange={(e) => e.target.form?.submit()} className="appearance-none bg-white/5 border border-white/10 rounded-lg py-unit pl-stack-sm pr-10 text-on-surface font-body-md text-body-md hover:bg-white/10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors h-10">
                <option className="bg-surface text-on-surface" value="all">All Time</option>
                <option className="bg-surface text-on-surface" value="24h">Last 24 Hours</option>
                <option className="bg-surface text-on-surface" value="7d">Last 7 Days</option>
                <option className="bg-surface text-on-surface" value="30d">Last 30 Days</option>
              </select>
              <span className="material-symbols-outlined absolute right-stack-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de Auditoría de Alta Densidad (Contenedor Glassmorphism) */}
      <div className="bg-surface-container-low/50 backdrop-blur-[20px] border border-white/10 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="py-stack-sm px-gutter font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Timestamp (UTC)</th>
                <th className="py-stack-sm px-gutter font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Event Type</th>
                <th className="py-stack-sm px-gutter font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest whitespace-nowrap">User / Actor</th>
                <th className="py-stack-sm px-gutter font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest w-full">Description</th>
                <th className="py-stack-sm px-gutter font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-right">IP</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md divide-y divide-white/5">
              {logs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs?.map((log) => {
                  const style = getLogStyle(log.event_type);
                  return (
                    <tr key={log.id} className={`${style.rowClass} transition-colors group`}>
                      <td className="py-stack-sm px-gutter font-mono text-sm text-on-surface-variant whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("sv-SE")}
                      </td>
                      <td className="py-stack-sm px-gutter whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${style.containerClass} text-xs font-semibold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`}></span>
                          {style.label}
                        </span>
                      </td>
                      <td className="py-stack-sm px-gutter font-mono text-sm text-on-surface whitespace-nowrap">
                        {log.user_id ? log.user_id.split("-")[0] : "anonymous"}
                      </td>
                      <td className="py-stack-sm px-gutter text-on-surface-variant truncate max-w-md">
                        {log.description}
                      </td>
                      <td className="py-stack-sm px-gutter text-right text-sm text-on-surface-variant">
                        {log.ip_address}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de página con Paginación */}
        <div className="border-t border-white/10 bg-white/5 py-stack-sm px-gutter flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant">
          <span>Mostrando los últimos {logs?.length || 0} registros</span>
          <div className="flex gap-unit items-center">
            <button className="p-1 rounded hover:bg-white/10 hover:text-primary transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="px-2 font-mono">1</span>
            <button className="p-1 rounded hover:bg-white/10 hover:text-primary transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
