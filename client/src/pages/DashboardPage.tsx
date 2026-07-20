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
        const completedTrips = data.shuttleBookings?.filter((b: any) => b.status === "COMPLETED").length ?? 0;
        return (
          <div className="mt-3 text-xs font-semibold text-slate-600 space-y-2">
            <div className="flex justify-between items-center">
              <span>My Shuttle Trips</span>
              <span className="font-bold text-slate-800">{completedTrips} completed</span>
            </div>
            <div className="flex justify-between items-center">
              <span>My Claims</span>
              <span className="font-bold text-slate-800">PKR {data.expensesSum ?? 0}</span>
            </div>
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-800 to-blue-600 p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {user?.fullName ?? "IndusConnect User"}
          </h1>
          <p className="mt-2.5 max-w-3xl text-sm text-blue-100/90 leading-relaxed font-semibold">
            You are logged in as{" "}
            <span className="font-extrabold underline decoration-amber-400 decoration-2">{bootstrap?.role ?? user?.role?.name}</span>.
            Your permissions, menu selections, and analytics widgets are dynamically synced with backend security templates.
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
            Refresh stats
          </Button>
        </div>
      </div>

      {/* Info Stats row */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sync role</p>
              <p className="mt-2 text-base font-extrabold text-slate-800 truncate max-w-[180px]">
                {bootstrap?.role ?? "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-700">
              <UserCircle size={18} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Authorized menus</p>
              <p className="mt-2 text-xl font-black text-slate-800">
                {bootstrap?.menu?.length ?? 0} options
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3.5 text-emerald-700">
              <Activity size={18} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Alerts</p>
              <p className="mt-2 text-xl font-black text-slate-800">
                {bootstrap?.notificationSummary?.unread ?? 0} unread
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3.5 text-amber-700">
              <Bell size={18} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Security sync</p>
              <p className="mt-2 text-base font-extrabold text-emerald-700 flex items-center gap-1">
                Connected
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3.5 text-violet-700">
              <Database size={18} />
            </div>
          </div>
        </Card>
      </div>

      {/* Dynamic dashboard cards */}
      <div>
        <h2 className="mb-4 text-lg font-black text-slate-900 flex items-center gap-2">
          Your analytical command widgets
        </h2>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
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

          {cards.length === 0 && (
            <Card className="col-span-full border border-dashed border-slate-200 text-center py-10 bg-slate-50">
              <p className="text-sm text-slate-500 font-semibold italic">
                No active widgets are registered on this profile grade.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}