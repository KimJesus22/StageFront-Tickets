"use server";

import { headers } from "next/headers";
import { insforgeAdmin } from "@/lib/insforge";

export async function logEvent(
  userId: string | null,
  eventType: string,
  description: string,
  metadata?: Record<string, any>
) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    if (!insforgeAdmin) return;

    // Fire and forget (Promise run in background, catching errors to not block the main thread)
    Promise.resolve(
      insforgeAdmin.database
        .from("audit_logs")
        .insert({
          user_id: userId,
          event_type: eventType,
          description,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: metadata || null,
        })
    ).then(({ error }) => {
      if (error) console.error("[Logger] DB Error:", error);
    }).catch((err) => {
      console.error("[Logger] Network/SDK Error:", err);
    });
  } catch (error) {
    // Si falla al capturar headers (ej. llamado fuera de un contexto request), no interrumpimos
    console.error("[Logger] Unexpected error:", error);
  }
}
