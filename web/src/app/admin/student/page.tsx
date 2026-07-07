import { Suspense } from "react";
import AdminStudentPageClient from "@/components/AdminStudentPageClient";

export default function AdminStudentPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-shell">
          <div className="admin-page-content">
            <p className="text-[15px] text-muted">Loading student…</p>
          </div>
        </div>
      }
    >
      <AdminStudentPageClient />
    </Suspense>
  );
}
