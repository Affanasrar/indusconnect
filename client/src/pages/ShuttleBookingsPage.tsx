import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BusFront,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCcw,
  Search,
  Send,
  TicketCheck,
  UserCheck,
  XCircle,
  Repeat,
  Trash2,
  Activity,
} from "lucide-react";
import {
  cancelShuttleBooking,
  createShuttleBooking,
  getMyShuttleBookings,
  createShuttleSubscription,
  getMyShuttleSubscriptions,
  deactivateShuttleSubscription,
} from "../api/shuttleBookings";
import { getRoutes } from "../api/routes";
import MapView from "../components/ui/MapView";
import LiveRideTracker from "../components/ui/LiveRideTracker";
import MobileCard from "../components/ui/MobileCard";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  ShuttleBooking,
  ShuttleBookingStatus,
  ShuttleSubscription,
} from "../types/shuttle";
import type { ShiftType, TransportRoute } from "../types/transport";

interface BookingFormState {
  bookingDate: string;
  shiftType: ShiftType;
  pickupArea: string;
  pickupAddress: string;
  remarks: string;
  isRecurring: boolean;
  selectedRouteId: string;
  selectedStopId: string;
  activeDays: number[];
  latitude: number;
  longitude: number;
}

const defaultForm: BookingFormState = {
  bookingDate: "",
  shiftType: "MORNING",
  pickupArea: "",
  pickupAddress: "",
  remarks: "",
  isRecurring: false,
  selectedRouteId: "",
  selectedStopId: "",
  activeDays: [1, 2, 3, 4, 5],
  latitude: 24.8607,
  longitude: 67.0104,
};

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status: ShuttleBookingStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "ASSIGNED":
      return "bg-blue-50 text-blue-700";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "NO_SHOW":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getMobileBadgeVariant(
  status: ShuttleBookingStatus
): "warning" | "info" | "success" | "error" | "neutral" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "ASSIGNED":
      return "info";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "error";
    case "NO_SHOW":
    default:
      return "neutral";
  }
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const WEEKDAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export default function ShuttleBookingsPage() {
  const { bootstrap } = useAuth();

  const [bookings, setBookings] = useState<ShuttleBooking[]>([]);
  const [subscriptions, setSubscriptions] = useState<ShuttleSubscription[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [form, setForm] = useState<BookingFormState>(defaultForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentRole = bootstrap?.role;

  const [trackingBooking, setTrackingBooking] = useState<ShuttleBooking | null>(null);

  const shiftTypes = (bootstrap?.formOptions?.shiftTypes ?? [
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NIGHT",
    "GENERAL",
  ]) as ShiftType[];

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");
      
      const [bookingsData, subscriptionsData, routesData] = await Promise.all([
        getMyShuttleBookings(),
        getMyShuttleSubscriptions(),
        getRoutes(),
      ]);

      setBookings(bookingsData || []);
      setSubscriptions(subscriptionsData || []);
      setRoutes(routesData || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError) ?? "Failed to fetch shuttle details");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentRole]);

  // Derived filtered stops for recurring form
  const selectedRouteStops = useMemo(() => {
    if (!form.selectedRouteId) return [];
    const route = routes.find((r) => r.id === form.selectedRouteId);
    return route?.smartStops ?? [];
  }, [form.selectedRouteId, routes]);

  const recurringMapMarkers = useMemo(() => {
    return selectedRouteStops.map((stop: any) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
      label: `Stop ${stop.stopOrder}: ${stop.stopName} (Arrival: ${stop.estimatedTime || "N/A"})`,
      color: form.selectedStopId === stop.id ? "bg-blue-600 animate-pulse" : "bg-emerald-500",
      pulse: form.selectedStopId === stop.id,
    }));
  }, [selectedRouteStops, form.selectedStopId]);

  const recurringMapCenter = useMemo(() => {
    if (form.selectedStopId) {
      const stop = selectedRouteStops.find((s: any) => s.id === form.selectedStopId);
      if (stop && typeof stop.latitude === "number" && typeof stop.longitude === "number") {
        return { lat: stop.latitude, lng: stop.longitude };
      }
    }
    if (selectedRouteStops.length > 0) {
      const first = selectedRouteStops[0];
      if (typeof first.latitude === "number" && typeof first.longitude === "number") {
        return { lat: first.latitude, lng: first.longitude };
      }
    }
    return { lat: 24.8607, lng: 67.0104 };
  }, [selectedRouteStops, form.selectedStopId]);

  const recurringPolylines = useMemo(() => {
    return selectedRouteStops
      .filter((stop: any) => typeof stop.latitude === "number" && typeof stop.longitude === "number")
      .map((stop: any) => ({
        latitude: stop.latitude as number,
        longitude: stop.longitude as number,
      }));
  }, [selectedRouteStops]);

  const stopMarkers = useMemo(() => {
    const list: any[] = [];
    routes.forEach((route) => {
      route.smartStops?.forEach((stop: any) => {
        if (stop.latitude && stop.longitude) {
          list.push({
            latitude: stop.latitude,
            longitude: stop.longitude,
            label: `${route.routeName} (${route.routeCode}) - Stop ${stop.stopOrder}: ${stop.stopName}`,
          });
        }
      });
    });
    return list;
  }, [routes]);

  const summary = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      assigned: bookings.filter((b) => b.status === "ASSIGNED").length,
      completed: bookings.filter((b) => b.status === "COMPLETED").length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return bookings.filter((booking) => {
      const matchesSearch =
        !keyword ||
        booking.pickupArea.toLowerCase().includes(keyword) ||
        booking.pickupAddress?.toLowerCase().includes(keyword) ||
        booking.route?.routeName?.toLowerCase().includes(keyword) ||
        booking.route?.routeCode?.toLowerCase().includes(keyword) ||
        booking.pickupStop?.stopName?.toLowerCase().includes(keyword) ||
        booking.seatNumber?.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  function resetForm() {
    setForm(defaultForm);
    setError("");
  }

  async function handleMapChange(lat: number, lng: number) {
    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "User-Agent": "IndusConnect-Application/1.0",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const addressName = data.display_name || "";
        const areaName =
          data.address?.suburb ||
          data.address?.neighbourhood ||
          data.address?.city_district ||
          data.address?.town ||
          "Pinned Location";

        setForm((prev) => ({
          ...prev,
          pickupArea: areaName,
          pickupAddress: addressName,
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (form.isRecurring) {
        if (!form.selectedRouteId) throw new Error("Please select a commute Route");
        if (!form.selectedStopId) throw new Error("Please select a Smart Stop");
        if (form.activeDays.length === 0) throw new Error("Please select active weekdays");

        await createShuttleSubscription({
          routeId: form.selectedRouteId,
          pickupStopId: form.selectedStopId,
          shiftType: form.shiftType,
          activeDays: form.activeDays,
        });

        setMessage("Standing commute subscription registered. Shuttles will auto-register daily.");
      } else {
        if (!form.bookingDate) throw new Error("Booking date is required");
        if (!form.pickupArea.trim()) throw new Error("Pickup area is required");

        await createShuttleBooking({
          bookingDate: form.bookingDate,
          shiftType: form.shiftType,
          pickupArea: form.pickupArea.trim(),
          pickupAddress: form.pickupAddress.trim() || undefined,
          remarks: form.remarks.trim() || undefined,
          latitude: form.latitude,
          longitude: form.longitude,
        });

        setMessage("Shuttle booking request submitted successfully");
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError) ?? "Failed to register shuttle request");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle temporary skip tomorrow
  async function handleCancel(booking: ShuttleBooking) {
    if (booking.status !== "PENDING" && booking.status !== "ASSIGNED") return;

    const confirmed = window.confirm(`Skip tomorrow's shuttle ride on ${formatDate(booking.bookingDate)}?`);
    if (!confirmed) return;

    try {
      setProcessingId(booking.id);
      setMessage("");
      setError("");

      await cancelShuttleBooking(booking.id, { remarks: "Skip tomorrow's commute" });
      setMessage("Tomorrow's shuttle ride has been skipped");
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError) ?? "Failed to skip shuttle ride");
    } finally {
      setProcessingId(null);
    }
  }

  // Handle permanent drop commute subscription
  async function handleDeactivateSubscription(subId: string) {
    const confirmed = window.confirm("Completely drop/cancel your recurring standing commute subscription?");
    if (!confirmed) return;

    try {
      setProcessingId(subId);
      setMessage("");
      setError("");

      await deactivateShuttleSubscription(subId);
      setMessage("Commute pass subscription has been dropped successfully");
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError) ?? "Failed to drop subscription");
    } finally {
      setProcessingId(null);
    }
  }

  function handleWeekdayToggle(dayValue: number) {
    setForm((prev) => ({
      ...prev,
      activeDays: prev.activeDays.includes(dayValue)
        ? prev.activeDays.filter((d) => d !== dayValue)
        : [...prev.activeDays, dayValue],
    }));
  }

  const [employeeViewTab, setEmployeeViewTab] = useState<"rides" | "new">("rides");

  const nextActiveBooking = useMemo(() => {
    const assigned = bookings.find((b) => b.status === "ASSIGNED");
    if (assigned) return assigned;
    const pending = bookings.find((b) => b.status === "PENDING");
    if (pending) return pending;
    return bookings[0] || null;
  }, [bookings]);

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Employee Commute Desk
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            My Shuttle Bookings & Commute Passes
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Set up a standing weekly commute pass once, or request single-day shuttle rides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadData}>
            <RefreshCcw size={16} className="mr-2" />
            Refresh Registry
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* TODAY'S NEXT COMMUTE HERO BANNER (CAREEM STYLE) */}
      {nextActiveBooking && (nextActiveBooking.status === "ASSIGNED" || nextActiveBooking.status === "PENDING") && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl border border-blue-900/40">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-2xs font-extrabold uppercase tracking-widest text-emerald-400">
                  {nextActiveBooking.status === "ASSIGNED" ? "Active Commute Ready" : "Commute Request In Queue"}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-3xs font-bold text-slate-300">
                  {formatDate(nextActiveBooking.bookingDate)} • {nextActiveBooking.shiftType}
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl truncate">
                {nextActiveBooking.route?.routeName || nextActiveBooking.pickupArea}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <MapPin size={14} className="text-red-400" />
                  Stop: <strong className="text-white">{nextActiveBooking.pickupStop?.stopName || nextActiveBooking.pickupArea}</strong>
                </span>
                {nextActiveBooking.seatNumber && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-300">
                    <TicketCheck size={14} />
                    Seat: <strong className="text-white">#{nextActiveBooking.seatNumber}</strong>
                  </span>
                )}
                {nextActiveBooking.route?.vehicle && (
                  <span className="flex items-center gap-1 font-semibold text-blue-300">
                    <BusFront size={14} />
                    Vehicle: <strong className="text-white">{nextActiveBooking.route.vehicle.vehicleNumber}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Primary 1-tap Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {nextActiveBooking.route && (
                <button
                  type="button"
                  onClick={() => setTrackingBooking(nextActiveBooking)}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-5 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5"
                >
                  <Activity size={16} className="animate-pulse" />
                  <span>Track Driver Live (Careem Radar)</span>
                </button>
              )}

              {(nextActiveBooking.status === "PENDING" || nextActiveBooking.status === "ASSIGNED") && (
                <button
                  type="button"
                  disabled={processingId === nextActiveBooking.id}
                  onClick={() => handleCancel(nextActiveBooking)}
                  className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-3 text-xs font-bold text-slate-200 transition"
                >
                  {processingId === nextActiveBooking.id ? "Skipping..." : "Skip Ride"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Rides</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-800">{summary.total}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-blue-50 p-2 sm:p-3 text-blue-700">
              <TicketCheck size={18} className="sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Pending</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-800">{summary.pending}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-amber-50 p-2 sm:p-3 text-amber-700">
              <Clock3 size={18} className="sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Assigned</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-800">{summary.assigned}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-violet-50 p-2 sm:p-3 text-violet-700">
              <UserCheck size={18} className="sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-3xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Active passes</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-emerald-700">{subscriptions.length}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-emerald-50 p-2 sm:p-3 text-emerald-700">
              <Repeat size={18} className="sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile-Only Segmented Controller (< lg) */}
      <div className="flex lg:hidden rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setEmployeeViewTab("rides")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition ${
            employeeViewTab === "rides"
              ? "bg-white text-blue-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <TicketCheck size={14} />
          <span>My Rides & Passes ({bookings.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setEmployeeViewTab("new")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition ${
            employeeViewTab === "new"
              ? "bg-white text-blue-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Send size={14} />
          <span>+ Request / Pass</span>
        </button>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Request Forms (Visible if desktop or tab === 'new') */}
        <div className={`space-y-6 ${employeeViewTab === "rides" ? "hidden lg:block" : "block"}`}>
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Send size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {form.isRecurring ? "Set Standing Commute Pass" : "Request Shuttle Ride"}
                </h2>
                <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Choose single-run or recurring auto-booking
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* RECURRING TOGGLE BUTTON */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Repeat size={13} className="text-blue-700" /> Auto-Repeat Commute daily
                </span>
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isRecurring: e.target.checked,
                    }))
                  }
                  className="rounded text-blue-700 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {form.isRecurring ? (
                /* RECURRING COMMUTE PASS FORM */
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Select Standard Route
                    </label>
                    <select
                      value={form.selectedRouteId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          selectedRouteId: e.target.value,
                          selectedStopId: "", // reset stop
                        }))
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Choose Commute Route --</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.routeName} ({route.routeCode}) - {route.shiftType}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.selectedRouteId && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                          Select Pickup Smart Stop
                        </label>
                        <select
                          value={form.selectedStopId}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              selectedStopId: e.target.value,
                            }))
                          }
                          required
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">-- Choose Pickup Stop --</option>
                          {selectedRouteStops.map((stop: any) => (
                            <option key={stop.id} value={stop.id}>
                              Stop {stop.stopOrder}: {stop.stopName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2">
                        <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                          Route Stop Layout
                        </label>
                        <MapView
                          latitude={recurringMapCenter.lat}
                          longitude={recurringMapCenter.lng}
                          readOnly={true}
                          markers={recurringMapMarkers}
                          polylines={recurringPolylines}
                          height="200px"
                        />
                        <p className="text-4xs text-slate-400 font-semibold mt-1">
                          Map displays sequenced stop coordinates. Selected stop marker is highlighted in blue.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* WEEKDAY CHECKLIST SELECTORS */}
                  <div>
                    <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Select Active Weekdays
                    </label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {WEEKDAYS.map((day) => {
                        const isSelected = form.activeDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleWeekdayToggle(day.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition ${
                              isSelected
                                ? "bg-slate-900 text-white shadow-sm"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* SINGLE RIDE BOOKING FORM */
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Booking Date
                    </label>
                    <input
                      type="date"
                      min={getTodayInputValue()}
                      value={form.bookingDate}
                      required
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bookingDate: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                        Select Pickup Location Pin
                      </label>
                      <span className="text-[10px] text-blue-700 font-bold">
                        Auto-detects nearest stop
                      </span>
                    </div>
                    <MapView
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onChange={handleMapChange}
                      onAddressChange={(address) =>
                        setForm((prev) => ({
                          ...prev,
                          pickupArea: address,
                          pickupAddress: prev.pickupAddress || address,
                        }))
                      }
                      markers={stopMarkers}
                      height="260px"
                      enableGPS={true}
                      enableSearch={true}
                      enablePresets={true}
                      enableFullscreenToggle={true}
                    />
                    <p className="text-4xs text-slate-400 font-semibold mt-1">
                      Tap "Locate Me" or drag the pin. The system automatically searches for your address and connects you to the nearest route.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Pickup Area Name
                    </label>
                    <input
                      value={form.pickupArea}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pickupArea: e.target.value,
                        }))
                      }
                      placeholder="e.g. Garden West, Saddar stop..."
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Pickup Address / Landmark
                    </label>
                    <textarea
                      rows={2}
                      value={form.pickupAddress}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pickupAddress: e.target.value,
                        }))
                      }
                      placeholder="Specify nearby landmark details..."
                      className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2 text-xs outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Remarks / Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={form.remarks}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        }))
                      }
                      placeholder="Optional instructions..."
                      className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2 text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Shift Type
                </label>
                <select
                  value={form.shiftType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shiftType: e.target.value as ShiftType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                >
                  {shiftTypes.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>

              <Button className="w-full" disabled={isSubmitting}>
                <Send size={15} className="mr-1.5" />
                {isSubmitting
                  ? "Saving commute settings..."
                  : form.isRecurring
                  ? "Register Commute Pass"
                  : "Submit Booking"}
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: Active Passes list and History */}
        <div className={`lg:col-span-2 space-y-6 ${employeeViewTab === "new" ? "hidden lg:block" : "block"}`}>
          {/* Active passes standing list */}
          {subscriptions.length > 0 && (
            <Card>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 mb-4">
                <Repeat size={16} className="text-blue-700" /> Standing Commute Subscriptions (Passes)
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {subscriptions.map((sub) => {
                  const daysLabels = sub.activeDays.map((d) => WEEKDAYS.find((wd) => wd.value === d)?.label).join(", ");
                  return (
                    <div key={sub.id} className="p-4 rounded-2xl bg-blue-50/20 border border-blue-100/30 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <BusFront className="text-blue-700" size={16} />
                          <h4 className="font-extrabold text-slate-800 text-sm">{sub.route?.routeName || "Commute Route"}</h4>
                        </div>
                        <div className="mt-2 text-2xs text-slate-500 font-semibold space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400" />
                            <span>Stop: <strong>{sub.pickupStop?.stopName || "Standard stop"}</strong></span>
                          </div>
                          <div>Shift: <strong>{sub.shiftType}</strong></div>
                          <div>Weekdays: <strong>{daysLabels}</strong></div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        disabled={processingId === sub.id}
                        onClick={() => handleDeactivateSubscription(sub.id)}
                        className="rounded-xl w-full text-2xs py-1.5 border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={12} className="mr-1" />
                        Cancel/Drop Pass
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Bookings History table */}
          <Card>
            <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Commute Booking History</h2>
                <p className="text-xs text-slate-500">{filteredBookings.length} rides logged</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search history..."
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex overflow-x-auto gap-1 py-1 no-scrollbar shrink-0">
                  {["ALL", "ASSIGNED", "PENDING", "COMPLETED"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold uppercase tracking-wider transition ${
                        statusFilter === st
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile View: Touch-Friendly Card List (< md) */}
            <div className="block md:hidden space-y-3 mb-4">
              {isLoading ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-semibold text-slate-500">
                  Fetching latest commute ledger...
                </div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <MobileCard
                    key={booking.id}
                    title={booking.pickupStop?.stopName ?? booking.pickupArea}
                    subtitle={`${formatDate(booking.bookingDate)} • ${booking.shiftType}`}
                    statusBadge={{
                      label: booking.status,
                      variant: getMobileBadgeVariant(booking.status),
                    }}
                    fields={[
                      {
                        label: "Route",
                        value: booking.route?.routeName ?? "Awaiting assignment",
                        icon: <BusFront size={13} />,
                      },
                      {
                        label: "Seat #",
                        value: booking.seatNumber ? `Seat ${booking.seatNumber}` : "Pending",
                        icon: <TicketCheck size={13} />,
                      },
                      {
                        label: "Vehicle",
                        value: booking.route?.vehicle
                          ? `${booking.route.vehicle.vehicleNumber} (${booking.route.vehicle.vehicleType})`
                          : "Pending",
                      },
                      {
                        label: "Pickup Detail",
                        value: booking.pickupAddress || booking.pickupArea,
                        icon: <MapPin size={13} />,
                      },
                    ]}
                    actions={
                      <>
                        {booking.route && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setTrackingBooking(booking)}
                            className="w-full sm:w-auto text-xs border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-bold"
                          >
                            <Activity size={14} className="mr-1.5" />
                            Live Careem Radar
                          </Button>
                        )}
                        {(booking.status === "PENDING" || booking.status === "ASSIGNED") && (
                          <Button
                            type="button"
                            variant="danger"
                            disabled={processingId === booking.id}
                            onClick={() => handleCancel(booking)}
                            className="w-full sm:w-auto text-xs"
                          >
                            <XCircle size={14} className="mr-1.5" />
                            {processingId === booking.id ? "Skipping..." : "Skip Ride"}
                          </Button>
                        )}
                      </>
                    }
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                  No shuttle bookings found.
                </div>
              )}
            </div>

            {/* Desktop View: Wide Data Table (>= md) */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full min-w-[1020px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Date / Shift</th>
                    <th className="px-4 py-2">Pickup Stop</th>
                    <th className="px-4 py-2">Assigned Route</th>
                    <th className="px-4 py-2">Stop / Seat</th>
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Cancel Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                        Fetching latest commute ledger...
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4">
                          <div className="flex items-start gap-2">
                            <CalendarDays size={17} className="mt-0.5 text-slate-400" />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{formatDate(booking.bookingDate)}</p>
                              <p className="text-xs text-slate-500">{booking.shiftType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin size={17} className="mt-0.5 text-red-500" />
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{booking.pickupArea}</p>
                              <p className="max-w-44 truncate text-xs text-slate-500">{booking.pickupAddress ?? "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {booking.route ? (
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{booking.route.routeName}</p>
                              <p className="text-xs text-slate-500">{booking.route.routeCode}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Awaiting assignment</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-700">{booking.pickupStop?.stopName ?? "Not assigned"}</p>
                          <p className="text-xs text-slate-500">Seat: {booking.seatNumber ?? "-"}</p>
                        </td>
                        <td className="px-4 py-4">
                          {booking.route?.vehicle ? (
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{booking.route.vehicle.vehicleNumber}</p>
                              <p className="text-xs text-slate-500">{booking.route.vehicle.vehicleType}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                          {booking.remarks && booking.remarks.includes("Auto-generated") && (
                            <p className="mt-2 text-xs font-bold text-blue-700 flex items-center gap-0.5">
                              <Repeat size={10} /> Auto-generated
                            </p>
                          )}
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {booking.route && (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setTrackingBooking(booking)}
                                className="border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-bold"
                              >
                                <Activity size={15} className="mr-1.5" />
                                Live Careem Radar
                              </Button>
                            )}
                            {(booking.status === "PENDING" || booking.status === "ASSIGNED") && (
                              <Button
                                type="button"
                                variant="danger"
                                disabled={processingId === booking.id}
                                onClick={() => handleCancel(booking)}
                              >
                                <XCircle size={15} className="mr-2" />
                                {processingId === booking.id ? "Skipping..." : "Skip Ride"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}

                  {!isLoading && filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        No shuttle bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
      {/* Real-time Careem / inDrive Live Ride Tracker */}
      {trackingBooking && trackingBooking.route && (
        <LiveRideTracker
          routeId={trackingBooking.routeId || trackingBooking.route.id}
          routeName={trackingBooking.route.routeName}
          routeCode={trackingBooking.route.routeCode}
          driverName={
            trackingBooking.route.driver?.user?.fullName ||
            "Assigned Fleet Captain"
          }
          driverPhone={
            trackingBooking.route.driver?.user?.phone ||
            "+92 300 1234567"
          }
          vehicleNumber={
            trackingBooking.route.vehicle?.vehicleNumber || "IND-7821"
          }
          vehicleModel={
            trackingBooking.route.vehicle
              ? `${trackingBooking.route.vehicle.vehicleType} (${trackingBooking.route.vehicle.capacity} seats)`
              : "Indus Commute Shuttle"
          }
          seatNumber={trackingBooking.seatNumber || undefined}
          pickupStop={trackingBooking.pickupStop}
          smartStops={trackingBooking.route.smartStops || []}
          onClose={() => setTrackingBooking(null)}
        />
      )}
    </div>
  );
}