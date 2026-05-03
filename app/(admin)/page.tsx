import { getDashboardStats } from "@/lib/actions/admin";

export default async function AdminDashboardPage() {
  const { totalTicketsSold, totalRevenue, recentOrders } = await getDashboardStats();

  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Dashboard General</h1>
        <p className="font-body-md text-zinc-400">Resumen de la plataforma y métricas de ventas en tiempo real.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-4 text-zinc-400">
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">attach_money</span>
            <h3 className="font-label-caps text-sm tracking-wider">INGRESOS TOTALES</h3>
          </div>
          <p className="font-display-md text-4xl font-bold text-white">
            ${totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-4 text-zinc-400">
            <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">confirmation_number</span>
            <h3 className="font-label-caps text-sm tracking-wider">BOLETOS VENDIDOS</h3>
          </div>
          <p className="font-display-md text-4xl font-bold text-white">
            {totalTicketsSold.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-headline-md text-xl font-bold text-white">Ventas Recientes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-md text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Evento</th>
                <th className="px-6 py-4 font-semibold">Boleto</th>
                <th className="px-6 py-4 font-semibold">Monto</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {recentOrders.map((order) => {
                const ticket = order.tickets_inventory;
                const event = ticket?.events;

                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{order.user_name}</p>
                      <p className="text-xs text-zinc-500">{order.user_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{event?.title || "Evento Desconocido"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono">
                        {ticket?.zone} - {ticket?.seat_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">
                      ${order.amount_paid}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {dateFormatter.format(new Date(order.created_at))}
                    </td>
                  </tr>
                );
              })}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Aún no hay ventas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
