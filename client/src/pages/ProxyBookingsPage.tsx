import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Briefcase,
  AlertTriangle,
  RefreshCcw,
  PlusCircle,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Truck,
  Hotel,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  createProxyShuttleBooking,
  createProxyTravelRequest,
  getMyCreatedProxyRecords,
  getAllProxyRecords,
} from "../api/proxyBookings";
import { getUsers } from "../api/users";
import type { UserProfile } from "../types/frontend";
import type { ShuttleBooking } from "../types/shuttle";
import type { TravelRequest, TravelType, TravelUrgency } from "../types/travel";
import type { ShiftType } from "../types/transport";

interface ProxyShuttleFormState {
  employeeId: string;
  bookingDate: string;
  shiftType: ShiftType;
  pickupArea: string;
  pickupAddress: string;
  remarks: string;
  proxyReason: string;
}

interface ProxyTravelFormState {
  employeeId: string;
  travelType: TravelType;
  urgency: TravelUrgency;
  purpose: string;
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  returnDate: string;
  accommodationRequired: boolean;
  transportRequired: boolean;
  estimatedBudget: string;
  employeeRemarks: string;
  proxyReason: string;
}

const defaultShuttleForm: ProxyShuttleFormState = {
  employeeId: "",
  bookingDate: "",
  shiftType: "MORNING",
  pickupArea: "",
  pickupAddress: "",
  remarks: "",
  proxyReason: "",
};

const defaultTravelForm: ProxyTravelFormState = {
  employeeId: "",
  travelType: "INTER_CAMPUS",
  urgency: "NORMAL",
  purpose: "",
  fromLocation: "",
  toLocation: "",
  departureDate: "",
  returnDate: "",
  accommodationRequired: false,
  transportRequired: false,
  estimatedBudget: "",
  employeeRemarks: "",
  proxyReason: "",
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };
    return responseError.response?.data?.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}

