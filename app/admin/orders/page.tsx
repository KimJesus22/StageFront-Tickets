import { AdminService } from "@/lib/services/adminService";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminOrdersPage() {
  const orders = await AdminService.getRecentOrders(); // Usamos la misma función para mantener la demo, en un entorno real habría paginación

  const columns = [
    { key: "id", label: "Order ID" },
    { key: "event", label: "Event" },
    { key: "customer", label: "Customer" },
    { key: "amount", label: "Amount", isAmount: true },
    { key: "status", label: "Status", isStatus: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white tracking-tight">Orders History</h2>
          <p className="font-['Inter'] text-zinc-400 mt-1">Track financial transactions across all events.</p>
        </div>
      </div>

      <AdminTable 
        title="All Transactions"
        columns={columns}
        data={orders}
      />
    </div>
  );
}
