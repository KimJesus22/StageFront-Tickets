import { AdminService } from "@/lib/services/adminService";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminTicketsPage() {
  const tickets = await AdminService.getTickets();

  const columns = [
    { key: "id", label: "Ticket ID" },
    { key: "event", label: "Event" },
    { key: "zone", label: "Zone" },
    { key: "seat", label: "Seat" },
    { key: "status", label: "Status", isStatus: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white tracking-tight">Tickets Inventory</h2>
          <p className="font-['Inter'] text-zinc-400 mt-1">Audit minted tickets and access statuses.</p>
        </div>
      </div>

      <AdminTable 
        title="Live Inventory"
        columns={columns}
        data={tickets}
      />
    </div>
  );
}
