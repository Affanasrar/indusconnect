import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Bus,
  Receipt,
  ShieldCheck,
  Truck,
  FileSpreadsheet,
  Settings,
  ExternalLink,
} from "lucide-react";
import PageHeader from "../shared/PageHeader";
import KpiCard from "../shared/KpiCard";
import NeedsAttentionList, { type AttentionItem } from "../shared/NeedsAttentionList";
import RecentActivityList, { type ActivityItem } from "../shared/RecentActivityList";
import TransportOverviewMap from "../shared/TransportOverviewMap";
import { KpiSkeleton } from "../shared/LoadingState";
import ErrorState from "../shared/ErrorState";
import { http } from "../../../api/http";

export default function OrganizationAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const autoRefreshTimerRef = useRef<any>(null);

  const loadAdminData = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setHasError(false);

      const [dashRes, approvalsRes, auditRes] = await Promise.allSettled([
        http.get("/reports/dashboard"),
        http.get("/reports/pending-approvals"),
        http.get("/audit-logs"),
      ]);

      if (dashRes.status === "fulfilled") {
        setDashboardData(dashRes.value.data.data ?? dashRes.value.data);
      }
      if (approvalsRes.status === "fulfilled") {
        setPendingApprovals(approvalsRes.value.data.data ?? approvalsRes.value.data);
      }
      if (auditRes.status === "fulfilled") {
        const auditData = auditRes.value.data.data ?? auditRes.value.data;
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData(false);

    // Auto-refresh every 30 seconds
    autoRefreshTimerRef.current = setInterval(() => {
      if (!document.hidden) {
        loadAdminData(true);
      }
    }, 30000);

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [loadAdminData]);

  // Compute 4 KPI numbers
  const activeEmployeesCount = dashboardData?.totals?.users ?? 0;

  const pendingApprovalsCount =
    (dashboardData?.travel?.pending ?? 0) +
    (dashboardData?.expenses?.pending ?? 0) +
    (pendingApprovals?.counts?.pendingShuttleBookings ?? 0);

  const transportActivitiesCount =
    (dashboardData?.trips?.active ?? 0) +
    (dashboardData?.totals?.shuttleBookings ?? 0);

  const outstandingExpensesCount =
    (dashboardData?.expenses?.pending ?? 0) +
    (dashboardData?.expenses?.flagged ?? 0);

  // Build Needs Attention items list
  const attentionItems: AttentionItem[] = [];

  if (pendingApprovals?.pendingTravelRequests) {
    pendingApprovals.pendingTravelRequests.slice(0, 3).forEach((tr: any) => {
      attentionItems.push({
        id: `travel-${tr.id}`,
        title: `Travel Request Awaiting Approval`,
        subtitle: `${tr.employee?.fullName || "Employee"} • Destination: ${tr.destinationCity || "Trip"}`,
        referenceNumber: `TRV-${tr.id.substring(0, 5).toUpperCase()}`,
        status: tr.status,
        date: tr.createdAt,
        actionLabel: "Details",
        actionUrl: "/travel-requests",
        isUrgent: tr.urgency === "URGENT" || tr.urgency === "EMERGENCY",
        canQuickApprove: true,
        rawType: "travel",
        rawId: tr.id,
      });
    });
  }

  if (pendingApprovals?.flaggedExpenseClaims) {
    pendingApprovals.flaggedExpenseClaims.slice(0, 2).forEach((fc: any) => {
      attentionItems.push({
        id: `expense-${fc.id}`,
        title: `Expense Claim Needs Verification`,
        subtitle: `${fc.employee?.fullName || "Employee"} • PKR ${Number(fc.amount).toLocaleString()}`,
        referenceNumber: `EXP-${fc.id.substring(0, 5).toUpperCase()}`,
        status: fc.status,
        date: fc.createdAt,
        actionLabel: "Audit",
        actionUrl: "/expenses",
        isUrgent: true,
        canQuickApprove: true,
        rawType: "expense",
        rawId: fc.id,
      });
    });
  }

  if (dashboardData?.maintenance?.openVehicleTasks > 0) {
    attentionItems.push({
      id: "maint-overview",
      title: `${dashboardData.maintenance.openVehicleTasks} Vehicle Maintenance Issues Open`,
      subtitle: "Fleet inspection or routine repair scheduled",
      referenceNumber: "FLEET-OPS",
      status: "OPEN",
      actionLabel: "Inspect",
      actionUrl: "/maintenance",
      isUrgent: false,
    });
  }

  // Quick Approval Handlers
  async function handleQuickApprove(item: AttentionItem) {
    if (item.rawType === "travel" && item.rawId) {
      await http.patch(`/travel-requests/${item.rawId}/approve`, {
        remarks: "Approved by Organization Administrator",
      });
    } else if (item.rawType === "expense" && item.rawId) {
      await http.patch(`/expenses/${item.rawId}/approve`, {
        remarks: "Approved by Organization Administrator",
      });
    }
    await loadAdminData(true);
  }

  async function handleQuickReject(item: AttentionItem, reason?: string) {
    if (item.rawType === "travel" && item.rawId) {
      await http.patch(`/travel-requests/${item.rawId}/reject`, {
        remarks: reason || "Rejected by Organization Administrator",
      });
    } else if (item.rawType === "expense" && item.rawId) {
      await http.patch(`/expenses/${item.rawId}/reject`, {
        remarks: reason || "Rejected by Organization Administrator",
      });
    }
    await loadAdminData(true);
  }

  // Format recent activity list from audit logs
  const activityItems: ActivityItem[] = auditLogs.slice(0, 5).map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    userName: log.actor?.fullName || "System Admin",
    userEmail: log.actor?.email,
    details: log.details?.reason || log.details?.status || undefined,
    timestamp: log.createdAt,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Organization Dashboard"
        subtitle="View your organization's activity and manage important tasks."
        onRefresh={() => loadAdminData(false)}
        isRefreshing={isLoading || isRefreshing}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/users"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#102644] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1769E0] transition active:scale-95 shadow-xs"
            >
              <Users size={14} />
              <span>Manage Users</span>
            </Link>

            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F0] bg-white px-3 py-2 text-xs font-semibold text-[#102644] hover:bg-slate-50 transition active:scale-95"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Reports & Analytics</span>
            </Link>
          </div>
        }
      />

      {hasError && <ErrorState onRetry={() => loadAdminData(false)} />}

      {/* 4 Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Active Employees"
            value={activeEmployeesCount}
            subtitle="Registered organization users"
            icon={<Users size={20} />}
            iconTone="navy"
            to="/users"
          />

          <KpiCard
            label="Pending Approvals"
            value={pendingApprovalsCount}
            subtitle={
              pendingApprovalsCount > 0
                ? "Across travel & expenses"
                : "All queues cleared"
            }
            icon={<CheckSquare size={20} />}
            iconTone="amber"
            to="/travel-requests"
          />

          <KpiCard
            label="Today's Transport Activities"
            value={transportActivitiesCount}
            subtitle="Active routes & bookings"
            icon={<Bus size={20} />}
            iconTone="blue"
            to="/shuttle-bookings"
          />

          <KpiCard
            label="Outstanding Expense Claims"
            value={outstandingExpensesCount}
            subtitle="Awaiting finance audit"
            icon={<Receipt size={20} />}
            iconTone={outstandingExpensesCount > 0 ? "rose" : "slate"}
            to="/expenses"
          />
        </div>
      )}

      {/* Grid: Needs Attention with 1-Click Approvals & Compact Free Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#102644]">Needs Attention</h2>
              <p className="text-xs text-[#64748B]">Actionable tasks with 1-click quick approvals</p>
            </div>
            {attentionItems.length > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-[#B7791F] border border-amber-200">
                {attentionItems.length} Actionable
              </span>
            )}
          </div>

          <NeedsAttentionList
            items={attentionItems}
            onQuickApprove={handleQuickApprove}
            onQuickReject={handleQuickReject}
            emptyMessage="All clear. No urgent administrative tasks require attention."
          />
        </div>

        {/* Compact Transport Overview Map */}
        <div className="space-y-3">
          <TransportOverviewMap />
        </div>
      </div>

      {/* Recent Activity Audit Trail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#102644]">Recent Organization Activity</h2>
            <p className="text-xs text-[#64748B]">Audited changes across employees, travel, fleet, and finance</p>
          </div>
          <Link to="/audit-logs" className="text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-0.5">
            <span>View full audit log</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        <RecentActivityList items={activityItems} />
      </div>

      {/* Fast Management Portals */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[#102644]">Organization Management</h2>
          <p className="text-xs text-[#64748B]">Quick access to operational administrative modules</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/users"
            className="flex flex-col items-center justify-center rounded-xl border border-[#DCE5F0] bg-white p-4 text-center hover:border-[#1769E0] hover:bg-slate-50 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#102644] mb-2">
              <Users size={18} />
            </div>
            <span className="text-xs font-bold text-[#102644]">Users & Roles</span>
          </Link>

          <Link
            to="/vehicles"
            className="flex flex-col items-center justify-center rounded-xl border border-[#DCE5F0] bg-white p-4 text-center hover:border-[#1769E0] hover:bg-slate-50 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1769E0] mb-2">
              <Truck size={18} />
            </div>
            <span className="text-xs font-bold text-[#102644]">Fleet & Vehicles</span>
          </Link>

          <Link
            to="/routes"
            className="flex flex-col items-center justify-center rounded-xl border border-[#DCE5F0] bg-white p-4 text-center hover:border-[#1769E0] hover:bg-slate-50 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#16845B] mb-2">
              <Bus size={18} />
            </div>
            <span className="text-xs font-bold text-[#102644]">Routes & Stops</span>
          </Link>

          <Link
            to="/policies"
            className="flex flex-col items-center justify-center rounded-xl border border-[#DCE5F0] bg-white p-4 text-center hover:border-[#1769E0] hover:bg-slate-50 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#64748B] mb-2">
              <Settings size={18} />
            </div>
            <span className="text-xs font-bold text-[#102644]">Approval Policies</span>
          </Link>

          <Link
            to="/erp-exports"
            className="flex flex-col items-center justify-center rounded-xl border border-[#DCE5F0] bg-white p-4 text-center hover:border-[#1769E0] hover:bg-slate-50 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-[#B7791F] mb-2">
              <FileSpreadsheet size={18} />
            </div>
            <span className="text-xs font-bold text-[#102644]">ERP Payroll</span>
          </Link>

          <Link
            to="/audit-logs"
            className="flex flex-col items-center justify-center rounded-xl border border-[#DCE5F0] bg-white p-4 text-center hover:border-[#1769E0] hover:bg-slate-50 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#102644] mb-2">
              <ShieldCheck size={18} />
            </div>
            <span className="text-xs font-bold text-[#102644]">Audit Logs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
