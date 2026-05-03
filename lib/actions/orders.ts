"use server";

import { insforge } from "@/lib/insforge";
import { getSession } from "./auth";

export async function getUserTickets() {
  const session = await getSession();
  if (!session?.email) {
    return [];
  }

  const { data, error } = await insforge.database
    .from("orders")
    .select(`
      *,
      tickets_inventory (
        *,
        events (
          *,
          artists (*)
        )
      )
    `)
    .eq("user_email", session.email)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener los boletos del usuario:", error);
    return [];
  }

  return data || [];
}
