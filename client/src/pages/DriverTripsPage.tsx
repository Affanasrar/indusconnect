import { useEffect, useMemo, useState, useRef } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Clock3,
  Flag,
  MapPin,
  Navigation,
  PlayCircle,
  RefreshCcw,
  Route as RouteIcon,
  ShieldAlert,
  SquareCheckBig,
  UserCheck,
  UserX,
  UsersRound,
  ExternalLink,
  Sparkles,
  Eye,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  endDriverTrip,
  getDriverRouteManifest,
  getMyAssignedDriverRoutes,
  markPassengerBoarded,
  markPassengerNoShow,
  reportDriverTripIssue,
  startDriverTrip,
  submitDriverSafetyChecklist,
} from "../api/driverTrips";
import { createTelemetryLog } from "../api/telemetry";
import MapView from "../components/ui/MapView";
import MobileCard from "../components/ui/MobileCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../auth/AuthContext";
import type {
  AssignedDriverRoute,
  DriverRouteManifest,
  ReportTripIssueInput,
  SafetyChecklistInput,
  TripIssueType,
  TripStatus,
} from "../types/driverTrip";
import type { ShuttleBooking } from "../types/shuttle";

interface ChecklistFormState {
  fuelChecked: boolean;
  tiresChecked: boolean;
  brakesChecked: boolean;
  lightsChecked: boolean;
}

interface IssueFormState {
  issueType: TripIssueType;
  issueDescription: string;
  issueLatitude: string;
  issueLongitude: string;
}

const defaultChecklist: ChecklistFormState = {
  fuelChecked: false,
  tiresChecked: false,
  brakesChecked: false,
  lightsChecked: false,
};

const defaultIssueForm: IssueFormState = {
  issueType: "DELAY",
  issueDescription: "",
  issueLatitude: "",
  issueLongitude: "",
};
// Haversine formula in km
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bearing in degrees (0 - 360)
function calculateHeading(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const brng = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return Math.round(brng);
}

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

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString();
}

function getTripStatusBadge(status?: TripStatus) {
  switch (status) {
    case "CHECKLIST_PENDING":
      return "bg-amber-50 text-amber-700";

    case "READY":
      return "bg-blue-50 text-blue-700";

    case "IN_PROGRESS":
      return "bg-violet-50 text-violet-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPassengerStatusBadge(status: string) {
  switch (status) {
    case "ASSIGNED":
      return "bg-blue-50 text-blue-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "NO_SHOW":
      return "bg-slate-200 text-slate-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function getPassengerMobileBadgeVariant(
  status: string
): "info" | "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "ASSIGNED":
      return "info";
    case "COMPLETED":
      return "success";
    case "NO_SHOW":
      return "neutral";
    case "CANCELLED":
      return "error";
    default:
      return "warning";
  }
}

function normalizeManifest(
  manifest: DriverRouteManifest,
  fallbackRoute: AssignedDriverRoute
): DriverRouteManifest {
  return {
    route: manifest.route ?? fallbackRoute,
    vehicle:
      manifest.vehicle ??
      manifest.route?.vehicle ??
      fallbackRoute.vehicle ??
      null,
    driver:
      manifest.driver ??
      manifest.route?.driver ??
      fallbackRoute.driver ??
      null,
    smartStops:
      manifest.smartStops ??
      manifest.route?.smartStops ??
      fallbackRoute.smartStops ??
      [],
    bookings: manifest.bookings ?? [],
    trip:
      manifest.trip ??
      fallbackRoute.trips?.[0] ??
      null,
  };
}

