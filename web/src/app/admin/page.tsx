import AdminDashboard from "@/components/admin/AdminDashboard";
import { getDashboardData } from "@/lib/admin/getDashboardData";

export default async function AdminPage() {
  const data = await getDashboardData();

  return (
    <div className="admin-shell">
      <div className="admin-page-content">
        <AdminDashboard data={data} />
      </div>
    </div>
  );
}