export default function ProxyBookingsPage() {
  const { bootstrap } = useAuth();
  
  // Roles
  const isSuperOrManager =
    bootstrap?.role === "SUPER_ADMIN" || bootstrap?.role === "MANAGER";

  // Operational states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [shuttleBookings, setShuttleBookings] = useState<ShuttleBooking[]>([]);
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([]);

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"SHUTTLE" | "TRAVEL">("SHUTTLE");
  const [scopeFilter, setScopeFilter] = useState<"MY" | "ALL">("MY");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modals Forms states
  const [showShuttleModal, setShowShuttleModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [shuttleForm, setShuttleForm] = useState<ProxyShuttleFormState>(defaultShuttleForm);
  const [travelForm, setTravelForm] = useState<ProxyTravelFormState>(defaultTravelForm);

  // Messages Alerts
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List of employees (recipients for proxy bookings must have role EMPLOYEE)
  const employeeUsers = useMemo(() => {
    return users.filter((u) => u.role?.name === "EMPLOYEE");
  }, [users]);

  // Load proxy logs
  async function loadLogs(targetScope = scopeFilter) {
    try {
      setIsLoading(true);
      setError("");

      const [usersList, records] = await Promise.all([
        getUsers(),
        targetScope === "ALL" && isSuperOrManager
          ? getAllProxyRecords()
          : getMyCreatedProxyRecords(),
      ]);

      setUsers(usersList || []);
      setShuttleBookings(records.shuttleBookings || []);
      setTravelRequests(records.travelRequests || []);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load proxy bookings ledger");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(scopeFilter);
  }, [scopeFilter]);

  // Filtering lists
  const filteredShuttles = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return shuttleBookings.filter((b) => {
      return (
        !keyword ||
        (b.employee?.fullName && b.employee.fullName.toLowerCase().includes(keyword)) ||
        b.pickupArea.toLowerCase().includes(keyword) ||
        (b.remarks && b.remarks.toLowerCase().includes(keyword)) ||
        (b.proxyReason && b.proxyReason.toLowerCase().includes(keyword))
      );
    });
  }, [shuttleBookings, searchQuery]);

  const filteredTravels = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return travelRequests.filter((r) => {
      return (
        !keyword ||
        (r.employee?.fullName && r.employee.fullName.toLowerCase().includes(keyword)) ||
        r.purpose.toLowerCase().includes(keyword) ||
        r.fromLocation.toLowerCase().includes(keyword) ||
        r.toLocation.toLowerCase().includes(keyword) ||
        (r.proxyReason && r.proxyReason.toLowerCase().includes(keyword))
      );
    });
  }, [travelRequests, searchQuery]);

  const summary = useMemo(() => {
    return {
      shuttlesCount: shuttleBookings.length,
      travelsCount: travelRequests.length,
      totalCount: shuttleBookings.length + travelRequests.length,
    };
  }, [shuttleBookings, travelRequests]);

  // Submit Proxy Shuttle Booking
  async function handleShuttleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!shuttleForm.employeeId) {
        throw new Error("Please select an employee");
      }
      if (!shuttleForm.bookingDate) {
        throw new Error("Shuttle booking date is required");
      }
      if (!shuttleForm.pickupArea.trim()) {
        throw new Error("Pickup area is required");
      }
      if (!shuttleForm.proxyReason.trim() || shuttleForm.proxyReason.trim().length < 3) {
        throw new Error("Proxy reason is required (minimum 3 characters)");
      }

      await createProxyShuttleBooking({
        employeeId: shuttleForm.employeeId,
        bookingDate: shuttleForm.bookingDate,
        shiftType: shuttleForm.shiftType,
        pickupArea: shuttleForm.pickupArea.trim(),
        pickupAddress: shuttleForm.pickupAddress.trim() || undefined,
        remarks: shuttleForm.remarks.trim() || undefined,
        proxyReason: shuttleForm.proxyReason.trim(),
      });

      setMessage("Proxy shuttle booking created successfully");
      setShuttleForm(defaultShuttleForm);
      setShowShuttleModal(false);
      await loadLogs();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to log proxy booking");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit Proxy Travel Request
  async function handleTravelSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!travelForm.employeeId) {
        throw new Error("Please select an employee");
      }
      if (!travelForm.purpose.trim() || travelForm.purpose.trim().length < 5) {
        throw new Error("Purpose is required (minimum 5 characters)");
      }
      if (!travelForm.fromLocation.trim() || !travelForm.toLocation.trim()) {
        throw new Error("Origin and destination locations are required");
      }
      if (!travelForm.departureDate) {
        throw new Error("Departure date is required");
      }
      if (!travelForm.proxyReason.trim() || travelForm.proxyReason.trim().length < 3) {
        throw new Error("Proxy reason is required (minimum 3 characters)");
      }

      const budgetVal = parseFloat(travelForm.estimatedBudget);

      await createProxyTravelRequest({
        employeeId: travelForm.employeeId,
        travelType: travelForm.travelType,
        urgency: travelForm.urgency,
        purpose: travelForm.purpose.trim(),
        fromLocation: travelForm.fromLocation.trim(),
        toLocation: travelForm.toLocation.trim(),
        departureDate: travelForm.departureDate,
        returnDate: travelForm.returnDate || undefined,
        accommodationRequired: travelForm.accommodationRequired,
        transportRequired: travelForm.transportRequired,
        estimatedBudget: isNaN(budgetVal) ? undefined : budgetVal,
        employeeRemarks: travelForm.employeeRemarks.trim() || undefined,
        proxyReason: travelForm.proxyReason.trim(),
      });

      setMessage("Proxy travel request logged successfully");
      setTravelForm(defaultTravelForm);
      setShowTravelModal(false);
      await loadLogs();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to log proxy request");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Proxy Bookings Desk
          </h1>
          <p className="text-sm text-slate-500">
            Manage transport seats and travel authorizations on behalf of offline, non-digital, or support staff.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => loadLogs()}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 text-xs py-2"
          >
            <RefreshCcw size={15} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Sync Logs
          </Button>

          {activeTab === "SHUTTLE" ? (
            <Button
              onClick={() => {
                setShuttleForm(defaultShuttleForm);
                setShowShuttleModal(true);
              }}
              className="rounded-xl text-xs py-2"
            >
              <PlusCircle size={15} className="mr-1.5" />
              Book Proxy Seat
            </Button>
          ) : (
            <Button
              onClick={() => {
                setTravelForm(defaultTravelForm);
                setShowTravelModal(true);
              }}
              className="rounded-xl text-xs py-2"
            >
              <PlusCircle size={15} className="mr-1.5" />
              Request Proxy Travel
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-100">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 border border-red-100">
          <XCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Proxy Items</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{summary.totalCount}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-700">
              <Users size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shuttle Bookings</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{summary.shuttlesCount}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3.5 text-amber-700">
              <Truck size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Travel Requests</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{summary.travelsCount}</p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3.5 text-violet-700">
              <Briefcase size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Tabs bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("SHUTTLE")}
            className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
              activeTab === "SHUTTLE"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Proxy Shuttles
          </button>
          <button
            onClick={() => setActiveTab("TRAVEL")}
            className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
              activeTab === "TRAVEL"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Proxy Travel Requests
          </button>
        </div>

        <div className="flex items-center gap-3 pb-2 sm:pb-0">
          {isSuperOrManager && (
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setScopeFilter("MY")}
                className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                  scopeFilter === "MY" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                My Submissions
              </button>
              <button
                onClick={() => setScopeFilter("ALL")}
                className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                  scopeFilter === "ALL" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                System Registry
              </button>
            </div>
          )}

          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search proxy records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-600 transition bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCcw size={40} className="animate-spin text-blue-700" />
          <p className="mt-4 text-sm font-medium">Syncing proxy bookings history...</p>
        </div>
      ) : activeTab === "SHUTTLE" ? (
        /* PROXY SHUTTLES TAB */
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Booking Date</th>
                <th className="px-6 py-4">Shift Type</th>
                <th className="px-6 py-4">Pickup Point</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Logged By</th>
                <th className="px-6 py-4">Proxy Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShuttles.map((booking) => {
                const statusColors = {
                  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
                  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-100",
                  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
                  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  NO_SHOW: "bg-red-50 text-red-700 border-red-100",
                };

                return (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div>{booking.employee?.fullName || "Employee"}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{booking.employee?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-700">
                      {booking.shiftType}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{booking.pickupArea}</div>
                      {booking.pickupAddress && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">{booking.pickupAddress}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                      {booking.proxyCreatedBy?.fullName || "System Admin"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate" title={booking.proxyReason ?? undefined}>
                      {booking.proxyReason}
                    </td>
                  </tr>
                );
              })}

              {filteredShuttles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <AlertTriangle className="mx-auto text-slate-300" size={32} />
                    <h4 className="mt-3 font-bold text-slate-800 text-sm">No proxy shuttle bookings</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Use the "Book Proxy Seat" button to register transport on behalf of staff.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* PROXY TRAVEL REQUESTS TAB */
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Route Path</th>
                <th className="px-6 py-4">Travel Details</th>
                <th className="px-6 py-4">Stay Requirements</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Logged By</th>
                <th className="px-6 py-4">Proxy Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTravels.map((request) => {
                const statusColors = {
                  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
                  PENDING_MANAGER_APPROVAL: "bg-orange-50 text-orange-700 border-orange-100",
                  APPROVED: "bg-blue-50 text-blue-700 border-blue-100",
                  REJECTED: "bg-red-50 text-red-700 border-red-100",
                  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
                };

                return (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div>{request.employee?.fullName || "Employee"}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{request.employee?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-800 font-bold">
                        <span>{request.fromLocation}</span>
                        <span>&rarr;</span>
                        <span>{request.toLocation}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        {request.travelType.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">{request.purpose}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span>Dep: {new Date(request.departureDate).toLocaleDateString()}</span>
                        {request.returnDate && (
                          <span>• Ret: {new Date(request.returnDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 text-slate-400 text-xs">
                        <span className={`flex items-center gap-0.5 ${request.transportRequired ? "text-blue-700 font-bold" : ""}`}>
                          <Truck size={12} /> Cab
                        </span>
                        <span className={`flex items-center gap-0.5 ${request.accommodationRequired ? "text-violet-700 font-bold" : ""}`}>
                          <Hotel size={12} /> Stay
                        </span>
                      </div>
                      {request.estimatedBudget && (
                        <div className="text-slate-800 font-bold text-xs mt-1">PKR {request.estimatedBudget.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider ${statusColors[request.status as keyof typeof statusColors]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                      {request.proxyCreatedBy?.fullName || "System Admin"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate" title={request.proxyReason ?? undefined}>
                      {request.proxyReason}
                    </td>
                  </tr>
                );
              })}

              {filteredTravels.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <AlertTriangle className="mx-auto text-slate-300" size={32} />
                    <h4 className="mt-3 font-bold text-slate-800 text-sm">No proxy travel requests</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Use the "Request Proxy Travel" button to request authorization on behalf of staff.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PROXY SHUTTLE BOOKING MODAL */}
      {showShuttleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Book Shuttle Seat (Proxy)
            </h3>

            <form onSubmit={handleShuttleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Employee *
                </label>
                <select
                  required
                  value={shuttleForm.employeeId}
                  onChange={(e) => setShuttleForm({ ...shuttleForm, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                >
                  <option value="">Select Employee...</option>
                  {employeeUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (Code: {u.employeeCode || "-"} • Dept: {u.department || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={shuttleForm.bookingDate}
                    onChange={(e) => setShuttleForm({ ...shuttleForm, bookingDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Shift Type *
                  </label>
                  <select
                    value={shuttleForm.shiftType}
                    onChange={(e) =>
                      setShuttleForm({ ...shuttleForm, shiftType: e.target.value as ShiftType })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="MORNING">Morning Shift</option>
                    <option value="AFTERNOON">Afternoon Shift</option>
                    <option value="EVENING">Evening Shift</option>
                    <option value="NIGHT">Night Shift</option>
                    <option value="GENERAL">General Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Pickup Area/Sector *
                </label>
                <input
                  type="text"
                  required
                  value={shuttleForm.pickupArea}
                  onChange={(e) => setShuttleForm({ ...shuttleForm, pickupArea: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="e.g. Garden West, Saddar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Detailed Pickup Address
                </label>
                <input
                  type="text"
                  value={shuttleForm.pickupAddress}
                  onChange={(e) => setShuttleForm({ ...shuttleForm, pickupAddress: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Street landmarks, building number..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Proxy Reason (Mandatory) *
                </label>
                <input
                  type="text"
                  required
                  value={shuttleForm.proxyReason}
                  onChange={(e) => setShuttleForm({ ...shuttleForm, proxyReason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="e.g. Employee has no smartphone / request via call"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Shuttle Remarks
                </label>
                <textarea
                  value={shuttleForm.remarks}
                  onChange={(e) => setShuttleForm({ ...shuttleForm, remarks: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Luggage remarks, physical requirements..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowShuttleModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Logging booking..." : "Log Shuttle Booking"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROXY TRAVEL REQUEST MODAL */}
      {showTravelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Request Travel & Accommodation (Proxy)
            </h3>

            <form onSubmit={handleTravelSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target Employee *
                  </label>
                  <select
                    required
                    value={travelForm.employeeId}
                    onChange={(e) => setTravelForm({ ...travelForm, employeeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="">Select Employee...</option>
                    {employeeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (Grade: {u.hrGrade || "-"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Purpose of Travel *
                  </label>
                  <input
                    type="text"
                    required
                    value={travelForm.purpose}
                    onChange={(e) => setTravelForm({ ...travelForm, purpose: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Lahore site coordination audit"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Travel Type *
                  </label>
                  <select
                    value={travelForm.travelType}
                    onChange={(e) =>
                      setTravelForm({ ...travelForm, travelType: e.target.value as TravelType })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="INTER_CAMPUS">Inter Campus</option>
                    <option value="WITHIN_CITY">Within City</option>
                    <option value="INTER_CITY">Inter City</option>
                    <option value="INTERNATIONAL">International</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Urgency Rating
                  </label>
                  <select
                    value={travelForm.urgency}
                    onChange={(e) =>
                      setTravelForm({ ...travelForm, urgency: e.target.value as TravelUrgency })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency Bypass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Origin City/Campuses *
                  </label>
                  <input
                    type="text"
                    required
                    value={travelForm.fromLocation}
                    onChange={(e) => setTravelForm({ ...travelForm, fromLocation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Karachi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Destination City/Campuses *
                  </label>
                  <input
                    type="text"
                    required
                    value={travelForm.toLocation}
                    onChange={(e) => setTravelForm({ ...travelForm, toLocation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Lahore site"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={travelForm.departureDate}
                    onChange={(e) => setTravelForm({ ...travelForm, departureDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Return Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={travelForm.returnDate}
                    onChange={(e) => setTravelForm({ ...travelForm, returnDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={travelForm.accommodationRequired}
                    onChange={(e) =>
                      setTravelForm({ ...travelForm, accommodationRequired: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Require Lodging Stay
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={travelForm.transportRequired}
                    onChange={(e) =>
                      setTravelForm({ ...travelForm, transportRequired: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Require Cab Transport
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Estimated Budget (PKR)
                  </label>
                  <input
                    type="number"
                    value={travelForm.estimatedBudget}
                    onChange={(e) => setTravelForm({ ...travelForm, estimatedBudget: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. 20000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Proxy Reason (Mandatory) *
                  </label>
                  <input
                    type="text"
                    required
                    value={travelForm.proxyReason}
                    onChange={(e) => setTravelForm({ ...travelForm, proxyReason: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Employee has spotty internet in the fields"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Remarks on Behalf of Employee
                </label>
                <textarea
                  value={travelForm.employeeRemarks}
                  onChange={(e) => setTravelForm({ ...travelForm, employeeRemarks: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Note special logistics instructions..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowTravelModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Submitting request..." : "Log Travel Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
