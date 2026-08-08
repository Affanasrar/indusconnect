import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  CheckCircle2,
  Database,
  UserCircle,
  TrendingUp,
  ShieldAlert,
  Wrench,
  Brush,
  FileText,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { http } from "../api/http";
import { Link } from "react-router-dom";

interface CardData {
  key: string;
  title: string;
  api: string;
}

export default function DashboardPage() {
  const { bootstrap, user } = useAuth();
  const cards: CardData[] = bootstrap?.dashboardCards ?? [];

  // Card payload states
  const [payloads, setPayloads] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  async function fetchCardPayloads() {
    try {
      setIsLoading(true);
      
      const newPayloads: Record<string, any> = {};
      
      // Perform requests in parallel, catching errors per request to keep Dashboard robust
      await Promise.all(
        cards.map(async (card) => {
          try {
            // Translate the backend path (remove /api prefix since client http base url is already configured)
            const requestPath = card.api.startsWith("/api") ? card.api.substring(4) : card.api;
            const response = await http.get(requestPath);
            newPayloads[card.key] = response.data.data ?? response.data;
          } catch (err) {
            console.error(`Failed to fetch dashboard card ${card.key}:`, err);
            newPayloads[card.key] = null;
          }
        })
      );

      setPayloads(newPayloads);
    } catch (err) {
      console.error("Failed to fetch full dashboard card metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (cards.length > 0) {
      fetchCardPayloads();
    } else {
      setIsLoading(false);
    }
  }, [bootstrap]);

  // Helper to render customized visuals per card key
  function renderCardContent(card: CardData) {
    const data = payloads[card.key];

    if (isLoading) {
      return <div className="text-3xs text-slate-400 italic mt-2 animate-pulse">Syncing...</div>;
    }

    if (data === undefined || data === null) {
      return (
        <div className="text-3xs text-slate-400 italic mt-2">
          Unable to retrieve stats or restricted view.
        </div>
      );
    }

    switch (card.key) {
      case "notifications": {
        const count = data.unread ?? data.count ?? 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count}</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Unread Alerts</p>
            <Link to="/notifications" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Go to Inbox <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "overview": {
        const totals = data.totals ?? {};
        return (
          <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center">
              <span>Ecosystem Users</span>
              <span className="font-extrabold text-slate-800">{totals.users ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Shuttle Fleet</span>
              <span className="font-extrabold text-slate-800">{totals.vehicles ?? 0} vehicles</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Active Bookings</span>
              <span className="font-extrabold text-slate-800">{totals.shuttleBookings ?? 0}</span>
            </div>
            <Link to="/reports" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              View reports analytics <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "pendingApprovals": {
        const counts = data.counts ?? {};
        const totalPending = (counts.pendingTravelRequests ?? 0) + (counts.pendingExpenseClaims ?? 0) + (counts.pendingShuttleBookings ?? 0);
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{totalPending}</div>
            <div className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Pending items to audit</div>
            <div className="mt-2 space-y-1 text-2xs text-slate-500 font-bold">
              <div>&bull; {counts.pendingTravelRequests ?? 0} travel requests</div>
              <div>&bull; {counts.pendingExpenseClaims ?? 0} expense claims</div>
            </div>
          </div>
        );
      }

      case "liveTracking": {
        const activeCount = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{activeCount}</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Active Coordinate Feeds</p>
            <Link to="/telemetry" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Monitor Map Console <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "auditLogs": {
        const logCount = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{logCount} logs</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Recent Security events</p>
            <Link to="/audit-logs" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Inspect logs ledger <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "myDashboard": {
        const recentBooking = data.recentShuttleBookings?.[0];
        const totalBookingsCount = data.counts?.shuttleBookings ?? 0;
        
        return (
          <div className="mt-3 text-xs font-semibold text-slate-600 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span>Total Commutes Booked</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{totalBookingsCount} rides</span>
            </div>
            
            {recentBooking ? (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                <p className="text-4xs text-slate-400 font-bold uppercase tracking-wider">Most Recent Commute</p>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-bold truncate max-w-[120px]">{recentBooking.pickupArea}</span>
                  <span className="text-3xs bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase">
                    {recentBooking.status}
                  </span>
                </div>
                <div className="text-3xs text-slate-500 space-y-0.5">
                  <p>Date: {new Date(recentBooking.bookingDate).toLocaleDateString()}</p>
                  <p>Shift: {recentBooking.shiftType} ({recentBooking.route?.startTime || "N/A"})</p>
                  {recentBooking.pickupStop && (
                    <p>Stop: {recentBooking.pickupStop.stopName} (Arrival: {recentBooking.pickupStop.estimatedTime || "N/A"})</p>
                  )}
                  {recentBooking.seatNumber && (
                    <p className="text-emerald-700 font-extrabold">Seat: {recentBooking.seatNumber}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-slate-400 italic text-3xs">
                No shuttle rides booked yet.
              </div>
            )}
            
            <Link to="/shuttle-bookings" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Manage Shuttle Desk <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "myTravelRequests": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} requests</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Travel bookings dispatch</p>
            <Link to="/travel-requests" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              File Travel request <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "myExpenseClaims": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} claims</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Submitted Expense sheets</p>
            <Link to="/expenses" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              File Expense claim <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "assignedRoutes": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} routes</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Assigned shuttle journeys</p>
            <Link to="/driver-trips" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Manage Driver trips <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "myTelemetry": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} entries</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">GPS telemetry synced logs</p>
          </div>
        );
      }

      case "transportSummary": {
        const totalVehicles = data.vehicles ?? 0;
        const totalBookings = data.bookings?.total ?? 0;
        return (
          <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center">
              <span>Fleet Vehicles</span>
              <span className="font-extrabold text-slate-800">{totalVehicles} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Active Seat Bookings</span>
              <span className="font-extrabold text-slate-800">{totalBookings} runs</span>
            </div>
            <Link to="/reports" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              View Fleet metrics <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "maintenance": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} open</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Defects Reported</p>
            <Link to="/maintenance" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Go to Repair desk <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "accommodationSummary": {
        const rooms = data.rooms ?? {};
        return (
          <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center">
              <span>Available Units</span>
              <span className="font-extrabold text-slate-800">{rooms.available ?? 0} rooms</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Occupied Stay</span>
              <span className="font-extrabold text-slate-800">{rooms.occupied ?? 0} rooms</span>
            </div>
            <Link to="/reports" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              View lodging reports <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "housekeeping": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} cleaning</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Pending Room tasks</p>
            <Link to="/maintenance" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Manage Cleanings <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "expenseSummary": {
        const amounts = data.amounts ?? {};
        return (
          <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center">
              <span>Total Synced Amount</span>
              <span className="font-extrabold text-slate-800">PKR {amounts.totalAmount?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Approved Claims Sum</span>
              <span className="font-extrabold text-blue-700">PKR {amounts.approvedAmount?.toLocaleString() ?? 0}</span>
            </div>
            <Link to="/reports" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Audit budget reports <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "pendingVendorBills": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} bills</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Pending Invoice reviews</p>
            <Link to="/vendors" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Reconcile Vendor bills <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "erpExports": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} files</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">ERP Export Sync history</p>
            <Link to="/erp-exports" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Open sync ledger <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "travelSummary": {
        const travelRequests = data.travelRequests ?? {};
        return (
          <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center">
              <span>Approved Travel</span>
              <span className="font-extrabold text-slate-800">{travelRequests.approved ?? 0} runs</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Travel Requests</span>
              <span className="font-extrabold text-slate-800">{travelRequests.total ?? 0} requests</span>
            </div>
          </div>
        );
      }

      case "proxyBookings": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800">{count} bookings</div>
            <p className="text-3xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Proxy creations logs</p>
            <Link to="/proxy-bookings" className="text-3xs text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-2">
              Open Proxy desk <ArrowRight size={10} />
            </Link>
          </div>
        );
      }

      case "emergencyEvents": {
        const count = Array.isArray(data) ? data.length : 0;
        return (
          <div className="mt-3 flex justify-between items-center bg-red-50 p-2 rounded-xl border border-red-100 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <AlertTriangle size={13} className="text-red-600 animate-pulse" /> Emergency Alerts
            </span>
            <span className="font-bold text-red-700">{count} events</span>
          </div>
        );
      }

      default:
        return (
          <div className="mt-2 text-3xs font-semibold text-slate-500">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        );
    }
  }

  // Get matching icon per card key for rich aesthetics
  function getCardIcon(key: string) {
    switch (key) {
      case "notifications":
        return <Bell size={18} />;
      case "overview":
        return <Activity size={18} />;
      case "pendingApprovals":
        return <ShieldAlert size={18} />;
      case "liveTracking":
        return <TrendingUp size={18} />;
      case "auditLogs":
        return <FileText size={18} />;
      case "myDashboard":
        return <Activity size={18} />;
      case "myTravelRequests":
        return <FileText size={18} />;
      case "myExpenseClaims":
        return <DollarSign size={18} />;
      case "assignedRoutes":
        return <TrendingUp size={18} />;
      case "myTelemetry":
        return <Activity size={18} />;
      case "transportSummary":
        return <TrendingUp size={18} />;
      case "maintenance":
        return <Wrench size={18} />;
      case "accommodationSummary":
        return <TrendingUp size={18} />;
      case "housekeeping":
        return <Brush size={18} />;
      case "expenseSummary":
        return <DollarSign size={18} />;
      case "pendingVendorBills":
        return <DollarSign size={18} />;
      case "erpExports":
        return <Database size={18} />;
      case "travelSummary":
        return <TrendingUp size={18} />;
      case "proxyBookings":
        return <UserCircle size={18} />;
      case "emergencyEvents":
        return <AlertTriangle size={18} />;
      default:
        return <CheckCircle2 size={18} />;
    }
  }

  function getCardTheme(key: string) {
    switch (key) {
      case "emergencyEvents":
        return "bg-red-50 text-red-700";
      case "pendingApprovals":
        return "bg-amber-50 text-amber-700";
      case "maintenance":
        return "bg-violet-50 text-violet-700";
      case "erpExports":
        return "bg-emerald-50 text-emerald-700";
      default:
        return "bg-blue-50 text-blue-700";
    }
  }

  const personalCardKeys = ["myDashboard", "myTravelRequests", "myExpenseClaims", "notifications"];
  const personalCards = cards.filter((c) => personalCardKeys.includes(c.key));
  const managementCards = cards.filter((c) => !personalCardKeys.includes(c.key));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-800 to-blue-600 p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            Enterprise Mobility & Logistics
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Welcome, {user?.fullName ?? "User"}
          </h1>
          <p className="mt-2.5 max-w-3xl text-sm text-blue-100/90 leading-relaxed font-semibold">
            Manage your daily shuttle commutes, official business travel, lodging reservations, and operational workflows from your enterprise console.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchCardPayloads}
            disabled={isLoading}
            className="rounded-2xl border-0 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5"
          >
            <RefreshCcw size={14} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Overview
          </Button>
        </div>
      </div>

      {/* SECTION 1: Personal Employee Mobility Desk */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserCircle className="text-blue-700" size={20} /> My Personal Mobility & Requests Desk
            </h2>
            <p className="text-xs text-slate-500 font-medium">Your personal shuttle bookings, travel requests, and expense claim statuses.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/shuttle-bookings">
              <Button variant="secondary" className="rounded-xl text-3xs py-1.5 border border-slate-200">
                + Book Shuttle
              </Button>
            </Link>
            <Link to="/travel-requests">
              <Button variant="secondary" className="rounded-xl text-3xs py-1.5 border border-slate-200">
                + Request Travel
              </Button>
            </Link>
            <Link to="/expenses">
              <Button variant="secondary" className="rounded-xl text-3xs py-1.5 border border-slate-200">
                + Claim Expense
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {personalCards.map((card) => (
            <Card key={card.key} className="hover:shadow-md transition duration-300 border border-slate-100 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-start gap-3.5">
                <div className={`rounded-2xl p-3 shrink-0 ${getCardTheme(card.key)}`}>
                  {getCardIcon(card.key)}
                </div>

                <div className="w-full">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">{card.title}</h3>
                  {renderCardContent(card)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 2: Management & Operational Desk */}
      {managementCards.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-amber-600" size={20} /> Management & Operational Desk
            </h2>
            <p className="text-xs text-slate-500 font-medium">Administrative tools, approval pipelines, and operational monitoring for your role.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {managementCards.map((card) => (
              <Card key={card.key} className="hover:shadow-md transition duration-300 border border-slate-100 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-start gap-3.5">
                  <div className={`rounded-2xl p-3 shrink-0 ${getCardTheme(card.key)}`}>
                    {getCardIcon(card.key)}
                  </div>

                  <div className="w-full">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">{card.title}</h3>
                    {renderCardContent(card)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}