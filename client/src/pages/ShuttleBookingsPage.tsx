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
import { getTelemetryByRoute } from "../api/telemetry";
import MapView from "../components/ui/MapView";
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

  const [trackingRouteId, setTrackingRouteId] = useState<string | null>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);
  const [trackingRoute, setTrackingRoute] = useState<any | null>(null);

  useEffect(() => {
    if (!trackingRouteId) {
      setTrackingLogs([]);
      return;
    }

    async function fetchTelemetry() {
      try {
        const logs = await getTelemetryByRoute(trackingRouteId!);
        setTrackingLogs(logs || []);
      } catch (err) {
        console.error("Failed to fetch live route telemetry:", err);
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, [trackingRouteId]);

  const trackingMarkers = useMemo(() => {
    const list: any[] = [];
    if (!trackingRoute) return list;

    if (trackingRoute.smartStops) {
      trackingRoute.smartStops.forEach((stop: any) => {
        list.push({
          latitude: stop.latitude,
          longitude: stop.longitude,
          label: `${stop.stopName} (Order: ${stop.stopOrder}, Arrival: ${stop.estimatedTime || "N/A"})`,
          color: "bg-emerald-500",
        });
      });
    }

    if (trackingLogs.length > 0) {
      const latest = trackingLogs[trackingLogs.length - 1];
      list.push({
        latitude: latest.latitude,
        longitude: latest.longitude,
        label: `Live Shuttle - Speed: ${latest.speed || 0} km/h, Battery: ${latest.batteryLevel || 100}%`,
        color: "bg-amber-500 animate-pulse",
        pulse: true,
      });
    }

    return list;
  }, [trackingRoute, trackingLogs]);

  const trackingPolylines = useMemo(() => {
    if (!trackingRoute || !trackingRoute.smartStops) return [];
    return [...trackingRoute.smartStops].sort((a, b) => a.stopOrder - b.stopOrder);
  }, [trackingRoute]);

  const trackingCenter = useMemo(() => {
    if (trackingLogs.length > 0) {
      const latest = trackingLogs[trackingLogs.length - 1];
      return { lat: latest.latitude, lng: latest.longitude };
    }
    if (trackingRoute?.smartStops && trackingRoute.smartStops.length > 0) {
      const firstStop = [...trackingRoute.smartStops].sort((a, b) => a.stopOrder - b.stopOrder)[0];
      return { lat: firstStop.latitude, lng: firstStop.longitude };
    }
    return { lat: 24.8607, lng: 67.0104 };
  }, [trackingRoute, trackingLogs]);

  const shiftTypes = (bootstrap?.formOptions?.shiftTypes ?? [
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NIGHT",
    "GENERAL",
  ]) as ShiftType[];

  const bookingStatuses = (bootstrap?.formOptions?.shuttleBookingStatuses ?? [
    "PENDING",
    "ASSIGNED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
  ]) as ShuttleBookingStatus[];

  async function loadData() {
    if (currentRole && currentRole !== "EMPLOYEE") {
      setIsLoading(false);
      return;
    }
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

  if (currentRole && currentRole !== "EMPLOYEE") {
    return (
      <div className="min-w-0 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Shuttle Management
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Shuttle Bookings
          </h1>
        </div>
        <Card>
          <div className="py-10 text-center">
            <BusFront size={44} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Employee booking view
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              This screen is designed for employee shuttle bookings.
            </p>
          </div>
        </Card>
      </div>
    );
  }

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
        <Button variant="secondary" onClick={loadData}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh Registry
        </Button>
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

      {/* Summary Cards */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Rides booked</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{summary.total}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <TicketCheck size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{summary.pending}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Clock3 size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{summary.assigned}</p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <UserCheck size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active passes</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{subscriptions.length} active</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Repeat size={22} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Request Forms */}
        <div className="space-y-6">
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
                    <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Select Pickup Location Pin
                    </label>
                    <MapView
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onChange={handleMapChange}
                      markers={stopMarkers}
                      height="240px"
                    />
                    <p className="text-4xs text-slate-400 font-semibold mt-1">
                      Drag pin or click map to locate your pickup point. Emerald dots show active shuttle stops.
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
        <div className="lg:col-span-2 space-y-6">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search history..."
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600 xl:w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 bg-white"
                >
                  <option value="ALL">All statuses</option>
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
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
                            {booking.status === "ASSIGNED" && booking.routeId && (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setTrackingRoute(booking.route);
                                  setTrackingRouteId(booking.routeId || null);
                                }}
                                className="border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50"
                              >
                                <Activity size={15} className="mr-1.5" />
                                Track Live
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
      {/* Real-time Shuttle Tracking Modal */}
      {trackingRouteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Shuttle Tracking
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Route: <strong className="text-slate-800">{trackingRoute?.routeName || "N/A"}</strong> ({trackingRoute?.routeCode || "N/A"}) 
                  • Driver: <strong className="text-slate-800">{trackingRoute?.driver?.user?.fullName || "N/A"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTrackingRouteId(null);
                  setTrackingRoute(null);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <MapView
                latitude={trackingCenter.lat}
                longitude={trackingCenter.lng}
                readOnly={true}
                markers={trackingMarkers}
                polylines={trackingPolylines}
                height="400px"
              />
              <p className="text-4xs text-slate-400 font-bold text-center uppercase tracking-wider">
                Shuttle coordinates auto-refresh every 5 seconds. Yellow marker indicates live shuttle position.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setTrackingRouteId(null);
                  setTrackingRoute(null);
                }}
              >
                Close Tracking console
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}