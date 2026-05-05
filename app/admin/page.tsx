import { getDashboardStats } from "@/lib/actions/admin";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata = {
  title: "Admin Dashboard - StageFront Tickets",
};

export default async function AdminPage() {
  const stats = await getDashboardStats();

  return <AdminDashboard stats={stats} />;
}
