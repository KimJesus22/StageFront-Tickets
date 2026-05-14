import { AdminService } from "@/lib/services/adminService";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminEventsPage() {
  const events = await AdminService.getEvents();

  const columns = [
    { key: "id", label: "Event ID" },
    { key: "title", label: "Title" },
    { key: "date", label: "Date" },
    { key: "venue", label: "Venue" },
    { key: "status", label: "Status", isStatus: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white tracking-tight">Events Management</h2>
          <p className="font-['Inter'] text-zinc-400 mt-1">Create and manage upcoming live experiences.</p>
        </div>
        <button className="bg-primary text-on-primary font-['Inter'] text-[12px] uppercase tracking-widest font-bold py-3 px-6 rounded-lg hover:bg-white/90 transition-colors">
          Create Event
        </button>
      </div>

      <AdminTable 
        title="All Events"
        columns={columns}
        data={events}
      />
    </div>
  );
}
