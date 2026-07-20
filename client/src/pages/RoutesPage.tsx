import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BusFront,
  Clock3,
  Edit,
  MapPin,
  MapPinned,
  Navigation,
  PlusCircle,
  RefreshCcw,
  Route as RouteIcon,
  Search,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  addSmartStop,
  cancelRoute,
  createRoute,
  deleteSmartStop,
  getRoutes,
  updateRoute,
  updateSmartStop,
  runVRPOptimization,
} from "../api/routes";
import type {
  CreateRouteInput,
  SmartStopInput,
  UpdateRouteInput,
} from "../api/routes";
import { getTransportDropdowns } from "../api/drivers";
import MapView from "../components/ui/MapView";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  Driver,
  RouteStatus,
  ShiftType,
  SmartStop,
  TransportRoute,
  Vehicle,
  Vendor,
} from "../types/transport";

interface RouteFormState {
  routeName: string;
  routeCode: string;
  shiftType: ShiftType;
  routeDate: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  vehicleId: string;
  driverId: string;
  vendorId: string;
  status: RouteStatus;
  notes: string;
}

interface StopFormState {
  stopName: string;
  stopOrder: number;
  latitude: string;
  longitude: string;
  estimatedTime: string;
}

const defaultRouteForm: RouteFormState = {
  routeName: "",
  routeCode: "",
  shiftType: "MORNING",
  routeDate: "",
  startTime: "",
  endTime: "",
  startLocation: "",
  endLocation: "",
  vehicleId: "",
  driverId: "",
  vendorId: "",
  status: "DRAFT",
  notes: "",
};

const defaultStopForm: StopFormState = {
  stopName: "",
  stopOrder: 1,
  latitude: "",
  longitude: "",
  estimatedTime: "",
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

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString();
}

function toDateInputValue(date?: string | null) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().slice(0, 10);
}

