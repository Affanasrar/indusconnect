import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  Bus,
  Wrench,
  AlertTriangle,
  Truck,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../shared/PageHeader";
import KpiCard from "../shared/KpiCard";
import StatusBadge from "../shared/StatusBadge";
import NeedsAttentionList, { type AttentionItem } from "../shared/NeedsAttentionList";
import TransportOverviewMap from "../shared/TransportOverviewMap";
import { KpiSkeleton, TableSkeleton } from "../shared/LoadingState";
import ErrorState from "../shared/ErrorState";
import { http } from "../../../api/http";
import { useAuth } from "../../../auth/AuthContext";

export default function OperationsDashboard() {
  const { bootstrap } = useAuth();
  const permissions = bootstrap?.permissions || {};

  const [pendingApprovals, setPendingApprovals] = useState<any>(null);
  const [transportSummary, setTransportSummary] = useState<any>(null);
  const [openMaintenance, setOpenMaintenance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const autoRefreshTimerRef = useRef<any>(null);

  const loadOperationsData = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setHasError(false);

      const [approvalsRes, transportRes, maintRes] = await Promise.allSettled([
        http.get("/reports/pending-approvals"),
        http.get("/reports/transport"),
        http.get("/maintenance/vehicle-tasks/open"),
      ]);

      if (approvalsRes.status === "fulfilled") {
        setPendingApprovals(approvalsRes.value.data.data ?? approvalsRes.value.data);
      }
      if (transportRes.status === "fulfilled") {
        setTransportSummary(transportRes.value.data.data ?? transportRes.value.data);
      }
      if (maintRes.status === "fulfilled") {
        const maintData = maintRes.value.data.data ?? maintRes.value.data;
        setOpenMaintenance(Array.isArray(maintData) ? maintData : []);
      }
    } catch (err) {
      console.error("Failed to load operations dashboard data:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOperationsData(false);

    // Auto-refresh every 30 seconds
    autoRefreshTimerRef.current = setInterval(() => {
      if (!document.hidden) {
        loadOperationsData(true);
      }
    }, 30000);

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [loadOperationsData]);

  // Compute 4 KPI counts
  const totalPendingApprovals =
    (pendingApprovals?.counts?.pendingTravelRequests ?? 0) +
    (pendingApprovals?.counts?.pendingExpenseClaims ?? 0) +
    (pendingApprovals?.counts?.pendingShuttleBookings ?? 0);

  const todayTransportActivities =
    (transportSummary?.activeTrips ?? 0) +
    (transportSummary?.pendingBookings ?? 0) +
    (transportSummary?.assignedBookings ?? 0);

  const vehicleIssuesCount = openMaintenance.length;

  const requestsNeedingAttentionCount =
    (pendingApprovals?.counts?.flaggedExpenseClaims ?? 0) +
    (pendingApprovals?.counts?.pendingTravelRequests ?? 0);

  // Build Needs Attention items list
  const attentionItems: AttentionItem[] = [];

  if (pendingApprovals?.pendingTravelRequests) {
    pendingApprovals.pendingTravelRequests.slice(0, 4).forEach((tr: any) => {
      attentionItems.push({
        id: `travel-${tr.id}`,
        title: `Travel Request: ${tr.employee?.fullName || "Employee"}`,
        subtitle: `To: ${tr.destinationCity || "Official Destination"} • ${tr.purpose || "Business Trip"}`,
        referenceNumber: `TRV-${tr.id.substring(0, 5).toUpperCase()}`,
        status: tr.status,
        date: tr.createdAt,
        actionLabel: "Details",
        actionUrl: "/travel-requests",
        isUrgent: tr.urgency === "URGENT" || tr.urgency === "EMERGENCY",
        canQuickApprove: permissions.canApproveTravel,
        rawType: "travel",
        rawId: tr.id,
      });
    });
  }

  if (pendingApprovals?.flaggedExpenseClaims) {
    pendingApprovals.flaggedExpenseClaims.slice(0, 3).forEach((fc: any) => {
      attentionItems.push({
        id: `flagged-${fc.id}`,
        title: `Expense Anomaly: ${fc.employee?.fullName || "Employee"}`,
        subtitle: `Amount: PKR ${Number(fc.amount).toLocaleString()} • ${fc.anomalyReason || "Flagged for review"}`,
        referenceNumber: `EXP-${fc.id.substring(0, 5).toUpperCase()}`,
        status: fc.status,
        date: fc.createdAt,
        actionLabel: "Audit",
        actionUrl: "/expenses",
        isUrgent: true,
        canQuickApprove: permissions.canReviewFinance,
        rawType: "expense",
        rawId: fc.id,
      });
    });
  }

  if (openMaintenance && openMaintenance.length > 0) {
    openMaintenance.slice(0, 2).forEach((task: any) => {
      attentionItems.push({
        id: `maint-${task.id}`,
        title: `Vehicle Attention: ${task.vehicle?.vehicleNumber || "Fleet Unit"}`,
        subtitle: task.issueDescription || `${task.taskType || "Routine Service"} required`,
        referenceNumber: `MNT-${task.id.substring(0, 5).toUpperCase()}`,
        status: task.status,
        date: task.createdAt,
        actionLabel: "Inspect",
        actionUrl: "/maintenance",
        isUrgent: task.priority === "HIGH" || task.priority === "URGENT",
      });
    });
  }

  // 1-Click Quick Approval Handlers
  async function handleQuickApprove(item: AttentionItem) {
    if (item.rawType === "travel" && item.rawId) {
      await http.patch(`/travel-requests/${item.rawId}/approve`, {
        remarks: "Approved from Operations Dashboard",
      });
    } else if (item.rawType === "expense" && item.rawId) {
      await http.patch(`/expenses/${item.rawId}/approve`, {
        remarks: "Approved from Operations Dashboard",
      });
    }
    // Refresh data silently
    await loadOperationsData(true);
  }

  async function handleQuickReject(item: AttentionItem, reason?: string) {
    if (item.rawType === "travel" && item.rawId) {
      await http.patch(`/travel-requests/${item.rawId}/reject`, {
        remarks: reason || "Rejected from Operations Dashboard",
      });
    } else if (item.rawType === "expense" && item.rawId) {
      await http.patch(`/expenses/${item.rawId}/reject`, {
        remarks: reason || "Rejected from Operations Dashboard",
      });
    }
    // Refresh data silently
    await loadOperationsData(true);
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Live Auto-Refresh */}
      <PageHeader
        title="Operations Dashboard"
        subtitle="Review today's activities, live transit coordinates, and items needing attention."
        onRefresh={() => loadOperationsData(false)}
        isRefreshing={isLoading || isRefreshing}
        action={
          <div className="flex items-center gap-2">
            {permissions.canApproveTravel && (
              <Link
                to="/travel-requests"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#102644] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1769E0] transition active:scale-95 shadow-xs"
              >
                <CheckSquare size={14} />
                <span>Review Approvals</span>
              </Link>
            )}

            {permissions.canManageTransport && (
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F0] bg-white px-3 py-2 text-xs font-semibold text-[#102644] hover:bg-slate-50 transition active:scale-95"
              >
                <Truck size={14} />
                <span className="hidden sm:inline">Manage Vehicles</span>
              </Link>
            )}
          </div>
        }
      />

      {hasError && <ErrorState onRetry={() => loadOperationsData(false)} />}

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
            label="Pending Approvals"
            value={totalPendingApprovals}
            subtitle={
              totalPendingApprovals > 0
                ? "Items awaiting management action"
                : "All items caught up"
            }
            icon={<CheckSquare size={20} />}
            iconTone="amber"
            to="/travel-requests"
          />

          <KpiCard
            label="Today's Transport Activities"
            value={todayTransportActivities}
            subtitle={
              transportSummary?.activeTrips
                ? `${transportSummary.activeTrips} active trips in progress`
                : "Active rides and trips"
            }
            icon={<Bus size={20} />}
            iconTone="blue"
            to="/shuttle-bookings"
          />

          <KpiCard
            label="Vehicle Allocation Issues"
            value={vehicleIssuesCount}
            subtitle={
              vehicleIssuesCount > 0
                ? "Maintenance / inspections needed"
                : "Fleet in active service"
            }
            icon={<Wrench size={20} />}
            iconTone={vehicleIssuesCount > 0 ? "rose" : "slate"}
            to="/maintenance"
          />

          <KpiCard
            label="Requests Needing Attention"
            value={requestsNeedingAttentionCount}
            subtitle="Flagged or priority items"
            icon={<AlertTriangle size={20} />}
            iconTone="amber"
            to="/expenses"
          />
        </div>
      )}

      {/* Grid: Needs Attention with 1-Click Approvals & Compact Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#102644]">Needs Attention</h2>
              <p className="text-xs text-[#64748B]">Actionable items with 1-click quick approvals</p>
            </div>
            {totalPendingApprovals > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-[#B7791F] border border-amber-200">
                {totalPendingApprovals} Pending
              </span>
            )}
          </div>

          <NeedsAttentionList
            items={attentionItems}
            onQuickApprove={handleQuickApprove}
            onQuickReject={handleQuickReject}
            emptyMessage="You're all caught up. There are no pending approvals or operational conflicts right now."
          />
        </div>

        {/* Compact Transport Overview Map Section */}
        <div className="space-y-3">
          <TransportOverviewMap />
        </div>
      </div>

      {/* Today's Operational Activities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#102644]">Today's Operational Activities</h2>
            <p className="text-xs text-[#64748B]">Shuttle bookings, active trips, and vehicle assignments</p>
          </div>
          <Link to="/shuttle-bookings" className="text-xs font-semibold text-[#1769E0] hover:underline">
            View full roster
          </Link>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#DCE5F0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#DCE5F0] bg-slate-50/80 text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Service Type</th>
                  <th className="px-4 py-3 font-semibold">Route / Area</th>
                  <th className="px-4 py-3 font-semibold">Schedule</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#102644]">
                {pendingApprovals?.pendingShuttleBookings && pendingApprovals.pendingShuttleBookings.length > 0 ? (
                  pendingApprovals.pendingShuttleBookings.slice(0, 6).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.employee?.fullName || "Employee"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Bus size={13} className="text-[#16845B]" />
                          <span>Shuttle Commute</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B] truncate max-w-xs">
                        {item.pickupArea || item.pickupStop?.stopName || item.route?.routeName || "Designated Stop"}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {new Date(item.bookingDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })} &bull; {item.shiftType || "General"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/shuttle-bookings"
                          className="inline-flex items-center text-xs font-semibold text-[#1769E0] hover:underline"
                        >
                          <span>Manage</span>
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#64748B]">
                      No active transport bookings scheduled for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