export default function DriverTripsPage() {
  const { bootstrap } = useAuth();
  const currentRole = bootstrap?.role;

  if (currentRole === "EMPLOYEE") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800">Forbidden</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm font-medium">
          You do not have permission to access driver operations. This resource is restricted to drivers and transport administrators.
        </p>
      </div>
    );
  }

  const [routes, setRoutes] = useState<AssignedDriverRoute[]>([]);
  const [manifest, setManifest] = useState<DriverRouteManifest | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistFormState>(defaultChecklist);
  const [issueForm, setIssueForm] = useState<IssueFormState>(defaultIssueForm);

  const [driverTab, setDriverTab] = useState<"nav" | "manifest" | "checklist" | "issue" | "stops">("nav");
  const [manifestSearch, setManifestSearch] = useState("");
  const [manifestFilter, setManifestFilter] = useState<"ALL" | "AWAITING" | "BOARDED" | "NO_SHOW">("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const selectedRoute = useMemo(() => {
    return (
      routes.find((route) => route.id === selectedRouteId) ??
      null
    );
  }, [routes, selectedRouteId]);

  const trip = manifest?.trip ?? null;

  // Driver location telemetry states & handlers
  const [driverLat, setDriverLat] = useState(24.8607);
  const [driverLng, setDriverLng] = useState(67.0104);
  const [driverHeading, setDriverHeading] = useState(0);
  const [driverSpeed, setDriverSpeed] = useState(0);
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [isFollowLocked, setIsFollowLocked] = useState(true);
  const prevCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Sorted route stops in sequence
  const orderedStops = useMemo(() => {
    return [...(manifest?.smartStops ?? [])].sort(
      (a: any, b: any) => a.stopOrder - b.stopOrder
    );
  }, [manifest?.smartStops]);

  // Current target waypoint stop
  const nextStop = useMemo(() => {
    if (orderedStops.length === 0) return null;
    return orderedStops[Math.min(currentStopIndex, orderedStops.length - 1)];
  }, [orderedStops, currentStopIndex]);

  // Passengers waiting at next stop
  const passengersAtNextStop = useMemo(() => {
    if (!nextStop) return [];
    return (manifest?.bookings ?? []).filter(
      (b: any) => b.pickupStopId === nextStop.id && b.status === "ASSIGNED"
    );
  }, [manifest?.bookings, nextStop]);

  // Distance and ETA to next stop
  const nextStopDistanceKm = useMemo(() => {
    if (!nextStop || !nextStop.latitude || !nextStop.longitude) return 0;
    const dist = calculateDistanceKm(
      driverLat,
      driverLng,
      nextStop.latitude,
      nextStop.longitude
    );
    return parseFloat(dist.toFixed(2));
  }, [driverLat, driverLng, nextStop]);

  const nextStopEtaMins = useMemo(() => {
    const speed = Math.max(driverSpeed, 25);
    return Math.max(1, Math.round((nextStopDistanceKm / speed) * 60));
  }, [nextStopDistanceKm, driverSpeed]);

  async function syncDriverCoordinates(
    lat: number,
    lng: number,
    heading = driverHeading,
    speed = driverSpeed
  ) {
    if (!selectedRouteId || !trip?.id) return;
    try {
      setIsSyncingTelemetry(true);
      await createTelemetryLog({
        routeId: selectedRouteId,
        transportTripId: trip.id,
        latitude: lat,
        longitude: lng,
        heading,
        speed,
        status: "MOVING",
        source: "MOBILE_GPS",
      });
      setSyncedCount((prev) => prev + 1);
    } catch (err) {
      console.error("Telemetry sync error:", err);
    } finally {
      setIsSyncingTelemetry(false);
    }
  }

  // Real-time GPS watchPosition broadcasting
  useEffect(() => {
    if (trip?.status !== "IN_PROGRESS" || isSimulatingDrive) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed
          ? Math.round(position.coords.speed * 3.6)
          : 30;
        let heading = position.coords.heading ?? 0;

        if ((!heading || isNaN(heading)) && prevCoordsRef.current) {
          heading = calculateHeading(
            prevCoordsRef.current.lat,
            prevCoordsRef.current.lng,
            lat,
            lng
          );
        }
        prevCoordsRef.current = { lat, lng };

        setDriverLat(lat);
        setDriverLng(lng);
        setDriverHeading(heading || 0);
        setDriverSpeed(speed);
        syncDriverCoordinates(lat, lng, heading || 0, speed);
      },
      (err) => {
        console.warn("Device GPS unavailable:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [trip?.status, selectedRouteId, trip?.id, isSimulatingDrive, driverHeading, driverSpeed]);

  // Simulated drive along route waypoints
  useEffect(() => {
    if (!isSimulatingDrive || orderedStops.length === 0) return;

    const validCoords: Array<{ latitude: number; longitude: number }> = [];
    orderedStops.forEach((s: any) => {
      if (typeof s.latitude === "number" && typeof s.longitude === "number") {
        validCoords.push({ latitude: s.latitude, longitude: s.longitude });
      }
    });
    if (validCoords.length === 0) return;

    let step = currentStopIndex;
    const interval = setInterval(() => {
      const fromCoord = validCoords[step % validCoords.length];
      const toCoord = validCoords[(step + 1) % validCoords.length];
      const heading = calculateHeading(
        fromCoord.latitude,
        fromCoord.longitude,
        toCoord.latitude,
        toCoord.longitude
      );

      setDriverLat(fromCoord.latitude);
      setDriverLng(fromCoord.longitude);
      setDriverHeading(heading);
      setDriverSpeed(36);
      setCurrentStopIndex((step + 1) % validCoords.length);

      syncDriverCoordinates(fromCoord.latitude, fromCoord.longitude, heading, 36);

      step++;
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulatingDrive, orderedStops, selectedRouteId, trip?.id, currentStopIndex]);

  const driverMapMarkers = useMemo(() => {
    const list: any[] = [];

    // Rotating Driver Vehicle Marker
    list.push({
      latitude: driverLat,
      longitude: driverLng,
      label: "Your Bus / Cab (Captain)",
      subLabel: nextStop
        ? `Target: Stop #${nextStop.stopOrder} ${nextStop.stopName}`
        : "Live Transit",
      type: "vehicle",
      heading: driverHeading,
      speed: driverSpeed,
      pulse: true,
    });

    // Smart stops along route
    orderedStops.forEach((stop: any, idx: number) => {
      if (stop.latitude && stop.longitude) {
        const isTarget = idx === currentStopIndex;
        const isFinal = idx === orderedStops.length - 1;

        list.push({
          latitude: stop.latitude,
          longitude: stop.longitude,
          label: `Stop ${stop.stopOrder}: ${stop.stopName}`,
          subLabel: isTarget
            ? "CURRENT TARGET STOP"
            : `Est: ${stop.estimatedTime || "N/A"}`,
          type: isTarget ? "pickup" : isFinal ? "destination" : "standard",
          color: isTarget
            ? "bg-blue-600 ring-4 ring-blue-300"
            : isFinal
            ? "bg-red-600"
            : "bg-emerald-600",
          pulse: isTarget,
        });
      }
    });

    return list;
  }, [
    driverLat,
    driverLng,
    driverHeading,
    driverSpeed,
    orderedStops,
    currentStopIndex,
    nextStop,
  ]);

  const driverMapPolylines = useMemo(() => {
    return (manifest?.smartStops ?? [])
      .filter(
        (stop: any) =>
          typeof stop.latitude === "number" &&
          typeof stop.longitude === "number"
      )
      .map((stop: any) => ({
        latitude: stop.latitude as number,
        longitude: stop.longitude as number,
      }));
  }, [manifest?.smartStops]);

  const driverMapCenter = useMemo(() => {
    if (driverLat !== 24.8607 || driverLng !== 67.0104) {
      return { lat: driverLat, lng: driverLng };
    }
    const stops = manifest?.smartStops ?? [];
    if (stops.length > 0 && stops[0].latitude && stops[0].longitude) {
      return { lat: stops[0].latitude, lng: stops[0].longitude };
    }
    return { lat: 24.8607, lng: 67.0104 };
  }, [driverLat, driverLng, manifest?.smartStops]);

  const passengers = useMemo(() => {
    return manifest?.bookings ?? [];
  }, [manifest]);

  const passengerSummary = useMemo(() => {
    return {
      total: passengers.length,

      awaiting: passengers.filter(
        (booking) => booking.status === "ASSIGNED"
      ).length,

      boarded: passengers.filter(
        (booking) => booking.status === "COMPLETED"
      ).length,

      noShow: passengers.filter(
        (booking) => booking.status === "NO_SHOW"
      ).length,
    };
  }, [passengers]);

  const filteredPassengers = useMemo(() => {
    const q = manifestSearch.toLowerCase().trim();
    return passengers.filter((booking) => {
      const matchesSearch =
        !q ||
        (booking.employee?.fullName && booking.employee.fullName.toLowerCase().includes(q)) ||
        (booking.employee?.phone && booking.employee.phone.toLowerCase().includes(q)) ||
        (booking.pickupStop?.stopName && booking.pickupStop.stopName.toLowerCase().includes(q)) ||
        (booking.pickupArea && booking.pickupArea.toLowerCase().includes(q)) ||
        (booking.seatNumber && booking.seatNumber.toLowerCase().includes(q));

      const matchesStatus =
        manifestFilter === "ALL" ||
        (manifestFilter === "AWAITING" && booking.status === "ASSIGNED") ||
        (manifestFilter === "BOARDED" && booking.status === "COMPLETED") ||
        (manifestFilter === "NO_SHOW" && booking.status === "NO_SHOW");

      return Boolean(matchesSearch && matchesStatus);
    });
  }, [passengers, manifestSearch, manifestFilter]);

  const checklistComplete =
    checklist.fuelChecked &&
    checklist.tiresChecked &&
    checklist.brakesChecked &&
    checklist.lightsChecked;

  async function loadRoutes() {
    try {
      setIsLoadingRoutes(true);
      setError("");

      const data = await getMyAssignedDriverRoutes();
      setRoutes(data);

      if (!selectedRouteId && data.length > 0) {
        await selectRoute(data[0]);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch assigned routes"
      );
    } finally {
      setIsLoadingRoutes(false);
    }
  }

  async function selectRoute(route: AssignedDriverRoute) {
    try {
      setSelectedRouteId(route.id);
      setIsLoadingManifest(true);
      setMessage("");
      setError("");

      const data = await getDriverRouteManifest(route.id);
      const normalized = normalizeManifest(data, route);

      setManifest(normalized);

      if (normalized.trip) {
        setChecklist({
          fuelChecked: normalized.trip.fuelChecked,
          tiresChecked: normalized.trip.tiresChecked,
          brakesChecked: normalized.trip.brakesChecked,
          lightsChecked: normalized.trip.lightsChecked,
        });
      } else {
        setChecklist(defaultChecklist);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch route manifest"
      );
    } finally {
      setIsLoadingManifest(false);
    }
  }

  async function refreshCurrentRoute() {
    if (!selectedRoute) {
      return;
    }

    await selectRoute(selectedRoute);
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  async function handleChecklistSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedRouteId) {
      setError("Select an assigned route first");
      return;
    }

    if (!checklistComplete) {
      setError(
        "All safety checks must be completed before submission"
      );
      return;
    }

    setMessage("");
    setError("");
    setIsSubmittingChecklist(true);

    try {
      const payload: SafetyChecklistInput = {
        fuelChecked: checklist.fuelChecked,
        tiresChecked: checklist.tiresChecked,
        brakesChecked: checklist.brakesChecked,
        lightsChecked: checklist.lightsChecked,
      };

      await submitDriverSafetyChecklist(
        selectedRouteId,
        payload
      );

      setMessage("Safety checklist submitted successfully");

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to submit safety checklist"
      );
    } finally {
      setIsSubmittingChecklist(false);
    }
  }

  async function handleStartTrip() {
    if (!selectedRouteId) {
      return;
    }

    const confirmed = window.confirm(
      "Start this trip now?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction("start");
      setMessage("");
      setError("");

      let lat = driverLat;
      let lng = driverLng;

      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              lat = position.coords.latitude;
              lng = position.coords.longitude;
              setDriverLat(lat);
              setDriverLng(lng);
              resolve();
            },
            (err) => {
              console.error("GPS fetch failed on start:", err);
              resolve();
            },
            { timeout: 3000 }
          );
        });
      }

      const updatedTrip = await startDriverTrip(selectedRouteId);

      setMessage("Trip started successfully");

      try {
        await createTelemetryLog({
          routeId: selectedRouteId,
          transportTripId: updatedTrip.id,
          latitude: lat,
          longitude: lng,
          speed: 0,
          status: "STOPPED",
          source: "MOBILE_GPS",
        });
        setSyncedCount((prev) => prev + 1);
      } catch (telErr) {
        console.error("Starting telemetry sync error:", telErr);
      }

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to start trip"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handlePassengerBoarded(
    booking: ShuttleBooking
  ) {
    if (!selectedRouteId) {
      return;
    }

    try {
      setProcessingAction(`board-${booking.id}`);
      setMessage("");
      setError("");

      await markPassengerBoarded(
        selectedRouteId,
        booking.id
      );

      setMessage(
        `${booking.employee?.fullName ?? "Passenger"} marked as boarded`
      );

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to mark passenger as boarded"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handlePassengerNoShow(
    booking: ShuttleBooking
  ) {
    if (!selectedRouteId) {
      return;
    }

    const confirmed = window.confirm(
      `Mark ${
        booking.employee?.fullName ?? "this passenger"
      } as no-show?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction(`no-show-${booking.id}`);
      setMessage("");
      setError("");

      await markPassengerNoShow(
        selectedRouteId,
        booking.id
      );

      setMessage(
        `${booking.employee?.fullName ?? "Passenger"} marked as no-show`
      );

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to mark passenger as no-show"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser"
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIssueForm((current) => ({
          ...current,
          issueLatitude: String(position.coords.latitude),
          issueLongitude: String(position.coords.longitude),
        }));

        setMessage("Current location added to issue report");
      },
      () => {
        setError(
          "Location permission was denied or unavailable"
        );
      }
    );
  }

  async function handleIssueSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedRouteId) {
      setError("Select a route first");
      return;
    }

    setMessage("");
    setError("");
    setIsSubmittingIssue(true);

    try {
      if (
        issueForm.issueType !== "SOS" &&
        !issueForm.issueDescription.trim()
      ) {
        throw new Error(
          "Issue description is required"
        );
      }

      const payload: ReportTripIssueInput = {
        issueType: issueForm.issueType,
      };

      if (issueForm.issueDescription.trim()) {
        payload.issueDescription =
          issueForm.issueDescription.trim();
      }

      if (issueForm.issueLatitude.trim()) {
        payload.issueLatitude = Number(
          issueForm.issueLatitude
        );
      }

      if (issueForm.issueLongitude.trim()) {
        payload.issueLongitude = Number(
          issueForm.issueLongitude
        );
      }

      await reportDriverTripIssue(
        selectedRouteId,
        payload
      );

      setMessage(
        issueForm.issueType === "SOS"
          ? "Emergency SOS reported successfully"
          : "Trip issue reported successfully"
      );

      setIssueForm(defaultIssueForm);

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to report trip issue"
      );
    } finally {
      setIsSubmittingIssue(false);
    }
  }

  async function handleEndTrip() {
    if (!selectedRouteId) {
      return;
    }

    const awaitingPassengers = passengers.filter(
      (booking) => booking.status === "ASSIGNED"
    ).length;

    const confirmationMessage =
      awaitingPassengers > 0
        ? `${awaitingPassengers} passengers are still awaiting boarding status. End the trip anyway?`
        : "Complete and end this trip?";

    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction("end");
      setMessage("");
      setError("");

      await endDriverTrip(selectedRouteId);

      setMessage("Trip completed successfully");

      await refreshCurrentRoute();
      await loadRoutes();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to complete trip"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Driver Operations
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Assigned Trips
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Complete the safety checklist, manage passenger
            boarding, report issues, and complete the trip.
          </p>
        </div>

        <Button variant="secondary" onClick={loadRoutes}>
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

      {/* 1. TOP HORIZONTAL ROUTE SELECTOR ROSTER */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
            Assigned Routes ({routes.length})
          </p>
          {isLoadingRoutes && (
            <span className="text-2xs text-slate-400 animate-pulse">Syncing routes...</span>
          )}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
          {routes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            const currentTrip = route.trips?.[0] ?? null;

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => selectRoute(route)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition shrink-0 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/80 shadow-sm ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <RouteIcon size={18} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm truncate max-w-[160px] sm:max-w-none">
                      {route.routeName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-3xs font-extrabold ${getTripStatusBadge(
                        currentTrip?.status
                      )}`}
                    >
                      {currentTrip?.status ?? "NOT STARTED"}
                    </span>
                  </div>

                  <p className="text-2xs text-slate-500 font-medium">
                    {route.routeCode} • {route.vehicle?.vehicleNumber ?? "Vehicle Pending"} • {route.startTime ?? "--"}
                  </p>
                </div>
              </button>
            );
          })}

          {routes.length === 0 && !isLoadingRoutes && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500 font-semibold">
              No routes currently assigned to you.
            </div>
          )}
        </div>
      </div>

      {!selectedRoute || !manifest ? (
        <Card>
          <div className="py-14 text-center">
            <Navigation size={44} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Select an assigned route
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Choose a route from the selector above to open live navigation and passenger manifest.
            </p>
          </div>
        </Card>
      ) : isLoadingManifest ? (
        <Card>
          <div className="py-14 text-center text-sm text-slate-500">
            Loading route manifest...
          </div>
        </Card>
      ) : (
        <>
          {/* 2. COMPACT ROUTE OPERATIONS & STATUS BAR */}
          <Card>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-700">
                    <RouteIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 truncate">
                      {manifest.route.routeName}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Date: <strong className="text-slate-700">{formatDate(manifest.route.routeDate)}</strong> • Code: <strong className="text-slate-700">{manifest.route.routeCode}</strong> • Schedule:{" "}
                      <strong className="text-slate-700">{manifest.route.startTime ?? "-"} – {manifest.route.endTime ?? "-"}</strong> • Vehicle:{" "}
                      <strong className="text-blue-700">{manifest.vehicle?.vehicleNumber ?? "Unassigned"}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getTripStatusBadge(trip?.status)}`}>
                  {trip?.status ?? "NOT STARTED"}
                </span>

                {trip?.status === "READY" && (
                  <Button onClick={handleStartTrip} disabled={processingAction === "start"}>
                    <PlayCircle size={15} className="mr-1.5" />
                    {processingAction === "start" ? "Starting..." : "Start Trip"}
                  </Button>
                )}

                {trip?.status === "IN_PROGRESS" && (
                  <Button onClick={handleEndTrip} disabled={processingAction === "end"} variant="danger">
                    <Flag size={15} className="mr-1.5" />
                    {processingAction === "end" ? "Completing..." : "End Trip"}
                  </Button>
                )}

                <Button variant="secondary" onClick={refreshCurrentRoute}>
                  <RefreshCcw size={15} className="mr-1.5" />
                  Refresh
                </Button>
              </div>
            </div>

            {trip?.issueType && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">
                      Reported Issue: {trip.issueType}
                    </p>
                    <p className="text-2xs text-amber-700">{trip.issueDescription ?? "No description"}</p>
                    <p className="text-3xs text-amber-600 mt-0.5">{formatDateTime(trip.issueReportedAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* 3. MOBILE-ONLY WORKSPACE TAB CONTROLLER (< xl) */}
          <div className="flex xl:hidden rounded-2xl bg-slate-100 p-1.5 border border-slate-200 overflow-x-auto no-scrollbar gap-1">
            <button
              type="button"
              onClick={() => setDriverTab("nav")}
              className={`flex-1 min-w-[105px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                driverTab === "nav" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Navigation size={13} />
              <span>Nav HUD</span>
            </button>
            <button
              type="button"
              onClick={() => setDriverTab("manifest")}
              className={`flex-1 min-w-[115px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                driverTab === "manifest" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck size={13} />
              <span>Manifest ({passengers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDriverTab("checklist")}
              className={`flex-1 min-w-[95px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                driverTab === "checklist" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardCheck size={13} />
              <span>Checklist</span>
            </button>
            <button
              type="button"
              onClick={() => setDriverTab("issue")}
              className={`flex-1 min-w-[85px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                driverTab === "issue" ? "bg-white text-red-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldAlert size={13} />
              <span>Issue</span>
            </button>
            <button
              type="button"
              onClick={() => setDriverTab("stops")}
              className={`flex-1 min-w-[85px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                driverTab === "stops" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UsersRound size={13} />
              <span>Stops</span>
            </button>
          </div>

          {/* 4. MAIN DUAL-PANE WORKSPACE: Desktop Split vs Mobile Tab */}
          <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* LEFT PANE: LIVE NAVIGATION HUD & MAP (Always on desktop; on mobile when driverTab === 'nav') */}
            <div className={`space-y-6 ${driverTab === "nav" ? "block" : "hidden xl:block"}`}>
              <Card>
                <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700">
                      <Navigation
                        size={20}
                        className={trip?.status === "IN_PROGRESS" ? "animate-spin" : ""}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          Navigation & Transit HUD
                        </h2>
                        {trip?.status === "IN_PROGRESS" && (
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </div>
                      <p className="text-3xs text-slate-500 font-semibold">
                        GPS broadcast • Heading: {driverHeading}° • Speed: {driverSpeed} km/h
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {/* Simulated Driving test toggle */}
                    <button
                      type="button"
                      onClick={() => setIsSimulatingDrive(!isSimulatingDrive)}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-3xs font-bold transition ${
                        isSimulatingDrive
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      title="Toggle simulated driver route drive"
                    >
                      <Sparkles size={12} className={isSimulatingDrive ? "animate-spin" : "text-amber-500"} />
                      <span>{isSimulatingDrive ? "Simulating..." : "Simulate Drive"}</span>
                    </button>

                    {/* Camera Lock toggle */}
                    <button
                      type="button"
                      onClick={() => setIsFollowLocked(!isFollowLocked)}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-3xs font-bold transition ${
                        isFollowLocked
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Eye size={12} />
                      <span>{isFollowLocked ? "Locked" : "Free"}</span>
                    </button>

                    {syncedCount > 0 && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-4xs font-extrabold text-emerald-700 uppercase">
                        {isSyncingTelemetry ? "Sync..." : `${syncedCount} Fixes`}
                      </span>
                    )}
                  </div>
                </div>

                {/* TURN-BY-TURN / NEXT WAYPOINT GUIDANCE BANNER */}
                {nextStop && (
                  <div className="mb-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                            Next Stop
                          </span>
                          <span className="text-2xs text-slate-400">
                            Stop {nextStop.stopOrder} of {orderedStops.length}
                          </span>
                        </div>

                        <h3 className="mt-1 text-base font-black text-white truncate">
                          {nextStop.stopName}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <Clock3 size={13} />
                            {nextStopDistanceKm < 0.2
                              ? "Arrived at Stop"
                              : `~${nextStopEtaMins} mins (${Math.round(nextStopDistanceKm * 1000)}m)`}
                          </span>
                          <span>•</span>
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <UserCheck size={13} />
                            {passengersAtNextStop.length} Passenger(s) to board
                          </span>
                        </div>
                      </div>

                      {/* 1-Tap Google Maps Turn-by-Turn + Stop Complete */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {nextStop.latitude && nextStop.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${nextStop.latitude},${nextStop.longitude}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                          >
                            <ExternalLink size={13} />
                            <span>Google Maps</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setCurrentStopIndex((prev) =>
                              Math.min(prev + 1, orderedStops.length - 1)
                            )
                          }
                          disabled={currentStopIndex >= orderedStops.length - 1}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                        >
                          <CheckCircle2 size={13} />
                          <span>
                            {currentStopIndex >= orderedStops.length - 1
                              ? "Final Destination"
                              : "Next Stop"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leaflet Map with Live Orientation */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                  <MapView
                    latitude={driverMapCenter.lat}
                    longitude={driverMapCenter.lng}
                    readOnly={true}
                    hideMainPin={true}
                    followCenter={isFollowLocked}
                    markers={driverMapMarkers}
                    polylines={driverMapPolylines}
                    polylineColor="#10b981"
                    polylineDashArray="4, 6"
                    polylineWeight={5}
                    height="360px"
                    enableFullscreenToggle={true}
                    enableGPS={false}
                    enableSearch={false}
                    enablePresets={false}
                  />
                </div>

                {/* IMMEDIATE CURRENT STOP BOARDING TRAY */}
                {nextStop && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Stop #{nextStop.stopOrder} Boarding: {nextStop.stopName}
                        </h4>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-3xs font-extrabold text-blue-800">
                        {passengersAtNextStop.length} Passenger(s) waiting
                      </span>
                    </div>

                    {passengersAtNextStop.length > 0 ? (
                      <div className="space-y-2">
                        {passengersAtNextStop.map((booking: any) => (
                          <div
                            key={booking.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs"
                          >
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs">
                                {booking.employee?.fullName ?? "Employee"}
                              </p>
                              <p className="text-3xs text-slate-500 font-semibold">
                                Seat: {booking.seatNumber ?? "Unassigned"} • Phone: {booking.employee?.phone ?? "—"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={trip?.status !== "IN_PROGRESS" || processingAction === `board-${booking.id}`}
                                onClick={() => handlePassengerBoarded(booking)}
                                className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-3xs font-black px-3 py-1.5 shadow-sm transition"
                              >
                                <UserCheck size={12} />
                                <span>{processingAction === `board-${booking.id}` ? "Saving..." : "Boarded"}</span>
                              </button>
                              <button
                                type="button"
                                disabled={trip?.status !== "IN_PROGRESS" || processingAction === `no-show-${booking.id}`}
                                onClick={() => handlePassengerNoShow(booking)}
                                className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50 text-3xs font-black px-3 py-1.5 transition"
                              >
                                <UserX size={12} />
                                <span>{processingAction === `no-show-${booking.id}` ? "Saving..." : "No Show"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-2xs text-slate-400 font-medium italic">
                        No registered passengers waiting for pickup at this waypoint stop.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT PANE / TABBED WORKSPACES (Always on desktop; on mobile when driverTab !== 'nav') */}
            <div className={`space-y-6 ${driverTab !== "nav" ? "block" : "hidden xl:block"}`}>
              {/* Desktop Workspace Tab Controller */}
              <div className="hidden xl:flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setDriverTab("manifest")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    driverTab === "manifest" || driverTab === "nav"
                      ? "bg-white text-blue-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserCheck size={14} />
                  <span>Manifest ({passengers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDriverTab("checklist")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    driverTab === "checklist"
                      ? "bg-white text-blue-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ClipboardCheck size={14} />
                  <span>Checklist</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDriverTab("issue")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    driverTab === "issue"
                      ? "bg-white text-red-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldAlert size={14} />
                  <span>Issue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDriverTab("stops")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    driverTab === "stops"
                      ? "bg-white text-blue-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UsersRound size={14} />
                  <span>Stops</span>
                </button>
              </div>

              {/* TAB 1: PASSENGER MANIFEST */}
              {(driverTab === "manifest" || driverTab === "nav") && (
                <div className="space-y-4">
                  {/* Passenger Summary KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Card className="p-3">
                      <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider">Total</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{passengerSummary.total}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-3xs text-amber-600 font-bold uppercase tracking-wider">Awaiting</p>
                      <p className="mt-1 text-lg font-black text-amber-700">{passengerSummary.awaiting}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-3xs text-emerald-600 font-bold uppercase tracking-wider">Boarded</p>
                      <p className="mt-1 text-lg font-black text-emerald-700">{passengerSummary.boarded}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider">No Show</p>
                      <p className="mt-1 text-lg font-black text-slate-700">{passengerSummary.noShow}</p>
                    </Card>
                  </div>

                  <Card className="min-w-0">
                    <div className="mb-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">Passenger Manifest</h3>
                        <span className="text-xs text-slate-500 font-semibold">
                          {filteredPassengers.length} of {passengers.length} shown
                        </span>
                      </div>

                      {/* Search & Filter pills */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={manifestSearch}
                            onChange={(e) => setManifestSearch(e.target.value)}
                            placeholder="Filter by name, stop, seat..."
                            className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-600"
                          />
                        </div>

                        <div className="flex overflow-x-auto gap-1 py-0.5 no-scrollbar shrink-0">
                          {(["ALL", "AWAITING", "BOARDED", "NO_SHOW"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setManifestFilter(st)}
                              className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold uppercase tracking-wider transition ${
                                manifestFilter === st
                                  ? "bg-slate-900 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mobile View: Touch-Friendly Passenger Manifest Cards (< md) */}
                    <div className="block md:hidden space-y-2.5">
                      {filteredPassengers.length > 0 ? (
                        filteredPassengers.map((booking) => (
                          <MobileCard
                            key={booking.id}
                            title={booking.employee?.fullName ?? "Employee"}
                            subtitle={`Seat: ${booking.seatNumber ?? "Unassigned"} • ${booking.pickupStop?.stopName ?? booking.pickupArea}`}
                            statusBadge={{
                              label: booking.status,
                              variant: getPassengerMobileBadgeVariant(booking.status),
                            }}
                            fields={[
                              {
                                label: "Pickup",
                                value: booking.pickupStop?.stopName ?? booking.pickupArea,
                                icon: <MapPin size={12} />,
                              },
                              {
                                label: "Phone",
                                value: booking.employee?.phone ? (
                                  <a
                                    href={`tel:${booking.employee.phone}`}
                                    className="text-blue-700 underline font-bold"
                                  >
                                    {booking.employee.phone}
                                  </a>
                                ) : (
                                  "—"
                                ),
                              },
                              {
                                label: "Emp Code",
                                value: booking.employee?.employeeCode ?? "—",
                              },
                            ]}
                            actions={
                              booking.status === "ASSIGNED" ? (
                                <div className="flex w-full gap-2">
                                  <Button
                                    type="button"
                                    disabled={
                                      trip?.status !== "IN_PROGRESS" ||
                                      processingAction === `board-${booking.id}`
                                    }
                                    onClick={() => handlePassengerBoarded(booking)}
                                    className="flex-1 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    <UserCheck size={14} className="mr-1" />
                                    {processingAction === `board-${booking.id}`
                                      ? "Saving..."
                                      : "Boarded"}
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={
                                      trip?.status !== "IN_PROGRESS" ||
                                      processingAction === `no-show-${booking.id}`
                                    }
                                    onClick={() => handlePassengerNoShow(booking)}
                                    className="flex-1 py-2 text-xs border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                  >
                                    <UserX size={14} className="mr-1" />
                                    {processingAction === `no-show-${booking.id}`
                                      ? "Saving..."
                                      : "No Show"}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">
                                  Status recorded
                                </span>
                              )
                            }
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                          No passengers match current filter.
                        </div>
                      )}
                    </div>

                    {/* Desktop View: Formatted Manifest Table (>= md) */}
                    <div className="hidden md:block w-full min-w-0 overflow-x-auto">
                      <table className="w-full min-w-[620px] border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                            <th className="px-3 py-1.5">Passenger</th>
                            <th className="px-3 py-1.5">Stop</th>
                            <th className="px-3 py-1.5">Seat</th>
                            <th className="px-3 py-1.5">Contact</th>
                            <th className="px-3 py-1.5">Status</th>
                            <th className="px-3 py-1.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPassengers.map((booking) => (
                            <tr key={booking.id} className="bg-slate-50">
                              <td className="rounded-l-xl px-3 py-2.5">
                                <p className="font-semibold text-slate-900 text-xs">
                                  {booking.employee?.fullName ?? "Employee"}
                                </p>
                                <p className="text-3xs text-slate-500">
                                  {booking.employee?.employeeCode ?? "-"}
                                </p>
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="text-xs font-semibold text-slate-700">
                                  {booking.pickupStop?.stopName ?? booking.pickupArea}
                                </p>
                              </td>
                              <td className="px-3 py-2.5 text-xs font-bold text-slate-700">
                                {booking.seatNumber ?? "-"}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-600">
                                {booking.employee?.phone ?? "-"}
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-3xs font-bold ${getPassengerStatusBadge(
                                    booking.status
                                  )}`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                              <td className="rounded-r-xl px-3 py-2.5 text-right">
                                <div className="flex justify-end gap-1.5">
                                  {booking.status === "ASSIGNED" && (
                                    <>
                                      <Button
                                        type="button"
                                        disabled={
                                          trip?.status !== "IN_PROGRESS" ||
                                          processingAction === `board-${booking.id}`
                                        }
                                        onClick={() => handlePassengerBoarded(booking)}
                                        className="py-1 px-2.5 text-3xs"
                                      >
                                        <UserCheck size={12} className="mr-1" />
                                        Boarded
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={
                                          trip?.status !== "IN_PROGRESS" ||
                                          processingAction === `no-show-${booking.id}`
                                        }
                                        onClick={() => handlePassengerNoShow(booking)}
                                        className="py-1 px-2.5 text-3xs border border-amber-200 text-amber-700"
                                      >
                                        <UserX size={12} className="mr-1" />
                                        No Show
                                      </Button>
                                    </>
                                  )}
                                  {booking.status !== "ASSIGNED" && (
                                    <span className="text-3xs text-slate-400">Recorded</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredPassengers.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-xs text-slate-500"
                              >
                                No passengers found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 2: SAFETY CHECKLIST */}
              {driverTab === "checklist" && (
                <Card>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700">
                      <ClipboardCheck size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Safety Checklist</h2>
                      <p className="text-xs text-slate-500">
                        Required safety verifications before trip initiation.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleChecklistSubmit} className="space-y-3">
                    {[
                      { key: "fuelChecked", label: "Fuel level verified sufficient" },
                      { key: "tiresChecked", label: "Tyres condition and pressure checked" },
                      { key: "brakesChecked", label: "Brakes and hydraulic responsiveness tested" },
                      { key: "lightsChecked", label: "Headlights, indicators, and hazard lights operational" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3.5 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checklist[item.key as keyof ChecklistFormState]}
                          disabled={trip?.status === "IN_PROGRESS" || trip?.status === "COMPLETED"}
                          onChange={(e) =>
                            setChecklist({
                              ...checklist,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                      </label>
                    ))}

                    <Button
                      className="mt-3 w-full"
                      disabled={
                        !checklistComplete ||
                        isSubmittingChecklist ||
                        trip?.status === "IN_PROGRESS" ||
                        trip?.status === "COMPLETED"
                      }
                    >
                      <SquareCheckBig size={15} className="mr-2" />
                      {isSubmittingChecklist
                        ? "Submitting..."
                        : trip?.status === "READY"
                        ? "Checklist Completed"
                        : "Submit Safety Checklist"}
                    </Button>
                  </form>
                </Card>
              )}

              {/* TAB 3: REPORT ISSUE */}
              {driverTab === "issue" && (
                <Card>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-red-50 p-2.5 text-red-700">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Report Trip Issue</h2>
                      <p className="text-xs text-slate-500">
                        Report traffic delay, mechanical breakdown, or emergency.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleIssueSubmit} className="space-y-3">
                    <div>
                      <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase">
                        Issue Type
                      </label>
                      <select
                        value={issueForm.issueType}
                        onChange={(e) =>
                          setIssueForm({ ...issueForm, issueType: e.target.value as TripIssueType })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600"
                      >
                        <option value="DELAY">DELAY</option>
                        <option value="BREAKDOWN">BREAKDOWN</option>
                        <option value="SOS">SOS (EMERGENCY)</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-2xs font-bold text-slate-500 uppercase">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={issueForm.issueDescription}
                        onChange={(e) =>
                          setIssueForm({ ...issueForm, issueDescription: e.target.value })
                        }
                        placeholder="Explain the circumstance..."
                        className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        value={issueForm.issueLatitude}
                        onChange={(e) =>
                          setIssueForm({ ...issueForm, issueLatitude: e.target.value })
                        }
                        placeholder="Latitude"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        value={issueForm.issueLongitude}
                        onChange={(e) =>
                          setIssueForm({ ...issueForm, issueLongitude: e.target.value })
                        }
                        placeholder="Longitude"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full text-xs"
                      onClick={useCurrentLocation}
                    >
                      <MapPin size={14} className="mr-1.5" />
                      Auto-Fill Current GPS Coordinates
                    </Button>

                    <Button
                      className="w-full text-xs"
                      variant={issueForm.issueType === "SOS" ? "danger" : "primary"}
                      disabled={isSubmittingIssue}
                    >
                      <AlertTriangle size={14} className="mr-1.5" />
                      {isSubmittingIssue
                        ? "Reporting..."
                        : issueForm.issueType === "SOS"
                        ? "Broadcast Emergency SOS"
                        : "Submit Report"}
                    </Button>
                  </form>
                </Card>
              )}

              {/* TAB 4: ROUTE STOPS SEQUENCE */}
              {driverTab === "stops" && (
                <Card>
                  <div className="mb-4 flex items-center gap-3">
                    <UsersRound size={20} className="text-blue-700" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Route Waypoint Sequence</h2>
                      <p className="text-xs text-slate-500">
                        Total {orderedStops.length} stops scheduled on this route.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {orderedStops.map((stop: any, idx: number) => {
                      const isTarget = idx === currentStopIndex;
                      return (
                        <div
                          key={stop.id}
                          className={`rounded-2xl p-3 border transition ${
                            isTarget
                              ? "bg-blue-50/80 border-blue-400 shadow-2xs"
                              : "bg-slate-50 border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  isTarget ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {stop.stopOrder}
                              </span>
                              <div>
                                <p className="font-bold text-slate-800 text-xs">
                                  {stop.stopName}
                                </p>
                                <p className="text-3xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock3 size={11} /> Est: {stop.estimatedTime ?? "N/A"}
                                </p>
                              </div>
                            </div>

                            {isTarget && (
                              <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-4xs font-black uppercase">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}