function getRouteBadge(status: RouteStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "DRAFT":
      return "bg-amber-50 text-amber-700";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [showVRPModal, setShowVRPModal] = useState(false);
  const [vrpShiftType, setVrpShiftType] = useState<ShiftType>("MORNING");
  const [vrpDate, setVrpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isOptimizingVRP, setIsOptimizingVRP] = useState(false);
  const [vrpMessage, setVrpMessage] = useState<string | null>(null);
  const [vrpError, setVrpError] = useState<string | null>(null);

  async function handleVRPSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsOptimizingVRP(true);
    setVrpMessage(null);
    setVrpError(null);
    try {
      const response = await runVRPOptimization(vrpShiftType, vrpDate);
      setVrpMessage(response?.message || "VRP routes generated successfully.");
      const data = await getRoutes();
      setRoutes(data || []);
      setTimeout(() => {
        setShowVRPModal(false);
        setVrpMessage(null);
      }, 3000);
    } catch (err: any) {
      setVrpError(err.response?.data?.message || err.message || "Failed to run VRP optimization");
    } finally {
      setIsOptimizingVRP(false);
    }
  }

  const [routeForm, setRouteForm] =
    useState<RouteFormState>(defaultRouteForm);

  const [stopForm, setStopForm] =
    useState<StopFormState>(defaultStopForm);

  const [editingRouteId, setEditingRouteId] =
    useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const [editingStopId, setEditingStopId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [shiftFilter, setShiftFilter] = useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [isSavingStop, setIsSavingStop] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  const shiftTypes: ShiftType[] = [
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NIGHT",
    "GENERAL",
  ];

  const routeStatuses: RouteStatus[] = [
    "DRAFT",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ];

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [routeData, dropdownData] = await Promise.all([
        getRoutes(),
        getTransportDropdowns(),
      ]);

      setRoutes(routeData);
      setVehicles(dropdownData.vehicles ?? []);
      setDrivers(dropdownData.drivers ?? []);
      setVendors(dropdownData.vendors ?? []);

      if (
        selectedRouteId &&
        !routeData.some((route) => route.id === selectedRouteId)
      ) {
        setSelectedRouteId(null);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch route information"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedRoute = useMemo(() => {
    return (
      routes.find((route) => route.id === selectedRouteId) ?? null
    );
  }, [routes, selectedRouteId]);

  const filteredRoutes = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return routes.filter((route) => {
      const matchesSearch =
        !keyword ||
        route.routeName.toLowerCase().includes(keyword) ||
        route.routeCode.toLowerCase().includes(keyword) ||
        route.startLocation?.toLowerCase().includes(keyword) ||
        route.endLocation?.toLowerCase().includes(keyword) ||
        route.vehicle?.vehicleNumber
          ?.toLowerCase()
          .includes(keyword) ||
        route.driver?.user?.fullName
          ?.toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        route.status === statusFilter;

      const matchesShift =
        shiftFilter === "ALL" ||
        route.shiftType === shiftFilter;

      return matchesSearch && matchesStatus && matchesShift;
    });
  }, [routes, search, statusFilter, shiftFilter]);

  const summary = useMemo(() => {
    return {
      total: routes.length,
      draft: routes.filter((route) => route.status === "DRAFT").length,
      active: routes.filter((route) => route.status === "ACTIVE").length,
      completed: routes.filter(
        (route) => route.status === "COMPLETED"
      ).length,
    };
  }, [routes]);

  function resetRouteForm() {
    setRouteForm(defaultRouteForm);
    setEditingRouteId(null);
    setError("");
  }

  function resetStopForm() {
    setStopForm(defaultStopForm);
    setEditingStopId(null);
    setError("");
  }

  function handleEditRoute(route: TransportRoute) {
    setEditingRouteId(route.id);
    setSelectedRouteId(route.id);
    setMessage("");
    setError("");

    setRouteForm({
      routeName: route.routeName,
      routeCode: route.routeCode,
      shiftType: route.shiftType,
      routeDate: toDateInputValue(route.routeDate),
      startTime: route.startTime ?? "",
      endTime: route.endTime ?? "",
      startLocation: route.startLocation ?? "",
      endLocation: route.endLocation ?? "",
      vehicleId: route.vehicleId ?? "",
      driverId: route.driverId ?? "",
      vendorId: route.vendorId ?? "",
      status: route.status,
      notes: route.notes ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleEditStop(stop: SmartStop) {
    setEditingStopId(stop.id);
    setMessage("");
    setError("");

    setStopForm({
      stopName: stop.stopName,
      stopOrder: stop.stopOrder,
      latitude:
        stop.latitude !== null && stop.latitude !== undefined
          ? String(stop.latitude)
          : "",
      longitude:
        stop.longitude !== null && stop.longitude !== undefined
          ? String(stop.longitude)
          : "",
      estimatedTime: stop.estimatedTime ?? "",
    });
  }

  function calculateAutoEstimatedTime(
    stopOrder: number,
    lat: number,
    lng: number,
    routeStartTime: string,
    existingStops: any[]
  ): string {
    if (!routeStartTime) return "";

    const timeParts = routeStartTime.split(":");
    let hours = parseInt(timeParts[0], 10) || 8;
    let minutes = parseInt(timeParts[1], 10) || 0;

    if (stopOrder === 1) {
      minutes += 5;
      hours += Math.floor(minutes / 60);
      minutes = minutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    const prevStop = existingStops.find((s) => s.stopOrder === stopOrder - 1);
    if (!prevStop || !prevStop.latitude || !prevStop.longitude || !prevStop.estimatedTime) {
      const offset = (stopOrder - 1) * 15 + 5;
      minutes += offset;
      hours += Math.floor(minutes / 60);
      minutes = minutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    const prevParts = prevStop.estimatedTime.split(":");
    let prevHours = parseInt(prevParts[0], 10);
    let prevMinutes = parseInt(prevParts[1], 10);

    const R = 6371;
    const dLat = ((lat - prevStop.latitude) * Math.PI) / 180;
    const dLon = ((lng - prevStop.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((prevStop.latitude * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const duration = Math.round(distance * 2) + 3;

    prevMinutes += duration;
    prevHours += Math.floor(prevMinutes / 60);
    prevMinutes = prevMinutes % 60;
    prevHours = prevHours % 24;

    return `${String(prevHours).padStart(2, "0")}:${String(prevMinutes).padStart(2, "0")}`;
  }

  async function handleStopMapChange(lat: number, lng: number) {
    const latStr = String(lat);
    const lngStr = String(lng);

    const autoTime = calculateAutoEstimatedTime(
      stopForm.stopOrder,
      lat,
      lng,
      selectedRoute?.startTime || "08:00",
      selectedRoute?.smartStops || []
    );

    setStopForm((prev) => ({
      ...prev,
      latitude: latStr,
      longitude: lngStr,
      estimatedTime: autoTime || prev.estimatedTime,
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
        const road = data.address?.road || "";
        const suburb = data.address?.suburb || data.address?.neighbourhood || "";
        const label = road && suburb ? `${road}, ${suburb}` : road || suburb || data.name || "Stop Landmark";
        
        setStopForm((prev) => ({
          ...prev,
          stopName: label,
        }));
      }
    } catch (err) {
      console.error("Stop reverse geocode failed:", err);
    }
  }

  async function handleRouteSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSavingRoute(true);

    try {
      if (!routeForm.routeName.trim()) {
        throw new Error("Route name is required");
      }

      if (!routeForm.routeCode.trim()) {
        throw new Error("Route code is required");
      }

      const payload: CreateRouteInput = {
        routeName: routeForm.routeName.trim(),
        routeCode: routeForm.routeCode.trim(),
        shiftType: routeForm.shiftType,
      };

      if (routeForm.routeDate) {
        payload.routeDate = routeForm.routeDate;
      }

      if (routeForm.startTime) {
        payload.startTime = routeForm.startTime;
      }

      if (routeForm.endTime) {
        payload.endTime = routeForm.endTime;
      }

      if (routeForm.startLocation.trim()) {
        payload.startLocation = routeForm.startLocation.trim();
      }

      if (routeForm.endLocation.trim()) {
        payload.endLocation = routeForm.endLocation.trim();
      }

      if (routeForm.vehicleId) {
        payload.vehicleId = routeForm.vehicleId;
      }

      if (routeForm.driverId) {
        payload.driverId = routeForm.driverId;
      }

      if (routeForm.vendorId) {
        payload.vendorId = routeForm.vendorId;
      }

      if (routeForm.notes.trim()) {
        payload.notes = routeForm.notes.trim();
      }

      if (editingRouteId) {
        const updatePayload: UpdateRouteInput = {
          ...payload,
          status: routeForm.status,
          vehicleId: routeForm.vehicleId,
          driverId: routeForm.driverId,
          vendorId: routeForm.vendorId,
          notes: routeForm.notes.trim(),
        };

        await updateRoute(editingRouteId, updatePayload);

        setMessage("Route updated successfully");
      } else {
        const createdRoute = await createRoute(payload);

        setSelectedRouteId(createdRoute.id);
        setMessage("Route created successfully");
      }

      resetRouteForm();
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ?? "Failed to save route"
      );
    } finally {
      setIsSavingRoute(false);
    }
  }

  async function handleStopSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedRouteId) {
      setError("Select a route before adding a smart stop");
      return;
    }

    setMessage("");
    setError("");
    setIsSavingStop(true);

    try {
      if (!stopForm.stopName.trim()) {
        throw new Error("Stop name is required");
      }

      if (stopForm.stopOrder < 1) {
        throw new Error("Stop order must be at least 1");
      }

      const payload: SmartStopInput = {
        stopName: stopForm.stopName.trim(),
        stopOrder: Number(stopForm.stopOrder),
      };

      if (stopForm.latitude.trim()) {
        payload.latitude = Number(stopForm.latitude);
      }

      if (stopForm.longitude.trim()) {
        payload.longitude = Number(stopForm.longitude);
      }

      if (stopForm.estimatedTime) {
        payload.estimatedTime = stopForm.estimatedTime;
      }

      if (editingStopId) {
        await updateSmartStop(editingStopId, payload);
        setMessage("Smart stop updated successfully");
      } else {
        await addSmartStop(selectedRouteId, payload);
        setMessage("Smart stop added successfully");
      }

      resetStopForm();
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to save smart stop"
      );
    } finally {
      setIsSavingStop(false);
    }
  }

  async function handleCancelRoute(route: TransportRoute) {
    if (route.status === "CANCELLED") {
      return;
    }

    const confirmed = window.confirm(
      `Cancel route ${route.routeCode}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(route.id);
      setMessage("");
      setError("");

      await cancelRoute(route.id);

      setMessage(`Route ${route.routeCode} cancelled successfully`);

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to cancel route"
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteStop(stop: SmartStop) {
    const confirmed = window.confirm(
      `Delete smart stop ${stop.stopName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(stop.id);
      setMessage("");
      setError("");

      await deleteSmartStop(stop.id);

      setMessage("Smart stop deleted successfully");

      if (editingStopId === stop.id) {
        resetStopForm();
      }

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to delete smart stop"
      );
    } finally {
      setProcessingId(null);
    }
  }

  const stopMapLat = stopForm.latitude ? parseFloat(stopForm.latitude) : 24.8607;
  const stopMapLng = stopForm.longitude ? parseFloat(stopForm.longitude) : 67.0104;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Transport Administration
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Routes and Smart Stops
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Create routes, assign drivers and vehicles, and maintain
            ordered pickup stops.
          </p>
        </div>

        <Button variant="secondary" onClick={loadData}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

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

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Routes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <RouteIcon size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Draft</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.draft}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Edit size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.active}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Navigation size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.completed}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <MapPinned size={22} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <PlusCircle size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingRouteId ? "Edit Route" : "Create Route"}
              </h2>

              <p className="text-sm text-slate-500">
                Configure schedule and assignments.
              </p>
            </div>
          </div>

          <form onSubmit={handleRouteSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Route Name
              </label>

              <input
                value={routeForm.routeName}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    routeName: event.target.value,
                  })
                }
                placeholder="Garden West to Korangi"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Route Code
                </label>

                <input
                  value={routeForm.routeCode}
                  onChange={(event) =>
                    setRouteForm({
                      ...routeForm,
                      routeCode: event.target.value,
                    })
                  }
                  placeholder="GW-KOR-001"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Shift
                </label>

                <select
                  value={routeForm.shiftType}
                  onChange={(event) =>
                    setRouteForm({
                      ...routeForm,
                      shiftType: event.target.value as ShiftType,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  {shiftTypes.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Route Date
              </label>

              <input
                type="date"
                value={routeForm.routeDate}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    routeDate: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Start Time
                </label>

                <input
                  type="time"
                  value={routeForm.startTime}
                  onChange={(event) =>
                    setRouteForm({
                      ...routeForm,
                      startTime: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  End Time
                </label>

                <input
                  type="time"
                  value={routeForm.endTime}
                  onChange={(event) =>
                    setRouteForm({
                      ...routeForm,
                      endTime: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start Location
              </label>

              <input
                value={routeForm.startLocation}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    startLocation: event.target.value,
                  })
                }
                placeholder="Garden West"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                End Location
              </label>

              <input
                value={routeForm.endLocation}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    endLocation: event.target.value,
                  })
                }
                placeholder="Korangi Campus"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vehicle
              </label>

              <select
                value={routeForm.vehicleId}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    vehicleId: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">No vehicle assigned</option>

                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber} — {vehicle.vehicleType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Driver
              </label>

              <select
                value={routeForm.driverId}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    driverId: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">No driver assigned</option>

                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.user.fullName} — {driver.licenseNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vendor
              </label>

              <select
                value={routeForm.vendorId}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    vendorId: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Internal fleet</option>

                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            </div>

            {editingRouteId && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Route Status
                </label>

                <select
                  value={routeForm.status}
                  onChange={(event) =>
                    setRouteForm({
                      ...routeForm,
                      status: event.target.value as RouteStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  {routeStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                rows={4}
                value={routeForm.notes}
                onChange={(event) =>
                  setRouteForm({
                    ...routeForm,
                    notes: event.target.value,
                  })
                }
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" disabled={isSavingRoute}>
                {isSavingRoute
                  ? "Saving..."
                  : editingRouteId
                    ? "Update Route"
                    : "Create Route"}
              </Button>

              {editingRouteId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetRouteForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div className="flex items-start justify-between w-full xl:w-auto">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Transport Routes
                </h2>
                <p className="text-sm text-slate-500">
                  {filteredRoutes.length} routes found
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setShowVRPModal(true)}
                className="bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md border-0 shrink-0 ml-4 py-2"
              >
                <Navigation size={13} className="mr-1.5 animate-pulse" />
                VRP Dispatch Optimizer
              </Button>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search routes..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 xl:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">All statuses</option>

                {routeStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={shiftFilter}
                onChange={(event) =>
                  setShiftFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">All shifts</option>

                {shiftTypes.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              Loading routes...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1050px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Route</th>
                    <th className="px-4 py-2">Schedule</th>
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Driver</th>
                    <th className="px-4 py-2">Stops</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors ${
                        selectedRouteId === route.id
                          ? "outline outline-2 outline-blue-200"
                          : ""
                      }`}
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {route.routeName}
                        </p>

                        <p className="text-sm text-slate-500">
                          {route.routeCode}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {route.startLocation ?? "-"} →{" "}
                          {route.endLocation ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {route.shiftType}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatDate(route.routeDate)}
                        </p>

                        <p className="text-xs text-slate-400">
                          {route.startTime ?? "-"} –{" "}
                          {route.endTime ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {route.vehicle ? (
                          <div className="flex items-start gap-2">
                            <BusFront
                              size={16}
                              className="mt-0.5 text-slate-400"
                            />

                            <div>
                              <p className="text-sm font-semibold text-slate-700">
                                {route.vehicle.vehicleNumber}
                              </p>

                              <p className="text-xs text-slate-500">
                                {route.vehicle.vehicleType}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not assigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {route.driver ? (
                          <div className="flex items-start gap-2">
                            <UserRound
                              size={16}
                              className="mt-0.5 text-slate-400"
                            />

                            <div>
                              <p className="text-sm font-semibold text-slate-700">
                                {route.driver.user.fullName}
                              </p>

                              <p className="text-xs text-slate-500">
                                {route.driver.licenseNumber}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not assigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRouteId(route.id)
                          }
                          className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700"
                        >
                          {route.smartStops?.length ?? 0} stops
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getRouteBadge(
                            route.status
                          )}`}
                        >
                          {route.status}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setSelectedRouteId(route.id);
                              handleEditRoute(route);
                            }}
                          >
                            <Edit size={15} className="mr-2" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            disabled={
                              route.status === "CANCELLED" ||
                              processingId === route.id
                            }
                            onClick={() => handleCancelRoute(route)}
                          >
                            <XCircle size={15} className="mr-2" />

                            {processingId === route.id
                              ? "Processing..."
                              : route.status === "CANCELLED"
                                ? "Cancelled"
                                : "Cancel"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredRoutes.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No routes matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card className="min-w-0">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
            Smart Stop Management
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            {selectedRoute
              ? selectedRoute.routeName
              : "Select a route"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedRoute
              ? "Add and maintain pickup stops in the correct order."
              : "Select a route from the table to manage its stops."}
          </p>
        </div>

        {selectedRoute ? (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <form
              onSubmit={handleStopSubmit}
              className="space-y-4 rounded-2xl bg-slate-50 p-4"
            >
              <div>
                <h3 className="font-bold text-slate-900">
                  {editingStopId ? "Edit Smart Stop" : "Add Smart Stop"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Route: {selectedRoute.routeCode}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Pin Stop Location on Map
                </label>
                <MapView
                  latitude={stopMapLat}
                  longitude={stopMapLng}
                  onChange={handleStopMapChange}
                  markers={(selectedRoute.smartStops ?? []).map((s: any) => ({
                    latitude: s.latitude,
                    longitude: s.longitude,
                    label: `Stop ${s.stopOrder}: ${s.stopName}`,
                  }))}
                  polylines={(selectedRoute.smartStops ?? [])
                    .slice()
                    .sort((a, b) => a.stopOrder - b.stopOrder)
                    .map((s: any) => ({ latitude: s.latitude, longitude: s.longitude }))}
                  height="220px"
                />
                <p className="text-4xs text-slate-400 font-semibold mt-1">
                  Drag the pin to place a stop. Blue line visualizes the route path.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Stop Name
                </label>

                <input
                  value={stopForm.stopName}
                  onChange={(event) =>
                    setStopForm({
                      ...stopForm,
                      stopName: event.target.value,
                    })
                  }
                  placeholder="Garden West Stop"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Stop Order
                </label>

                <input
                  type="number"
                  min={1}
                  value={stopForm.stopOrder}
                  onChange={(event) =>
                    setStopForm({
                      ...stopForm,
                      stopOrder: Number(event.target.value),
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Latitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    value={stopForm.latitude}
                    onChange={(event) =>
                      setStopForm({
                        ...stopForm,
                        latitude: event.target.value,
                      })
                    }
                    placeholder="24.8765"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Longitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    value={stopForm.longitude}
                    onChange={(event) =>
                      setStopForm({
                        ...stopForm,
                        longitude: event.target.value,
                      })
                    }
                    placeholder="67.0321"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Estimated Time
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const latVal = parseFloat(stopForm.latitude);
                      const lngVal = parseFloat(stopForm.longitude);
                      if (!isNaN(latVal) && !isNaN(lngVal)) {
                        const computed = calculateAutoEstimatedTime(
                          stopForm.stopOrder,
                          latVal,
                          lngVal,
                          selectedRoute?.startTime || "08:00",
                          selectedRoute?.smartStops || []
                        );
                        if (computed) {
                          setStopForm((prev) => ({ ...prev, estimatedTime: computed }));
                        }
                      } else {
                        alert("Specify latitude & longitude to calculate estimated arrival time.");
                      }
                    }}
                    className="text-2xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    Auto-Calculate
                  </button>
                </div>

                <input
                  type="time"
                  value={stopForm.estimatedTime}
                  onChange={(event) =>
                    setStopForm({
                      ...stopForm,
                      estimatedTime: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  disabled={isSavingStop}
                >
                  {isSavingStop
                    ? "Saving..."
                    : editingStopId
                      ? "Update Stop"
                      : "Add Stop"}
                </Button>

                {editingStopId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetStopForm}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>

            <div className="min-w-0">
              <div className="w-full min-w-0 overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2">Order</th>
                      <th className="px-4 py-2">Stop</th>
                      <th className="px-4 py-2">Coordinates</th>
                      <th className="px-4 py-2">Estimated Time</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...(selectedRoute.smartStops ?? [])]
                      .sort(
                        (first, second) =>
                          first.stopOrder - second.stopOrder
                      )
                      .map((stop) => (
                        <tr key={stop.id} className="bg-slate-50">
                          <td className="rounded-l-2xl px-4 py-4">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                              {stop.stopOrder}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-start gap-2">
                              <MapPin
                                size={17}
                                className="mt-0.5 text-red-500"
                              />

                              <p className="font-semibold text-slate-800">
                                {stop.stopName}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {stop.latitude !== null &&
                            stop.latitude !== undefined &&
                            stop.longitude !== null &&
                            stop.longitude !== undefined
                              ? `${stop.latitude}, ${stop.longitude}`
                              : "-"}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock3 size={16} />
                              {stop.estimatedTime ?? "-"}
                            </div>
                          </td>

                          <td className="rounded-r-2xl px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleEditStop(stop)}
                              >
                                <Edit size={15} className="mr-2" />
                                Edit
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                disabled={processingId === stop.id}
                                onClick={() => handleDeleteStop(stop)}
                              >
                                <Trash2 size={15} className="mr-2" />

                                {processingId === stop.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {(selectedRoute.smartStops ?? []).length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                        >
                          No smart stops have been added to this route.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center">
            <MapPinned
              size={40}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Select a route to manage its smart stops.
            </p>
          </div>
        )}
      </Card>

      {/* VRP Optimization Wizard Modal */}
      {showVRPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Navigation size={18} className="text-blue-700 animate-pulse" />
                  VRP Dispatch Optimizer
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Solve Capacitated Vehicle Routing problem automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVRPModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            {vrpMessage && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs font-semibold text-emerald-800">
                {vrpMessage}
              </div>
            )}

            {vrpError && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-800">
                {vrpError}
              </div>
            )}

            <form onSubmit={handleVRPSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Target Commute Date
                </label>
                <input
                  type="date"
                  value={vrpDate}
                  onChange={(e) => setVrpDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Select Shift
                </label>
                <select
                  value={vrpShiftType}
                  onChange={(e) => setVrpShiftType(e.target.value as ShiftType)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  {shiftTypes.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/50 p-3 text-3xs text-slate-500 font-medium space-y-1">
                <p className="font-extrabold text-slate-700 uppercase">Solver parameters:</p>
                <p>• Starting Node: Company Head Office Depot</p>
                <p>• Heuristic algorithm: Nearest Neighbor CVRP solver</p>
                <p>• Fleet limit: Evaluates all ACTIVE vehicles & drivers</p>
                <p>• Transit speed: 30 km/h with 3-minute passenger boarding buffers</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVRPModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isOptimizingVRP}
                  className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold"
                >
                  {isOptimizingVRP ? "Optimizing..." : "Execute Solver"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}