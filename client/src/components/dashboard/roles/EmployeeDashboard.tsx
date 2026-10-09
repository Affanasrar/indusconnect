import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Plus,
  Bus,
  Plane,
  Receipt,
  Building2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import PageHeader from "../shared/PageHeader";
import KpiCard from "../shared/KpiCard";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";
import { KpiSkeleton, TableSkeleton } from "../shared/LoadingState";
import ErrorState from "../shared/ErrorState";
import { http } from "../../../api/http";

interface EmployeeSummaryData {
  counts: {
    shuttleBookings: number;
    travelRequests: number;
    roomReservations: number;
    expenseClaims: number;
  };
  travel: {
    pending: number;
    approved: number;
  };
  expenses: {
    pending: number;
    approved: number;
  };
  recentTravelRequests: any[];
  recentExpenseClaims: any[];
  recentShuttleBookings: any[];
}

export default function EmployeeDashboard() {
  const [data, setData] = useState<EmployeeSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  async function fetchSummary() {
    try {
      setIsLoading(true);
      setHasError(false);
      const res = await http.get("/reports/my");
      setData(res.data.data ?? res.data);
    } catch (err) {
      console.error("Failed to load employee summary:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  // Compute clean counts
  const pendingRequestsCount =
    (data?.travel?.pending ?? 0) +
    (data?.expenses?.pending ?? 0) +
    (data?.recentShuttleBookings?.filter((b) => b.status === "PENDING").length ?? 0);

  const upcomingCommutes = data?.recentShuttleBookings?.filter(
    (b) => b.status === "ASSIGNED" || b.status === "PENDING"
  ) ?? [];

  const upcomingTravel = data?.recentTravelRequests?.filter(
    (t) => t.status === "APPROVED" || t.status === "PENDING"
  ) ?? [];

  const needsActionCount =
    data?.recentExpenseClaims?.filter((e) => e.status === "FLAGGED").length ?? 0;

  // Combine recent requests across modules for "My Recent Requests" table
  const combinedRecentRequests: Array<{
    id: string;
    code: string;
    type: "Commute" | "Travel" | "Expense";
    title: string;
    date: string;
    status: string;
    url: string;
  }> = [];

  if (data?.recentShuttleBookings) {
    data.recentShuttleBookings.slice(0, 4).forEach((b) => {
      combinedRecentRequests.push({
        id: `shuttle-${b.id}`,
        code: `SHU-${b.id.substring(0, 5).toUpperCase()}`,
        type: "Commute",
        title: `Shuttle: ${b.pickupArea || b.pickupStop?.stopName || "Daily Commute"}`,
        date: b.bookingDate,
        status: b.status,
        url: "/shuttle-bookings",
      });
    });
  }

  if (data?.recentTravelRequests) {
    data.recentTravelRequests.slice(0, 4).forEach((t) => {
      combinedRecentRequests.push({
        id: `travel-${t.id}`,
        code: `TRV-${t.id.substring(0, 5).toUpperCase()}`,
        type: "Travel",
        title: `Travel: ${t.destinationCity || "Official Travel"}`,
        date: t.departureDate || t.createdAt,
        status: t.status,
        url: "/travel-requests",
      });
    });
  }

  if (data?.recentExpenseClaims) {
    data.recentExpenseClaims.slice(0, 4).forEach((e) => {
      combinedRecentRequests.push({
        id: `expense-${e.id}`,
        code: `EXP-${e.id.substring(0, 5).toUpperCase()}`,
        type: "Expense",
        title: `${e.title || "Expense Claim"} (PKR ${Number(e.amount).toLocaleString()})`,
        date: e.createdAt,
        status: e.status,
        url: "/expenses",
      });
    });
  }

  // Sort by date descending
  combinedRecentRequests.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Dashboard"
        subtitle="View your requests and upcoming plans."
        onRefresh={fetchSummary}
        isRefreshing={isLoading}
        action={
          <button
            type="button"
            onClick={() => setIsNewRequestModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#102644] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1769E0] transition active:scale-95 shadow-xs"
          >
            <Plus size={15} />
            <span>New Request</span>
          </button>
        }
      />

      {hasError && <ErrorState onRetry={fetchSummary} />}

      {/* 4 Personal Summary Cards */}
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
            label="My Pending Requests"
            value={pendingRequestsCount}
            subtitle={
              pendingRequestsCount === 0
                ? "No pending approvals"
                : `${pendingRequestsCount} waiting for review`
            }
            icon={<Clock size={20} />}
            iconTone="amber"
          />

          <KpiCard
            label="Upcoming Travel"
            value={upcomingTravel.length}
            subtitle={
              upcomingTravel.length > 0
                ? "Scheduled trips"
                : "No upcoming travel"
            }
            icon={<Plane size={20} />}
            iconTone="blue"
            to="/travel-requests"
          />

          <KpiCard
            label="Upcoming Commute"
            value={upcomingCommutes.length}
            subtitle={
              upcomingCommutes.length > 0
                ? "Booked shuttle seats"
                : "No rides booked"
            }
            icon={<Bus size={20} />}
            iconTone="emerald"
            to="/shuttle-bookings"
          />

          <KpiCard
            label="Requests Needing Action"
            value={needsActionCount}
            subtitle={
              needsActionCount === 0
                ? "All items cleared"
                : "Correction required"
            }
            icon={<AlertCircle size={20} />}
            iconTone={needsActionCount > 0 ? "rose" : "slate"}
            to="/expenses"
          />
        </div>
      )}

      {/* Grid: Upcoming Plans & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Plans (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#102644]">Upcoming Plans</h2>
              <p className="text-xs text-[#64748B]">Your scheduled rides and upcoming official trips</p>
            </div>
            <Link to="/shuttle-bookings" className="text-xs font-semibold text-[#1769E0] hover:underline">
              View all
            </Link>
          </div>

          <div className="rounded-xl border border-[#DCE5F0] bg-white divide-y divide-[#F1F5F9] overflow-hidden">
            {upcomingCommutes.length === 0 && upcomingTravel.length === 0 ? (
              <EmptyState
                title="No upcoming plans"
                description="You don't have any scheduled shuttle rides or travel plans for the coming days."
                action={
                  <button
                    type="button"
                    onClick={() => setIsNewRequestModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#102644] hover:bg-slate-50"
                  >
                    <Plus size={13} />
                    <span>Book a ride</span>
                  </button>
                }
              />
            ) : (
              <>
                {/* Shuttle Rides */}
                {upcomingCommutes.map((commute) => (
                  <div key={commute.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#16845B]">
                        <Bus size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#102644]">
                            Shuttle: {commute.pickupArea || commute.pickupStop?.stopName || "Regular Route"}
                          </span>
                          <StatusBadge status={commute.status} size="sm" />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
                          <span>
                            {new Date(commute.bookingDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>&bull;</span>
                          <span>Shift: {commute.shiftType || "General"}</span>
                          {commute.seatNumber && (
                            <>
                              <span>&bull;</span>
                              <span className="font-semibold text-emerald-700">Seat {commute.seatNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/shuttle-bookings"
                      className="shrink-0 text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-0.5"
                    >
                      <span>Details</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}

                {/* Travel Requests */}
                {upcomingTravel.map((travel) => (
                  <div key={travel.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1769E0]">
                        <Plane size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#102644]">
                            Trip to {travel.destinationCity || "Destination"}
                          </span>
                          <StatusBadge status={travel.status} size="sm" />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
                          <span>
                            {travel.departureDate
                              ? new Date(travel.departureDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Departure TBD"}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[200px]">{travel.purpose || "Official Duty"}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/travel-requests"
                      className="shrink-0 text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-0.5"
                    >
                      <span>Details</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Quick Launchpad (1 col) */}
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-[#102644]">Self-Service Services</h2>
            <p className="text-xs text-[#64748B]">Frequently used mobility services</p>
          </div>

          <div className="rounded-xl border border-[#DCE5F0] bg-white p-3 space-y-2">
            <Link
              to="/shuttle-bookings"
              className="group flex items-center justify-between rounded-lg p-2.5 hover:bg-slate-50 transition border border-transparent hover:border-[#DCE5F0]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-[#16845B]">
                  <Bus size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#102644]">Book Shuttle Ride</div>
                  <div className="text-[11px] text-[#64748B]">Reserve a seat for your office commute</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-[#1769E0] transition" />
            </Link>

            <Link
              to="/travel-requests"
              className="group flex items-center justify-between rounded-lg p-2.5 hover:bg-slate-50 transition border border-transparent hover:border-[#DCE5F0]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-[#1769E0]">
                  <Plane size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#102644]">Request Official Travel</div>
                  <div className="text-[11px] text-[#64748B]">Submit inter-city or site visit plans</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-[#1769E0] transition" />
            </Link>

            <Link
              to="/expenses"
              className="group flex items-center justify-between rounded-lg p-2.5 hover:bg-slate-50 transition border border-transparent hover:border-[#DCE5F0]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-[#B7791F]">
                  <Receipt size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#102644]">Submit Expense Claim</div>
                  <div className="text-[11px] text-[#64748B]">Claim fuel, meal, or travel allowances</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-[#1769E0] transition" />
            </Link>

            <Link
              to="/accommodation"
              className="group flex items-center justify-between rounded-lg p-2.5 hover:bg-slate-50 transition border border-transparent hover:border-[#DCE5F0]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-[#102644]">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#102644]">Guest House & Stay</div>
                  <div className="text-[11px] text-[#64748B]">Book company lodging or guest rooms</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-[#1769E0] transition" />
            </Link>
          </div>
        </div>
      </div>

      {/* My Recent Requests Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#102644]">My Recent Requests</h2>
            <p className="text-xs text-[#64748B]">Latest requests submitted across commute, travel, and expenses</p>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : combinedRecentRequests.length === 0 ? (
          <EmptyState
            title="No requests found"
            description="You haven't submitted any shuttle bookings, travel requests, or expense claims yet."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#DCE5F0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#DCE5F0] bg-slate-50/80 text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Request Code</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#102644]">
                {combinedRecentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {req.code}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        {req.type === "Commute" && <Bus size={13} className="text-emerald-600" />}
                        {req.type === "Travel" && <Plane size={13} className="text-blue-600" />}
                        {req.type === "Expense" && <Receipt size={13} className="text-amber-600" />}
                        <span>{req.type}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-xs">
                      {req.title}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      {new Date(req.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={req.url}
                        className="inline-flex items-center text-xs font-semibold text-[#1769E0] hover:underline"
                      >
                        <span>View Details</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B33]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#DCE5F0] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#102644]">Start a New Request</h3>
                <p className="text-xs text-[#64748B]">Select the service you want to request today</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/shuttle-bookings"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#DCE5F0] hover:border-[#1769E0] hover:bg-blue-50/30 transition group"
              >
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-[#16845B] flex items-center justify-center shrink-0">
                  <Bus size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#102644] group-hover:text-[#1769E0]">Book Daily Shuttle</div>
                  <div className="text-[11px] text-[#64748B]">Select morning or evening route and pickup stop</div>
                </div>
              </Link>

              <Link
                to="/travel-requests"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#DCE5F0] hover:border-[#1769E0] hover:bg-blue-50/30 transition group"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#1769E0] flex items-center justify-center shrink-0">
                  <Plane size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#102644] group-hover:text-[#1769E0]">Request Official Travel</div>
                  <div className="text-[11px] text-[#64748B]">Plan city-to-city travel for project assignments</div>
                </div>
              </Link>

              <Link
                to="/expenses"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#DCE5F0] hover:border-[#1769E0] hover:bg-blue-50/30 transition group"
              >
                <div className="h-10 w-10 rounded-lg bg-amber-50 text-[#B7791F] flex items-center justify-center shrink-0">
                  <Receipt size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#102644] group-hover:text-[#1769E0]">Submit Expense Claim</div>
                  <div className="text-[11px] text-[#64748B]">Attach receipts for reimbursement review</div>
                </div>
              </Link>

              <Link
                to="/accommodation"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#DCE5F0] hover:border-[#1769E0] hover:bg-blue-50/30 transition group"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 text-[#102644] flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#102644] group-hover:text-[#1769E0]">Reserve Accommodation</div>
                  <div className="text-[11px] text-[#64748B]">Book rooms in company guest houses or partner hotels</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
