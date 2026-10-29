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
  TicketCheck,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import PageHeader from "../shared/PageHeader";
import KpiCard from "../shared/KpiCard";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";
import { KpiSkeleton, TableSkeleton } from "../shared/LoadingState";
import ErrorState from "../shared/ErrorState";
import { http } from "../../../api/http";
import { useToast } from "../../../context/ToastContext";

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

  const toast = useToast();
  const [quickShift, setQuickShift] = useState<"MORNING" | "EVENING">("MORNING");
  const [quickDate, setQuickDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [quickArea, setQuickArea] = useState<string>("Garden West");
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  async function handleQuickBook() {
    if (!quickArea.trim()) {
      toast.error("Please enter or select a pickup area");
      return;
    }

    try {
      setIsSubmittingQuick(true);
      await http.post("/shuttle-bookings", {
        bookingDate: quickDate,
        shiftType: quickShift,
        pickupArea: quickArea.trim(),
        remarks: "1-Click quick commute booking from dashboard",
      });
      toast.success(
        `Seat reserved for ${quickShift.toLowerCase()} shift on ${quickDate}! Check your boarding pass below.`,
        "Commute Booked"
      );
      await fetchSummary();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to book shuttle";
      toast.error(msg);
    } finally {
      setIsSubmittingQuick(false);
    }
  }

  async function handleCancelQuickBooking(bookingId: string) {
    if (!window.confirm("Cancel this shuttle booking?")) return;
    try {
      await http.patch(`/shuttle-bookings/${bookingId}/cancel`);
      toast.info("Shuttle booking cancelled");
      await fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not cancel booking");
    }
  }

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

      {/* 1-CLICK EASY COMMUTE BOOKING BAR & ACTIVE DIGITAL TICKET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card A: Easy Booking Console */}
        <div className="rounded-3xl border-2 border-blue-600 bg-gradient-to-br from-slate-900 to-[#102644] text-white p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <Bus size={26} />
              </div>
              <div>
                <span className="inline-block rounded-full bg-blue-500/30 px-3 py-0.5 text-3xs font-extrabold uppercase tracking-wider text-blue-300 border border-blue-400/30">
                  Quick Commute Pass
                </span>
                <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                  Book Today or Tomorrow's Shuttle
                </h3>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Shift Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                1. Select Shift Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickShift("MORNING")}
                  className={`py-3 px-4 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 ${
                    quickShift === "MORNING"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/40 border border-blue-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  <span>☀️ Morning (To Office)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickShift("EVENING")}
                  className={`py-3 px-4 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 ${
                    quickShift === "EVENING"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/40 border border-blue-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  <span>🌙 Evening (Return Home)</span>
                </button>
              </div>
            </div>

            {/* Date Quick Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                2. Commute Date
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDate(new Date().toISOString().slice(0, 10))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    quickDate === new Date().toISOString().slice(0, 10)
                      ? "bg-white text-slate-900 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  Today ({new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setQuickDate(d.toISOString().slice(0, 10));
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    quickDate !== new Date().toISOString().slice(0, 10)
                      ? "bg-white text-slate-900 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Pickup Stop Preset Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                3. Pickup Stop / Area
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {["Garden West", "Gulshan Block 4", "Saddar", "Clifton / DHA", "Main Gate"].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setQuickArea(area)}
                    className={`px-3 py-1.5 rounded-xl text-2xs font-extrabold transition ${
                      quickArea === area
                        ? "bg-blue-500 text-white shadow-xs"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={quickArea}
                onChange={(e) => setQuickArea(e.target.value)}
                placeholder="Or type custom pickup stop..."
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleQuickBook}
              disabled={isSubmittingQuick}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>{isSubmittingQuick ? "Reserving Seat..." : "Confirm & Reserve My Seat Now"}</span>
            </button>
          </div>
        </div>

        {/* Card B: Digital Boarding Pass Ticket */}
        {upcomingCommutes.length > 0 ? (
          (() => {
            const ticket = upcomingCommutes[0];
            const isAssigned = ticket.status === "ASSIGNED";
            const isBoarded = ticket.status === "COMPLETED";

            return (
              <div className="rounded-3xl border-2 border-emerald-300 bg-white p-6 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                      <TicketCheck size={22} />
                    </div>
                    <div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-3xs font-black uppercase tracking-wider text-emerald-800">
                        Active Digital Boarding Pass
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-0.5">
                        IndusConnect Shuttle Ticket
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      isBoarded
                        ? "bg-emerald-100 text-emerald-800"
                        : isAssigned
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isBoarded ? "✓ BOARDED" : isAssigned ? "SEAT CONFIRMED" : "PENDING ROSTER"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-1">
                  <div>
                    <span className="text-2xs font-extrabold uppercase text-slate-400">Pickup Location</span>
                    <p className="text-sm font-black text-slate-900 truncate">
                      {ticket.pickupArea || ticket.pickupStop?.stopName || "Regular Stop"}
                    </p>
                  </div>

                  <div>
                    <span className="text-2xs font-extrabold uppercase text-slate-400">Travel Date & Shift</span>
                    <p className="text-sm font-black text-slate-900">
                      {new Date(ticket.bookingDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • {ticket.shiftType}
                    </p>
                  </div>

                  <div>
                    <span className="text-2xs font-extrabold uppercase text-slate-400">Assigned Seat</span>
                    <p className="text-base font-black text-blue-700">
                      {ticket.seatNumber ? `Seat #${ticket.seatNumber}` : "Auto-Assigned on Boarding"}
                    </p>
                  </div>

                  <div>
                    <span className="text-2xs font-extrabold uppercase text-slate-400">Vehicle / Van</span>
                    <p className="text-sm font-black text-slate-900">
                      {ticket.assignedRoute?.vehicle?.vehicleNumber || "Standard Enterprise Shuttle"}
                    </p>
                  </div>
                </div>

                {/* Simulated Digital Barcode */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">
                      Pass ID: #{ticket.id.substring(0, 8).toUpperCase()}
                    </span>
                    <div className="flex gap-1 h-6 items-end">
                      {[4, 8, 2, 6, 9, 3, 7, 5, 8, 4, 6, 3, 7, 9, 5].map((h, i) => (
                        <div key={i} className="bg-slate-800 w-1 rounded-xs" style={{ height: `${h * 10}%` }} />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCancelQuickBooking(ticket.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 size={13} />
                    <span>Cancel Ticket</span>
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-6 flex flex-col items-center justify-center text-center space-y-2">
            <TicketCheck size={36} className="text-slate-400" />
            <h4 className="text-base font-bold text-slate-800">No Active Boarding Pass Today</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Use the quick booking panel on the left to reserve your seat in 2 clicks.
            </p>
          </div>
        )}
      </div>

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
