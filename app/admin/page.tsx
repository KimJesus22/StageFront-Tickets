import { AdminService } from "@/lib/services/adminService";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminDashboardPage() {
  const overview = await AdminService.getOverviewData();
  const recentOrders = await AdminService.getRecentOrders();

  const columns = [
    { key: "id", label: "Order ID" },
    { key: "event", label: "Event" },
    { key: "customer", label: "Customer" },
    { key: "amount", label: "Amount", isAmount: true },
    { key: "status", label: "Status", isStatus: true },
  ];

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white tracking-tight">Overview</h2>
          <p className="font-['Inter'] text-zinc-400 mt-1">Real-time telemetry for global ticketing ecosystem.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-colors px-4 py-2 rounded-lg font-['Inter'] text-[12px] uppercase tracking-widest text-white flex items-center gap-2 font-semibold">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Last 30 Days
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20">
          <div className="flex justify-between items-start mb-4">
            <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-zinc-400 font-semibold">Total Revenue</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-md">
              <span className="material-symbols-outlined text-emerald-400 text-sm">payments</span>
            </div>
          </div>
          <div className="font-['Space_Grotesk'] text-4xl font-bold text-white mb-2">{overview.totalRevenue}</div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-emerald-400 flex items-center font-medium"><span className="material-symbols-outlined text-[16px]">arrow_upward</span> 14.5%</span>
            <span className="text-zinc-500">vs last period</span>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20">
          <div className="flex justify-between items-start mb-4">
            <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-zinc-400 font-semibold">Active Users</span>
            <div className="p-1.5 bg-sky-500/10 rounded-md">
              <span className="material-symbols-outlined text-sky-400 text-sm">group</span>
            </div>
          </div>
          <div className="font-['Space_Grotesk'] text-4xl font-bold text-white mb-2">{overview.activeUsers.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-emerald-400 flex items-center font-medium"><span className="material-symbols-outlined text-[16px]">arrow_upward</span> 5.2%</span>
            <span className="text-zinc-500">vs last period</span>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20">
          <div className="flex justify-between items-start mb-4">
            <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-zinc-400 font-semibold">Tickets Issued</span>
            <div className="p-1.5 bg-amber-500/10 rounded-md">
              <span className="material-symbols-outlined text-amber-400 text-sm">confirmation_number</span>
            </div>
          </div>
          <div className="font-['Space_Grotesk'] text-4xl font-bold text-white mb-2">{overview.ticketsIssued.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-rose-400 flex items-center font-medium"><span className="material-symbols-outlined text-[16px]">arrow_downward</span> 2.1%</span>
            <span className="text-zinc-500">vs last period</span>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20">
          <div className="flex justify-between items-start mb-4">
            <span className="font-['Inter'] text-[12px] uppercase tracking-widest text-zinc-400 font-semibold">Live Events</span>
            <div className="p-1.5 bg-purple-500/10 rounded-md">
              <span className="material-symbols-outlined text-purple-400 text-sm">sensors</span>
            </div>
          </div>
          <div className="font-['Space_Grotesk'] text-4xl font-bold text-white mb-2">{overview.liveEvents.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-emerald-400 flex items-center font-medium"><span className="material-symbols-outlined text-[16px]">arrow_upward</span> 12.0%</span>
            <span className="text-zinc-500">vs last period</span>
          </div>
        </div>
      </div>

      <AdminTable 
        title="Recent Transactions"
        columns={columns}
        data={recentOrders}
        viewAllLink="/admin/orders"
      />
    </div>
  );
}
