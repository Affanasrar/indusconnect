import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import EmployeeDashboard from "../components/dashboard/roles/EmployeeDashboard";
import OperationsDashboard from "../components/dashboard/roles/OperationsDashboard";
import OrganizationAdminDashboard from "../components/dashboard/roles/OrganizationAdminDashboard";
import FinanceDashboard from "../components/dashboard/roles/FinanceDashboard";
import DriverDashboard from "../components/dashboard/roles/DriverDashboard";
import { Shield } from "lucide-react";

export default function DashboardPage() {
  const { bootstrap, user } = useAuth();
  const userRole = (bootstrap?.role || user?.role?.name || "EMPLOYEE").toUpperCase();

  // Allow Super Admin to preview other role perspectives seamlessly
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const [activeViewRole, setActiveViewRole] = useState<string>(userRole);

  const effectiveRole = isSuperAdmin ? activeViewRole : userRole;

  return (
    <div className="space-y-4">
      {/* Super Admin Role Perspective Switcher */}
      {isSuperAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-[#DCE5F0] bg-slate-50/90 p-3 text-xs">
          <div className="flex items-center gap-2 text-[#102644]">
            <Shield size={16} className="text-[#1769E0]" />
            <span className="font-bold">Admin Perspective Switcher:</span>
            <span className="text-[#64748B]">Preview the dashboard as different enterprise roles</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "SUPER_ADMIN", label: "Organization" },
              { id: "MANAGER", label: "Operations" },
              { id: "EMPLOYEE", label: "Employee" },
              { id: "FINANCE_OFFICER", label: "Finance" },
              { id: "DRIVER", label: "Driver" },
            ].map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveViewRole(role.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  effectiveRole === role.id
                    ? "bg-[#102644] text-white shadow-2xs"
                    : "bg-white text-slate-700 border border-[#DCE5F0] hover:bg-slate-100"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render matching Role-Based Dashboard */}
      {effectiveRole === "SUPER_ADMIN" && <OrganizationAdminDashboard />}
      {effectiveRole === "EMPLOYEE" && <EmployeeDashboard />}
      {effectiveRole === "FINANCE_OFFICER" && <FinanceDashboard />}
      {effectiveRole === "DRIVER" && <DriverDashboard />}
      {(effectiveRole === "MANAGER" ||
        effectiveRole === "TRANSPORT_ADMIN" ||
        effectiveRole === "ACCOMMODATION_ADMIN" ||
        effectiveRole === "SECURITY_OFFICER") && <OperationsDashboard />}
    </div>
  );
}