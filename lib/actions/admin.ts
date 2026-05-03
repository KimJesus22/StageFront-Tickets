"use server";

import { insforgeAdmin } from "@/lib/insforge";

export async function getDashboardStats() {
  if (!insforgeAdmin) {
    throw new Error("Admin SDK not initialized");
  }

  // 1. Obtener todos los montos para calcular totales (Revenue & Count)
  // Nota: En producción masiva, se recomendaría usar una función RPC en PostgreSQL para el SUM.
  const { data: allOrders, error: statsError } = await insforgeAdmin.database
    .from("orders")
    .select("amount_paid");

  if (statsError) {
    console.error("Error fetching stats:", statsError);
    throw new Error("Error obteniendo estadísticas");
  }

  const totalTicketsSold = allOrders.length;
  const totalRevenue = allOrders.reduce((acc, order) => acc + (order.amount_paid || 0), 0);

  // 2. Obtener los 5 pedidos más recientes con JOIN
  const { data: recentOrders, error: recentError } = await insforgeAdmin.database
    .from("orders")
    .select(`
      *,
      tickets_inventory (
        zone,
        seat_number,
        events (
          title
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentError) {
    console.error("Error fetching recent orders:", recentError);
  }

  return {
    totalTicketsSold,
    totalRevenue,
    recentOrders: recentOrders || [],
  };
}
