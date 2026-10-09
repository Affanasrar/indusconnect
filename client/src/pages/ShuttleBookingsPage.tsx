import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BusFront,
  CalendarDays,
  MapPin,
  RefreshCcw,
  Search,
  Send,
  TicketCheck,
  XCircle,
  Repeat,
  Trash2,
  Activity,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Sparkles,
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

  const [activeTab, setActiveTab] = useState<"book" | "history" | "passes">("book");
  const [historyViewMode, setHistoryViewMode] = useState<"cards" | "table">("cards");

  const nextActiveBooking = useMemo(() => {
    const assigned = bookings.find((b) => b.status === "ASSIGNED");
    if (assigned) return assigned;
    const pending = bookings.find((b) => b.status === "PENDING");
    if (pending) return pending;
    return bookings[0] || null;
  }, [bookings]);

  function setDateShortcut(daysOffset: number) {
    const d = new Date(Date.now() + daysOffset * 86400000);
    setForm((prev) => ({ ...prev, bookingDate: d.toISOString().slice(0, 10) }));
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center pb-2 border-b border-[#DCE5F0]/80">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102644]">
            Shuttle Bookings & Commute Passes
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#64748B]">
            Reserve your seat on scheduled corporate shuttles or configure recurring commute passes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCcw size={13} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ALERTS */}
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

      {/* 2. TOP PINNED "NEXT COMMUTE" BOARDING PASS HUD */}
      {nextActiveBooking && (nextActiveBooking.status === "ASSIGNED" || nextActiveBooking.status === "PENDING") && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl border border-blue-900/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-2xs font-extrabold uppercase tracking-widest text-emerald-400">
                  {nextActiveBooking.status === "ASSIGNED" ? "Active Commute Reserved" : "Commute Request In Dispatch"}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-3xs font-bold text-slate-300">
                  {formatDate(nextActiveBooking.bookingDate)} • {nextActiveBooking.shiftType}
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl truncate">
                {nextActiveBooking.route?.routeName || nextActiveBooking.pickupArea}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <MapPin size={14} className="text-red-400" />
                  Pickup: <strong className="text-white">{nextActiveBooking.pickupStop?.stopName || nextActiveBooking.pickupArea}</strong>
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
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {nextActiveBooking.route && (
                <button
                  type="button"
                  onClick={() => setTrackingBooking(nextActiveBooking)}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-5 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5"
                >
                  <Activity size={16} className="animate-pulse" />
                  <span>Track Driver Live (Transit Radar)</span>
                </button>
              )}

              {(nextActiveBooking.status === "PENDING" || nextActiveBooking.status === "ASSIGNED") && (
                <button
                  type="button"
                  disabled={processingId === nextActiveBooking.id}
                  onClick={() => handleCancel(nextActiveBooking)}
                  className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-3 text-xs font-bold text-slate-200 transition"
                >
                  {processingId === nextActiveBooking.id ? "Skipping..." : "Skip Ride"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRIMARY WORKSPACE NAVIGATION TABS */}
      <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("book")}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === "book"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BusFront size={15} />
          <span>Book a Shuttle</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-w-[160px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === "history"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <TicketCheck size={15} />
          <span>My Rides & Tickets ({bookings.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("passes")}
          className={`flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === "passes"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Repeat size={15} />
          <span>Standing Passes ({subscriptions.length})</span>
        </button>
      </div>

      {/* 4. TAB 1: BOOK A SHUTTLE (SPACIOUS 50/50 STUDIO ON DESKTOP) */}
      {activeTab === "book" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          {/* LEFT: BOOKING CONFIGURATION STUDIO */}
          <Card className="p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Send size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {form.isRecurring ? "Configure Standing Commute Pass" : "Request Single Shuttle Ride"}
                </h2>
                <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Corporate fleet daily seat reservation
                </p>
              </div>
            </div>

            {/* TRIP MODE TOGGLE CARDS */}
            <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-100 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isRecurring: false }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition ${
                  !form.isRecurring
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TicketCheck size={15} />
                <span>Single Ride (Daily)</span>
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isRecurring: true }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition ${
                  form.isRecurring
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Repeat size={15} />
                <span>Standing Pass (Weekly)</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {form.isRecurring ? (
                /* STANDING COMMUTE PASS CONFIG */
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Select Commute Route
                    </label>
                    <select
                      value={form.selectedRouteId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          selectedRouteId: e.target.value,
                          selectedStopId: "",
                        }))
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                    >
                      <option value="">-- Choose Standard Route --</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.routeName} ({route.routeCode}) • {route.shiftType}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.selectedRouteId && (
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
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="">-- Choose Pickup Stop Along Route --</option>
                        {selectedRouteStops.map((stop: any) => (
                          <option key={stop.id} value={stop.id}>
                            Stop #{stop.stopOrder}: {stop.stopName} (Est: {stop.estimatedTime || "N/A"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* WEEKDAY CHECKLIST SELECTORS */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                        Active Weekdays
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, activeDays: [1, 2, 3, 4, 5] }))
                        }
                        className="text-3xs font-extrabold text-blue-700 hover:underline"
                      >
                        Select Mon–Fri
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {WEEKDAYS.map((day) => {
                        const isSelected = form.activeDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleWeekdayToggle(day.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              isSelected
                                ? "bg-blue-700 text-white shadow-sm"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                /* SINGLE RIDE CONFIG */
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                        Booking Date
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDateShortcut(0)}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-3xs font-bold text-slate-700"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setDateShortcut(1)}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-3xs font-bold text-slate-700"
                        >
                          Tomorrow
                        </button>
                      </div>
                    </div>
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
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
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
                      placeholder="e.g. Garden West, Saddar, Gulshan Block 4..."
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Pickup Address / Landmark Detail
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
                      placeholder="Specify gate number, near supermarket, corner stop..."
                      className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Remarks / Notes (Optional)
                    </label>
                    <input
                      value={form.remarks}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        }))
                      }
                      placeholder="Special instructions for driver..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* SHIFT TYPE SELECTOR PILLS */}
              <div>
                <label className="mb-1.5 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Shift
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {shiftTypes.map((shift) => (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, shiftType: shift }))}
                      className={`py-2 rounded-xl text-3xs font-extrabold uppercase tracking-wider transition ${
                        form.shiftType === shift
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {shift}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA BUTTON */}
              <Button className="w-full py-3.5 text-xs font-black shadow-md mt-2" disabled={isSubmitting}>
                <Send size={15} className="mr-2" />
                {isSubmitting
                  ? "Saving configuration..."
                  : form.isRecurring
                  ? "Activate Standing Commute Pass"
                  : "Confirm Shuttle Booking"}
              </Button>
            </form>
          </Card>

          {/* RIGHT: INTERACTIVE ROUTE & PICKUP MAP STUDIO */}
          <Card className="p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {form.isRecurring ? "Route Stops & Waypoint Map" : "Pin Pickup Location"}
                    </h3>
                    <p className="text-3xs text-slate-400 font-semibold">
                      {form.isRecurring
                        ? "Sequenced stop layout. Blue pin indicates your pickup stop."
                        : "Tap 'Locate Me' or drag pin. Nearest route is automatically matched."}
                    </p>
                  </div>
                </div>

                {!form.isRecurring && (
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-3xs font-extrabold text-blue-700">
                    GPS Smart Pin
                  </span>
                )}
              </div>

              {/* MAP COMPONENT */}
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                {form.isRecurring ? (
                  <MapView
                    latitude={recurringMapCenter.lat}
                    longitude={recurringMapCenter.lng}
                    readOnly={true}
                    markers={recurringMapMarkers}
                    polylines={recurringPolylines}
                    polylineColor="#2563eb"
                    polylineWeight={4}
                    height="380px"
                    enableFullscreenToggle={true}
                  />
                ) : (
                  <MapView
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onChange={handleMapChange}
                    enableLayerSwitcher={false}
                    onAddressChange={(address) =>
                      setForm((prev) => ({
                        ...prev,
                        pickupArea: address,
                        pickupAddress: prev.pickupAddress || address,
                      }))
                    }
                    markers={stopMarkers}
                    height="380px"
                    enableGPS={true}
                    enableSearch={true}
                    enablePresets={true}
                    enableFullscreenToggle={true}
                  />
                )}
              </div>
            </div>

            {/* LOCATION SUMMARY FOOTER */}
            <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider">
                  {form.isRecurring ? "Selected Pickup Stop" : "Target Pickup Coordinates"}
                </p>
                <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                  {form.isRecurring
                    ? selectedRouteStops.find((s: any) => s.id === form.selectedStopId)?.stopName || "None selected yet"
                    : form.pickupArea || `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-emerald-600 font-bold text-3xs">
                <CheckCircle2 size={13} />
                <span>Synchronized</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 5. TAB 2: MY RIDES & TICKETS */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* STATS RIBBON */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5">
              <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider">Total Bookings</p>
              <p className="mt-1 text-xl font-black text-slate-800">{summary.total}</p>
            </Card>
            <Card className="p-3.5">
              <p className="text-3xs text-blue-600 font-bold uppercase tracking-wider">Assigned</p>
              <p className="mt-1 text-xl font-black text-blue-700">{summary.assigned}</p>
            </Card>
            <Card className="p-3.5">
              <p className="text-3xs text-amber-600 font-bold uppercase tracking-wider">Pending</p>
              <p className="mt-1 text-xl font-black text-amber-700">{summary.pending}</p>
            </Card>
            <Card className="p-3.5">
              <p className="text-3xs text-emerald-600 font-bold uppercase tracking-wider">Completed</p>
              <p className="mt-1 text-xl font-black text-emerald-700">{summary.completed}</p>
            </Card>
          </div>

          <Card className="p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            {/* SEARCH, STATUS FILTER, AND VIEW TOGGLE */}
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Commute Booking Ledger</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {filteredBookings.length} rides logged in your employee commute history
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by area, route, seat..."
                    className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-600"
                  />
                </div>

                {/* Filter Chips */}
                <div className="flex overflow-x-auto gap-1 py-0.5 no-scrollbar shrink-0">
                  {["ALL", "ASSIGNED", "PENDING", "COMPLETED"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold uppercase tracking-wider transition ${
                        statusFilter === st
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Desktop View Mode Switcher */}
                <div className="hidden sm:flex rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setHistoryViewMode("cards")}
                    className={`p-1.5 rounded-lg transition ${
                      historyViewMode === "cards" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-400"
                    }`}
                    title="Cards Ticket View"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryViewMode("table")}
                    className={`p-1.5 rounded-lg transition ${
                      historyViewMode === "table" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-400"
                    }`}
                    title="Spreadsheet Table View"
                  >
                    <TableIcon size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* 5A. DIGITAL BOARDING TICKET CARDS VIEW (DEFAULT ON MOBILE & CARDS MODE) */}
            {historyViewMode === "cards" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full rounded-2xl bg-slate-50 p-10 text-center text-xs font-semibold text-slate-400">
                    Fetching your commute ledger...
                  </div>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between gap-4"
                    >
                      {/* Ticket Header */}
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-1.5">
                            <BusFront size={16} className="text-blue-700" />
                            <span className="font-extrabold text-slate-900 text-xs">
                              {booking.route?.routeName || "Shuttle Booking"}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-3xs font-extrabold uppercase ${getStatusBadge(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        {/* Ticket Body */}
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1 text-slate-400 text-3xs font-semibold uppercase">
                              <CalendarDays size={13} /> Date & Shift
                            </span>
                            <span className="font-bold text-slate-800">
                              {formatDate(booking.bookingDate)} ({booking.shiftType})
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2 text-slate-600">
                            <span className="flex items-center gap-1 text-slate-400 text-3xs font-semibold uppercase shrink-0">
                              <MapPin size={13} /> Pickup Stop
                            </span>
                            <span className="font-bold text-slate-800 text-right truncate">
                              {booking.pickupStop?.stopName || booking.pickupArea}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1 text-slate-400 text-3xs font-semibold uppercase">
                              <TicketCheck size={13} /> Seat Assignment
                            </span>
                            <span className="font-extrabold text-blue-700">
                              {booking.seatNumber ? `Seat #${booking.seatNumber}` : "Pending Seat"}
                            </span>
                          </div>

                          {booking.route?.vehicle && (
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="text-slate-400 text-3xs font-semibold uppercase">Vehicle Plate</span>
                              <span className="font-bold text-slate-800">
                                {booking.route.vehicle.vehicleNumber} ({booking.route.vehicle.vehicleType})
                              </span>
                            </div>
                          )}

                          {booking.remarks && booking.remarks.includes("Auto-generated") && (
                            <div className="rounded-lg bg-blue-50/80 px-2 py-1 text-3xs font-extrabold text-blue-700 flex items-center gap-1">
                              <Repeat size={11} /> Auto-generated pass ride
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ticket Action Footer */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                        {booking.route && (
                          <button
                            type="button"
                            onClick={() => setTrackingBooking(booking)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <Activity size={14} className="animate-pulse" />
                            <span>Live Transit Radar</span>
                          </button>
                        )}

                        {(booking.status === "PENDING" || booking.status === "ASSIGNED") && (
                          <button
                            type="button"
                            disabled={processingId === booking.id}
                            onClick={() => handleCancel(booking)}
                            className="w-full py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <XCircle size={14} />
                            <span>{processingId === booking.id ? "Skipping..." : "Skip Ride"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl bg-slate-50 p-10 text-center text-xs text-slate-400">
                    No shuttle bookings match current search criteria.
                  </div>
                )}
              </div>
            ) : (
              /* 5B. FORMATTED SPREADSHEET TABLE VIEW (DESKTOP ONLY) */
              <div className="hidden sm:block w-full overflow-x-auto">
                <table className="w-full min-w-[850px] border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2">Date / Shift</th>
                      <th className="px-4 py-2">Pickup Stop</th>
                      <th className="px-4 py-2">Route</th>
                      <th className="px-4 py-2">Seat</th>
                      <th className="px-4 py-2">Vehicle</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="bg-slate-50">
                        <td className="rounded-l-xl px-4 py-3">
                          <p className="text-xs font-bold text-slate-800">{formatDate(booking.bookingDate)}</p>
                          <p className="text-3xs text-slate-400 font-semibold">{booking.shiftType}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-slate-700">
                            {booking.pickupStop?.stopName || booking.pickupArea}
                          </p>
                          <p className="text-3xs text-slate-400 truncate max-w-44">{booking.pickupAddress ?? "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-slate-700">
                            {booking.route?.routeName || "Pending"}
                          </p>
                          <p className="text-3xs text-slate-400">{booking.route?.routeCode ?? "-"}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-blue-700">
                          {booking.seatNumber ? `#${booking.seatNumber}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {booking.route?.vehicle?.vehicleNumber ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-3xs font-extrabold uppercase ${getStatusBadge(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="rounded-r-xl px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {booking.route && (
                              <button
                                type="button"
                                onClick={() => setTrackingBooking(booking)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-3xs flex items-center gap-1 shadow-2xs hover:bg-emerald-500"
                              >
                                <Activity size={12} />
                                Radar
                              </button>
                            )}
                            {(booking.status === "PENDING" || booking.status === "ASSIGNED") && (
                              <button
                                type="button"
                                disabled={processingId === booking.id}
                                onClick={() => handleCancel(booking)}
                                className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 bg-red-50 font-bold text-3xs hover:bg-red-100"
                              >
                                Skip
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 6. TAB 3: STANDING COMMUTE PASSES */}
      {activeTab === "passes" && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Repeat size={18} className="text-blue-700" /> Standing Commute Subscriptions
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Active recurring commuter passes with automated daily seat dispatch
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, isRecurring: true }));
                  setActiveTab("book");
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>+ New Pass</span>
              </button>
            </div>

            {subscriptions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {subscriptions.map((sub) => {
                  const daysLabels = sub.activeDays
                    .map((d) => WEEKDAYS.find((wd) => wd.value === d)?.label)
                    .join(", ");

                  return (
                    <div
                      key={sub.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-slate-50 border border-blue-100/60 flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <BusFront className="text-blue-700" size={18} />
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {sub.route?.routeName || "Commute Route"}
                            </h4>
                          </div>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-3xs font-extrabold text-blue-800 uppercase">
                            Active Pass
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-semibold">
                          <div className="flex items-center gap-1">
                            <MapPin size={13} className="text-red-500" />
                            <span>Stop: <strong>{sub.pickupStop?.stopName || "Standard stop"}</strong></span>
                          </div>
                          <div>Shift: <strong>{sub.shiftType}</strong></div>
                          <div>Active Weekdays: <strong>{daysLabels}</strong></div>
                          <p className="text-3xs text-slate-400 font-medium mt-1">
                            Seats are automatically registered daily at 06:00 AM.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        disabled={processingId === sub.id}
                        onClick={() => handleDeactivateSubscription(sub.id)}
                        className="rounded-xl w-full text-xs py-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold"
                      >
                        <Trash2 size={13} className="mr-1.5" />
                        Cancel / Drop Pass
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-10 text-center space-y-3">
                <Repeat size={36} className="mx-auto text-slate-300" />
                <h3 className="font-bold text-slate-800 text-sm">No Active Standing Commute Passes</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Set up a recurring weekly pass once, and your corporate shuttle ride will be automatically booked every morning without manual entry.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, isRecurring: true }));
                    setActiveTab("book");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-700 text-white font-black text-xs shadow-md inline-flex items-center gap-2 mt-2"
                >
                  <Sparkles size={14} />
                  <span>Configure Your First Commute Pass</span>
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
      {/* Real-time Live Ride Tracker */}
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