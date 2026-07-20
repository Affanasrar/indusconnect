import { useEffect, useState } from "react";
import {
  TrendingUp,
  RefreshCcw,
  AlertTriangle,
  Truck,
  Printer,
  BadgeAlert,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  getDashboardSummary,
  getPendingApprovalsSummary,
  getTransportSummary,
  getTravelSummary,
  getAccommodationSummary,
  getExpenseSummary,
} from "../api/reports";
import type {
  ReportDashboardSummary,
  ReportPendingApprovalsSummary,
  ReportTransportSummary,
  ReportTravelSummary,
  ReportAccommodationSummary,
  ReportExpenseSummary,
} from "../types/report";

export default function ReportsPage() {
  const { bootstrap } = useAuth();
  
  // Roles check
  const isAdminOrManager =
    bootstrap?.role === "SUPER_ADMIN" || bootstrap?.role === "MANAGER";
  const isFinance = bootstrap?.role === "FINANCE_OFFICER" || bootstrap?.role === "SUPER_ADMIN";
  const isTransport = bootstrap?.role === "TRANSPORT_ADMIN" || bootstrap?.role === "SUPER_ADMIN";
  const isAccommodation = bootstrap?.role === "ACCOMMODATION_ADMIN" || bootstrap?.role === "SUPER_ADMIN";

  // Data states
  const [dashboard, setDashboard] = useState<ReportDashboardSummary | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<ReportPendingApprovalsSummary | null>(null);
  const [transport, setTransport] = useState<ReportTransportSummary | null>(null);
  const [travel, setTravel] = useState<ReportTravelSummary | null>(null);
  const [accommodation, setAccommodation] = useState<ReportAccommodationSummary | null>(null);
  const [expenses, setExpenses] = useState<ReportExpenseSummary | null>(null);

  // Tab navigation states
  const [activeReportTab, setActiveReportTab] = useState<"DASHBOARD" | "PENDING" | "TRANSPORT" | "TRAVEL" | "ACCOMMODATION" | "EXPENSES">("DASHBOARD");

  // UI state
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync data feeds
  async function loadReportFeeds() {
    try {
      setIsLoading(true);
      setError("");

      const promises: Promise<any>[] = [];

      // Always load dashboard summary if admin or manager
      if (isAdminOrManager) {
        promises.push(getDashboardSummary());
      } else {
        promises.push(Promise.resolve(null));
      }

      // Pending Approvals
      if (isFinance || isAdminOrManager) {
        promises.push(getPendingApprovalsSummary());
      } else {
        promises.push(Promise.resolve(null));
      }

      // Transport
      if (isTransport || isAdminOrManager) {
        promises.push(getTransportSummary());
      } else {
        promises.push(Promise.resolve(null));
      }

      // Travel
      if (isTransport || isAccommodation || isAdminOrManager) {
        promises.push(getTravelSummary());
      } else {
        promises.push(Promise.resolve(null));
      }

      // Accommodation
      if (isAccommodation || isAdminOrManager) {
        promises.push(getAccommodationSummary());
      } else {
        promises.push(Promise.resolve(null));
      }

      // Expenses
      if (isFinance || isAdminOrManager) {
        promises.push(getExpenseSummary());
      } else {
        promises.push(Promise.resolve(null));
      }

      const [dashRes, pendRes, transRes, travRes, accomRes, expRes] = await Promise.all(promises);

      setDashboard(dashRes);
      setPendingApprovals(pendRes);
      setTransport(transRes);
      setTravel(travRes);
      setAccommodation(accomRes);
      setExpenses(expRes);

      // Adjust default tab based on permission access if dashboard isn't available
      if (!isAdminOrManager) {
        if (isFinance) setActiveReportTab("PENDING");
        else if (isTransport) setActiveReportTab("TRANSPORT");
        else if (isAccommodation) setActiveReportTab("ACCOMMODATION");
      }
    } catch (err) {
      setError("Failed to compile analytical summary metrics");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReportFeeds();
  }, []);

  // Print function
  function handlePrintReport() {
    window.print();
  }

  return (
    <div className="space-y-6 print:space-y-4 print:p-6 print:bg-white">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:border-b print:pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 print:text-xl">
            Reports & Analytical Intelligence
          </h1>
          <p className="text-sm text-slate-500 print:hidden">
            Examine real-time service volumes, budget spends, approval queues, and fleet capacities.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="secondary"
            onClick={loadReportFeeds}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 text-xs py-2"
          >
            <RefreshCcw size={15} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="secondary"
            onClick={handlePrintReport}
            className="rounded-xl border border-slate-200 text-xs py-2"
          >
            <Printer size={15} className="mr-1.5" />
            Print Report
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 border border-red-100 print:hidden">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2 print:hidden">
        {isAdminOrManager && (
          <button
            onClick={() => setActiveReportTab("DASHBOARD")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition ${
              activeReportTab === "DASHBOARD" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Dashboard Summary
          </button>
        )}
        {(isFinance || isAdminOrManager) && (
          <button
            onClick={() => setActiveReportTab("PENDING")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition ${
              activeReportTab === "PENDING" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Approvals Pipeline
          </button>
        )}
        {(isTransport || isAdminOrManager) && (
          <button
            onClick={() => setActiveReportTab("TRANSPORT")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition ${
              activeReportTab === "TRANSPORT" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Transport Fleet
          </button>
        )}
        {(isTransport || isAccommodation || isAdminOrManager) && (
          <button
            onClick={() => setActiveReportTab("TRAVEL")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition ${
              activeReportTab === "TRAVEL" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Travel & Budgets
          </button>
        )}
        {(isAccommodation || isAdminOrManager) && (
          <button
            onClick={() => setActiveReportTab("ACCOMMODATION")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition ${
              activeReportTab === "ACCOMMODATION" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Lodging Accommodation
          </button>
        )}
        {(isFinance || isAdminOrManager) && (
          <button
            onClick={() => setActiveReportTab("EXPENSES")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition ${
              activeReportTab === "EXPENSES" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Expense Sync
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCcw size={40} className="animate-spin text-blue-700" />
          <p className="mt-4 text-sm font-medium">Compiling analytical intelligence data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: DASHBOARD SUMMARY */}
          {activeReportTab === "DASHBOARD" && dashboard && (
            <div className="space-y-6">
              {/* Metrics blocks */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Total Registered Users</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-800">{dashboard.totals.users}</span>
                    <span className="text-xs text-slate-400 font-semibold">profiles synced</span>
                  </div>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Active Shuttle Routes</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-800">{dashboard.totals.routes}</span>
                    <span className="text-xs text-slate-400 font-semibold">runs configured</span>
                  </div>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Total Accommodation Rooms</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-800">{dashboard.totals.rooms}</span>
                    <span className="text-xs text-slate-400 font-semibold">internal units</span>
                  </div>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Generated Payroll Exports</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-800">{dashboard.erpExports.total}</span>
                    <span className="text-xs text-slate-400 font-semibold">sync files</span>
                  </div>
                </Card>
              </div>

              {/* Layout grids */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-blue-700" /> Travel & Stay Ratios
                  </h3>
                  <div className="mt-4 space-y-4 text-xs font-semibold text-slate-600">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Approved Travel Requests</span>
                        <span className="text-slate-800 font-bold">{dashboard.travel.approved} of {dashboard.totals.travelRequests}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-blue-700 h-2 rounded-full"
                          style={{ width: `${(dashboard.travel.approved / (dashboard.totals.travelRequests || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Accommodation Occupancy Rate</span>
                        <span className="text-slate-800 font-bold">
                          {dashboard.accommodation.occupiedRooms} of {dashboard.totals.rooms} rooms occupied
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-violet-700 h-2 rounded-full"
                          style={{ width: `${(dashboard.accommodation.occupiedRooms / (dashboard.totals.rooms || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>ERP Synced Payroll Export Ratio</span>
                        <span className="text-slate-800 font-bold">
                          {dashboard.erpExports.synced} of {dashboard.erpExports.total} synced
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${(dashboard.erpExports.synced / (dashboard.erpExports.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <BadgeAlert size={16} className="text-red-700" /> Operational Warnings Desk
                  </h3>
                  <div className="mt-4 space-y-4.5 text-xs">
                    <div className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-xl border border-red-100/50">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <AlertTriangle size={13} className="text-red-600" /> SOS Beacon Incidents
                      </span>
                      <span className="font-bold text-red-700">{dashboard.telemetry.emergencyEvents} alerts</span>
                    </div>

                    <div className="flex justify-between items-center bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <AlertTriangle size={13} className="text-amber-600" /> Anomaly Flags in Claims
                      </span>
                      <span className="font-bold text-amber-700">{dashboard.expenses.flagged} claims</span>
                    </div>

                    <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Truck size={13} className="text-blue-600" /> Open Vehicle Repairs
                      </span>
                      <span className="font-bold text-blue-700">{dashboard.maintenance.openVehicleTasks} tasks</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: PENDING APPROVALS SUMMARY */}
          {activeReportTab === "PENDING" && pendingApprovals && (
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-3">
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Pending Travel Requests</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{pendingApprovals.counts.pendingTravelRequests}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Pending Expense Claims</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{pendingApprovals.counts.pendingExpenseClaims}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Flagged Anomalies</p>
                  <p className="mt-2 text-3xl font-extrabold text-red-700">{pendingApprovals.counts.flaggedExpenseClaims}</p>
                </Card>
              </div>

              {/* Travel Pipeline Table */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Travel Approval Requests Queue</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Details</th>
                        <th className="px-4 py-3">Route Path</th>
                        <th className="px-4 py-3 text-right">Estimated Budget</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {pendingApprovals.pendingTravelRequests.map((req) => (
                        <tr key={req.id}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{req.employee?.fullName || "Employee"}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.employee?.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-700 font-semibold">{req.purpose}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Dep: {new Date(req.departureDate).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {req.fromLocation} &rarr; {req.toLocation}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            PKR {req.estimatedBudget?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {pendingApprovals.pendingTravelRequests.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400 italic">No pending travel approvals in queue</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSPORT SUMMARY */}
          {activeReportTab === "TRANSPORT" && transport && (
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-4">
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Total Route Runs</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{transport.routes}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Active Shuttle Bookings</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{transport.bookings.total}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Completed Trips</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{transport.trips.completed}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400 font-bold text-red-700">No-Show Seats</p>
                  <p className="mt-2 text-3xl font-extrabold text-red-700">{transport.bookings.noShow}</p>
                </Card>
              </div>

              {/* Shuttle Booking Status ratios */}
              <Card>
                <h3 className="font-bold text-slate-800 text-sm">Shuttle Seats Dispatch Ratio</h3>
                <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4 text-xs font-semibold text-slate-600">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-slate-400 text-3xs font-bold mb-1">PENDING RESERVES</span>
                    <span className="text-xl font-extrabold text-slate-800">{transport.bookings.pending}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-slate-400 text-3xs font-bold mb-1">ASSIGNED TRIPS</span>
                    <span className="text-xl font-extrabold text-blue-700">{transport.bookings.assigned}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-slate-400 text-3xs font-bold mb-1">COMPLETED JOBS</span>
                    <span className="text-xl font-extrabold text-emerald-700">{transport.bookings.completed}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-slate-400 text-3xs font-bold mb-1">NO-SHOW SEATS</span>
                    <span className="text-xl font-extrabold text-red-600">{transport.bookings.noShow}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: TRAVEL SUMMARY */}
          {activeReportTab === "TRAVEL" && travel && (
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-3">
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Total Travel Budget Amount</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">PKR {travel.budgets.estimatedTotal.toLocaleString()}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Average Expense per Trip</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">PKR {Math.round(travel.budgets.averagePerTrip).toLocaleString()}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Approved Travel Count</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{travel.travelRequests.approved}</p>
                </Card>
              </div>

              {/* Travel Breakdown categories */}
              <Card>
                <h3 className="font-bold text-slate-800 text-sm mb-4">Travel Classification breakdown</h3>
                <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                  {Object.entries(travel.byType).map(([type, val]) => (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between uppercase text-2xs">
                        <span>{type.replace(/_/g, " ")}</span>
                        <span className="text-slate-800 font-bold">{val} requests</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-700 h-1.5 rounded-full"
                          style={{ width: `${(val / (travel.travelRequests.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: ACCOMMODATION SUMMARY */}
          {activeReportTab === "ACCOMMODATION" && accommodation && (
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-3">
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Total Rooms</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{accommodation.rooms.total}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Active Bookings Stay</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{accommodation.reservations.total}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Rooms Occupied</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{accommodation.rooms.occupied}</p>
                </Card>
              </div>

              <Card>
                <h3 className="font-bold text-slate-800 text-sm mb-4">Room Reservations ledger</h3>
                <div className="grid gap-4 sm:grid-cols-5 text-xs text-center font-bold">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="block text-slate-400 text-3xs mb-1 uppercase font-semibold">RESERVED</span>
                    <span className="text-lg text-slate-700">{accommodation.reservations.confirmed}</span>
                  </div>
                  <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/30">
                    <span className="block text-blue-400 text-3xs mb-1 uppercase font-semibold">CHECKED IN</span>
                    <span className="text-lg text-blue-700">{accommodation.reservations.checkedIn}</span>
                  </div>
                  <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/30">
                    <span className="block text-emerald-400 text-3xs mb-1 uppercase font-semibold">CHECKED OUT</span>
                    <span className="text-lg text-emerald-700">{accommodation.reservations.checkedOut}</span>
                  </div>
                  <div className="bg-red-50/30 p-3 rounded-xl border border-red-100/30">
                    <span className="block text-red-400 text-3xs mb-1 uppercase font-semibold">CANCELLED</span>
                    <span className="text-lg text-red-700">{accommodation.reservations.cancelled}</span>
                  </div>
                  <div className="bg-amber-50/30 p-3 rounded-xl border border-amber-100/30">
                    <span className="block text-amber-400 text-3xs mb-1 uppercase font-semibold">MAINTENANCE</span>
                    <span className="text-lg text-amber-700">{accommodation.rooms.maintenance}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: EXPENSES SUMMARY */}
          {activeReportTab === "EXPENSES" && expenses && (
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-4">
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">Total Expense Amount</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-800">PKR {expenses.amounts.totalAmount.toLocaleString()}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400 text-blue-700">Approved Expense Sum</p>
                  <p className="mt-2 text-2xl font-extrabold text-blue-700">PKR {expenses.amounts.approvedAmount.toLocaleString()}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400 text-emerald-700 font-bold">Paid Expense Sum</p>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-700">PKR {expenses.amounts.paidAmount.toLocaleString()}</p>
                </Card>
                <Card>
                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-400 text-red-700 font-bold">Flagged Claims</p>
                  <p className="mt-2 text-2xl font-extrabold text-red-700">{expenses.claims.flagged} claims</p>
                </Card>
              </div>

              {/* Expense category splits */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Expense Category distribution</h3>
                  <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                    {Object.entries(expenses.byCategory).map(([cat, val]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between uppercase text-2xs">
                          <span>{cat.replace(/_/g, " ")}</span>
                          <span className="text-slate-800 font-bold">PKR {val.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${(val / (expenses.amounts.totalAmount || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Payment Sync pipeline</h3>
                  <div className="space-y-4.5 text-xs">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">PENDING CLAIMS</span>
                      <span className="font-extrabold text-slate-800">{expenses.claims.pending} claims</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">APPROVED DESK CLAIMS</span>
                      <span className="font-extrabold text-blue-700">{expenses.claims.approved} claims</span>
                    </div>

                    <div className="flex justify-between items-center bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/30">
                      <span className="font-semibold text-emerald-800">FULLY PAID CLAIMS</span>
                      <span className="font-extrabold text-emerald-700">{expenses.claims.paid} claims</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
