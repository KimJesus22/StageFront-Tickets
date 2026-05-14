import { AdminService } from "@/lib/services/adminService";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminUsersPage() {
  const users = await AdminService.getUsers();

  const columns = [
    { key: "id", label: "User ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status", isStatus: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white tracking-tight">Users Management</h2>
          <p className="font-['Inter'] text-zinc-400 mt-1">Manage platform administrators and customers.</p>
        </div>
      </div>

      <AdminTable 
        title="Registered Users"
        columns={columns}
        data={users}
      />
    </div>
  );
}
