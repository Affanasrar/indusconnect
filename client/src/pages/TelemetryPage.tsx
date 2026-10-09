import { useEffect, useMemo, useState, useRef } from "react";
import {
  RefreshCcw,
  AlertOctagon,
  BatteryCharging,
  CheckCircle,
  XCircle,
  Truck,
  Activity,
  History,
  BellRing,
  Volume2,
  VolumeX,
  Search,
  Compass,
  Radio,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MapView, { type MapMarkerItem } from "../components/ui/MapView";
import {
  createTelemetryLog,
  getLiveLocations,
  getEmergencyTelemetryEvents,
  getTelemetryByRoute,
  getMyTelemetryLogs,
} from "../api/telemetry";
import { getRoutes } from "../api/routes";
import type { VehicleTelemetryLog, TelemetryStatus } from "../types/telemetry";
import type { TransportRoute } from "../types/transport";

// Karachi Landmarks for spatial reference
const MAP_LANDMARKS = [
  { name: "Garden West Hub", lat: 24.8765, lng: 67.0321 },
  { name: "Saddar Commute Terminus", lat: 24.8607, lng: 67.0104 },
  { name: "Korangi Campus Gate", lat: 24.8138, lng: 67.1209 },
  { name: "Port Qasim Facility", lat: 24.7831, lng: 67.3321 },
];

export default function TelemetryPage() {
  const { bootstrap } = useAuth();

  // Roles
  const isDriver = bootstrap?.role === "DRIVER";
  const isAdminOrSecurity =
    bootstrap?.role === "SUPER_ADMIN" ||
    bootstrap?.role === "TRANSPORT_ADMIN" ||
    bootstrap?.role === "SECURITY_OFFICER";

  // Data States
  const [liveLogs, setLiveLogs] = useState<VehicleTelemetryLog[]>([]);
  const [emergencies, setEmergencies] = useState<VehicleTelemetryLog[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [routeHistory, setRouteHistory] = useState<VehicleTelemetryLog[]>([]);

  // Driver GPS Broadcaster States
  const [isSyncing, setIsSyncing] = useState(false);
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsSyncedCount, setGpsSyncedCount] = useState(0);

  // UI & Filter States
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "MOVING" | "STOPPED" | "EMERGENCY"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLiveLog, setSelectedLiveLog] =
    useState<VehicleTelemetryLog | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Audio warning ref for pulsing emergencies
  const audioContextRef = useRef<AudioContext | null>(null);

  async function syncGPSCoordinates(
    lat: number,
    lng: number,
    status: TelemetryStatus = "MOVING",
    remarks?: string
  ) {
    try {
      await createTelemetryLog({
        latitude: lat,
        longitude: lng,
        speed: 35,
        status: status,
        source: "MOBILE_GPS",
        remarks: remarks || "Automated live GPS coordinate update.",
      });
      setGpsSyncedCount((prev) => prev + 1);
    } catch (err) {
      console.error("GPS Sync failed:", err);
    }
  }

  // Driver Continuous Location Watcher
  useEffect(() => {
    if (!isSyncing) return;

    if (!navigator.geolocation) {
      setError("HTML5 Geolocation is not supported by your browser");
      setIsSyncing(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsLat(lat);
        setGpsLng(lng);
        syncGPSCoordinates(lat, lng);
      },
      (err) => console.warn("Driver GPS watch error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSyncing]);

  // Load telemetry logs
  async function loadTelemetry() {
    try {
      setIsLoading(true);
      setError("");

      if (isDriver) {
        const myLogs = await getMyTelemetryLogs();
        if (myLogs && myLogs.length > 0) {
          setLiveLogs(myLogs);
        }
      } else {
        const [live, emergenciesList, routesList] = await Promise.all([
          getLiveLocations(),
          getEmergencyTelemetryEvents(),
          getRoutes(),
        ]);
        setLiveLogs(live || []);
        setEmergencies(emergenciesList || []);
        setRoutes(routesList || []);
      }
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load telemetry feed");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTelemetry();

    // Fast 5-second auto-refresh for real-time telemetry feed
    const interval = setInterval(() => {
      if (!isDriver) {
        silentRefresh();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isDriver]);

  // Silent update in background
  async function silentRefresh() {
    try {
      const [live, emergenciesList] = await Promise.all([
        getLiveLocations(),
        getEmergencyTelemetryEvents(),
      ]);
      setLiveLogs(live || []);
      setEmergencies(emergenciesList || []);
    } catch (err) {
      console.warn("Silent telemetry refresh failed:", err);
    }
  }

  // Load route history when route changes
  async function handleRouteChange(routeId: string) {
    setSelectedRouteId(routeId);
    if (!routeId) {
      setRouteHistory([]);
      return;
    }
    try {
      const trail = await getTelemetryByRoute(routeId);
      setRouteHistory(trail || []);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load route telemetry trail");
    }
  }

  // Synthesize warning beep for emergency alarms
  function triggerBeepAlert() {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio Context beep initialization blocked by browser policy.");
    }
  }

  // Monitor logs for trigger on SOS
  useEffect(() => {
    const hasEmergency = liveLogs.some(
      (l) => l.status === "SOS" || l.status === "BREAKDOWN"
    );
    if (hasEmergency) {
      triggerBeepAlert();
    }
  }, [liveLogs, isMuted]);

  // Filtered live fleet roster
  const filteredLiveLogs = useMemo(() => {
    let result = [...liveLogs];

    // Status filter
    if (statusFilter === "MOVING") {
      result = result.filter((l) => l.status === "MOVING");
    } else if (statusFilter === "STOPPED") {
      result = result.filter(
        (l) => l.status === "STOPPED" || l.status === "DELAYED"
      );
    } else if (statusFilter === "EMERGENCY") {
      result = result.filter(
        (l) => l.status === "SOS" || l.status === "BREAKDOWN"
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.vehicle?.vehicleNumber?.toLowerCase().includes(q) ||
          l.driver?.user.fullName?.toLowerCase().includes(q) ||
          l.route?.routeName?.toLowerCase().includes(q) ||
          l.route?.routeCode?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [liveLogs, statusFilter, searchQuery]);

  // Dynamic Fleet Telemetry Map Markers with Orientation
  const telemetryMapMarkers = useMemo(() => {
    const list: MapMarkerItem[] = [];

    // Static Landmarks
    MAP_LANDMARKS.forEach((l) => {
      list.push({
        latitude: l.lat,
        longitude: l.lng,
        label: `${l.name} (Hub)`,
        color: "bg-slate-700",
        type: "standard",
      });
    });

    // Active Live Vehicles with Heading & Speed
    filteredLiveLogs.forEach((log) => {
      const isEmergency = log.status === "SOS" || log.status === "BREAKDOWN";
      list.push({
        latitude: log.latitude,
        longitude: log.longitude,
        label: `${log.vehicle?.vehicleNumber || "Vehicle"} • ${log.status}`,
        subLabel: `${log.driver?.user?.fullName || "Captain"} • ${
          log.route?.routeName || "En route"
        }`,
        type: "vehicle",
        vehicleType: (log.vehicle?.vehicleType as any) || "VAN",
        heading: log.heading || 0,
        speed: log.speed || 0,
        status: log.status,
        driverName: log.driver?.user?.fullName,
        vehicleNumber: log.vehicle?.vehicleNumber,
        routeName: log.route?.routeName,
        routeCode: log.route?.routeCode,
        batteryLevel: log.batteryLevel || 100,
        pulse: isEmergency,
      });
    });

    return list;
  }, [filteredLiveLogs]);

  // Selected map center
  const mapCenter = useMemo(() => {
    if (selectedLiveLog) {
      return { lat: selectedLiveLog.latitude, lng: selectedLiveLog.longitude };
    }
    if (filteredLiveLogs.length > 0) {
      return {
        lat: filteredLiveLogs[0].latitude,
        lng: filteredLiveLogs[0].longitude,
      };
    }
    return { lat: 24.8607, lng: 67.0104 };
  }, [selectedLiveLog, filteredLiveLogs]);

  // Fleet Statistics
  const stats = useMemo(() => {
    const total = liveLogs.length;
    const moving = liveLogs.filter((l) => l.status === "MOVING").length;
    const stopped = liveLogs.filter(
      (l) => l.status === "STOPPED" || l.status === "DELAYED"
    ).length;
    const emergency = liveLogs.filter(
      (l) => l.status === "SOS" || l.status === "BREAKDOWN"
    ).length;
    const speeds = liveLogs.map((l) => l.speed || 0).filter((s) => s > 0);
    const avgSpeed =
      speeds.length > 0
        ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length)
        : 0;

    return { total, moving, stopped, emergency, avgSpeed };
  }, [liveLogs]);

  function getErrorMessage(error: unknown) {
    if (typeof error === "object" && error !== null && "response" in error) {
      const responseError = error as {
        response?: { data?: { message?: string } };
      };
      return responseError.response?.data?.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return undefined;
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Page Header with Telemetry Signal Beacon */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-emerald-700 border border-emerald-500/20">
              Satellite Radar Active
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Live Fleet Telemetry Radar
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-3xl">
            Enterprise GPS tracking, heading orientations, velocity telemetry,
            and real-time transit safety command center.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdminOrSecurity && (
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`rounded-xl border p-2.5 transition shadow-sm ${
                isMuted
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title={isMuted ? "Unmute alarm sound" : "Mute alarm sound"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              setError("");
              setMessage("");
              loadTelemetry();
            }}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 font-bold"
          >
            <RefreshCcw
              size={15}
              className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Sync Feeds
          </Button>
        </div>
      </div>

      {/* Critical SOS Alarm Banner */}
      {isAdminOrSecurity && emergencies.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-red-600 p-4 text-white shadow-xl shadow-red-600/20 border border-red-700 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white font-black">
              <BellRing size={22} className="animate-bounce" />
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base">
                CRITICAL FLEET ALARM: {emergencies.length} Active Emergency Event(s)!
              </p>
              <p className="text-xs text-red-100 mt-0.5">
                Immediate attention required. Captain flagged distress signal on
                commute routes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-200">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 border border-red-200">
          <XCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Top Telemetry KPI Metric Cards */}
      <div className="grid min-w-0 gap-3.5 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
              Total Monitored
            </span>
            <Truck size={17} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
          <span className="text-3xs font-semibold text-slate-400">Active Fleet</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700">
              Moving Live
            </span>
            <Activity size={17} className="text-emerald-600 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {stats.moving}
          </p>
          <span className="text-3xs font-semibold text-emerald-600">En Route</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
              Idle / Stopped
            </span>
            <Compass size={17} className="text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-700">{stats.stopped}</p>
          <span className="text-3xs font-semibold text-slate-400">At Waypoint</span>
        </div>

        <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-red-700">
              Emergencies
            </span>
            <AlertOctagon size={17} className="text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-700">
            {stats.emergency}
          </p>
          <span className="text-3xs font-semibold text-red-600">SOS / Breakdown</span>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-blue-700">
              Avg Speed
            </span>
            <Zap size={17} className="text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-800">
            {stats.avgSpeed} <span className="text-sm font-semibold">km/h</span>
          </p>
          <span className="text-3xs font-semibold text-blue-600">Transit Flow</span>
        </div>
      </div>

      {/* DRIVER SPECIALIZED BROADCASTING COCKPIT */}
      {isDriver && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Radio size={24} className={isSyncing ? "animate-ping" : ""} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Captain GPS Transmitter Cockpit
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-3xs font-extrabold uppercase ${
                      isSyncing
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isSyncing ? "Transmitting Live" : "Standby"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Stream your vehicle's live coordinates, compass orientation, and
                  speed to IndusConnect dispatchers and passengers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setIsSyncing(!isSyncing)}
                className={`font-bold text-xs ${
                  isSyncing
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isSyncing ? "Stop GPS Broadcast" : "Start Live GPS Broadcast"}
              </Button>

              <Link
                to="/driver-trips"
                className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition border border-white/20"
              >
                <span>Trip Manifest HUD</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {gpsLat && gpsLng && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
              <span>
                Lat: <strong className="text-white font-mono">{gpsLat.toFixed(5)}</strong>
              </span>
              <span>
                Lng: <strong className="text-white font-mono">{gpsLng.toFixed(5)}</strong>
              </span>
              <span>
                Pings Synced: <strong className="text-emerald-400">{gpsSyncedCount}</strong>
              </span>
            </div>
          )}
        </Card>
      )}

      {/* UNIFIED COMMAND CENTER STAGE (Desktop Split / Mobile Tabs) */}
      <div className="space-y-4">
        {/* Mobile View Tab Switcher (< lg) */}
        <div className="flex lg:hidden gap-1 p-1 rounded-2xl bg-slate-200/80 border border-slate-200">
          <button
            type="button"
            onClick={() => setMobileTab("map")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mobileTab === "map"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🗺️ Live Fleet Radar
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("list")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mobileTab === "list"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🚐 Active Roster ({filteredLiveLogs.length})
          </button>
        </div>

        {/* Command Center Main Grid */}
        <div className="grid gap-6 lg:grid-cols-12 min-w-0">
          {/* Main Interactive Map Radar (8 Cols on Desktop) */}
          <div
            className={`lg:col-span-8 min-w-0 ${
              mobileTab === "map" ? "block" : "hidden lg:block"
            }`}
          >
            {/* Filter & Search Bar Above Map */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3">
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter active vehicles, captains, routes..."
                  className="w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                {(
                  [
                    { key: "ALL", label: "All" },
                    { key: "MOVING", label: "Moving" },
                    { key: "STOPPED", label: "Idle" },
                    { key: "EMERGENCY", label: "SOS" },
                  ] as const
                ).map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setStatusFilter(filter.key)}
                    className={`rounded-lg px-2.5 py-1 text-2xs font-extrabold uppercase tracking-wider transition ${
                      statusFilter === filter.key
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white">

              {/* Floating Active Vehicle Inspector Card */}
              {selectedLiveLog && (
                <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
                  <div className="pointer-events-auto w-full max-w-xl rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-4 text-white shadow-2xl animate-fadeIn">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Truck size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-white">
                              {selectedLiveLog.vehicle?.vehicleNumber || "Active Vehicle"}
                            </h4>
                            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-3xs font-extrabold text-emerald-400 uppercase">
                              {selectedLiveLog.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Captain: <strong className="text-slate-200">{selectedLiveLog.driver?.user.fullName}</strong> • Route: <strong className="text-slate-200">{selectedLiveLog.route?.routeName}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLiveLog(null)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <XCircle size={17} />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-800 pt-3 text-center text-xs">
                      <div className="rounded-xl bg-slate-800/80 p-2">
                        <span className="text-3xs uppercase text-slate-400 block font-bold">Speed</span>
                        <span className="font-extrabold text-white mt-0.5 block">{selectedLiveLog.speed || 0} km/h</span>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-2">
                        <span className="text-3xs uppercase text-slate-400 block font-bold">Heading</span>
                        <span className="font-extrabold text-white mt-0.5 block">{selectedLiveLog.heading || 0}°</span>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-2">
                        <span className="text-3xs uppercase text-slate-400 block font-bold">Battery</span>
                        <span className="font-extrabold text-emerald-400 mt-0.5 block">{selectedLiveLog.batteryLevel || 100}%</span>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-2">
                        <span className="text-3xs uppercase text-slate-400 block font-bold">Updated</span>
                        <span className="font-mono text-3xs text-slate-300 mt-1 block">
                          {new Date(selectedLiveLog.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Maps Real-Time Monitoring Stage */}
              <MapView
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                readOnly={true}
                hideMainPin={true}
                followCenter={Boolean(selectedLiveLog)}
                markers={telemetryMapMarkers}
                height="620px"
                zoom={13}
                enableFullscreenToggle={true}
                enableLayerSwitcher={true}
                enableGPS={true}
                enableSearch={false}
                enablePresets={false}
                defaultLayer="roadmap"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Interactive Fleet Roster Side-Panel (4 Cols on Desktop) */}
          <div
            className={`lg:col-span-4 min-w-0 ${
              mobileTab === "list" ? "block" : "hidden lg:block"
            }`}
          >
            <Card className="flex flex-col h-[560px] p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-blue-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Fleet Roster
                  </h3>
                </div>
                <span className="rounded-full bg-blue-100/70 text-blue-800 px-2.5 py-0.5 text-xs font-bold font-mono">
                  {filteredLiveLogs.length} online
                </span>
              </div>

              {/* Roster Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                {filteredLiveLogs.map((log) => {
                  const isSelected = selectedLiveLog?.id === log.id;
                  const isEmergency =
                    log.status === "SOS" || log.status === "BREAKDOWN";

                  return (
                    <div
                      key={log.id}
                      onClick={() => {
                        setSelectedLiveLog(log);
                        setMobileTab("map");
                      }}
                      className={`rounded-2xl border p-3.5 cursor-pointer transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/40 shadow-sm"
                          : isEmergency
                          ? "border-red-300 bg-red-50/30"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-slate-900 truncate">
                            {log.vehicle?.vehicleNumber || "ACTIVE DEVICE"}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {log.driver?.user.fullName || "Captain"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-3xs font-extrabold uppercase ${
                            log.status === "MOVING"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isEmergency
                              ? "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-2xs text-slate-500 font-semibold border-t border-slate-100 pt-2">
                        <span className="flex items-center gap-1">
                          <BatteryCharging size={13} className="text-slate-400" />
                          {log.batteryLevel ?? 100}%
                        </span>
                        <span>{log.speed || 0} km/h</span>
                        <span className="text-blue-700 font-bold hover:underline">
                          Locate on Map →
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredLiveLogs.length === 0 && (
                  <div className="py-20 text-center text-slate-400 italic text-sm">
                    No vehicles match current filter criteria.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Incident Emergency Audit & Chronological Route Trails */}
      <div className="grid gap-6 md:grid-cols-2 min-w-0">
        {/* Emergency Log */}
        <Card className="flex flex-col h-[380px] p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-50/40">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-red-700">
              <AlertOctagon size={18} /> Emergency Incident Audit Log
            </h3>
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-bold font-mono">
              {emergencies.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 scrollbar-thin">
            {emergencies.map((event, idx) => (
              <div
                key={event.id}
                className={idx === 0 ? "pt-0" : "pt-3 border-t border-slate-100"}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {event.vehicle?.vehicleNumber || "Fleet Vehicle"} • {event.status}
                  </span>
                  <span className="text-3xs text-slate-400 font-mono">
                    {new Date(event.recordedAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Captain {event.driver?.user.fullName}: "{event.remarks || "No details provided"}"
                </p>
                <p className="text-3xs text-slate-400 font-mono mt-0.5">
                  GPS: {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                </p>
              </div>
            ))}

            {emergencies.length === 0 && (
              <div className="py-24 text-center text-slate-400 italic text-xs">
                No active SOS or breakdowns registered.
              </div>
            )}
          </div>
        </Card>

        {/* Chronological Route Trails */}
        <Card className="flex flex-col h-[380px] p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History size={18} className="text-slate-600" /> Chronological Route Trails
            </h3>
            <div className="mt-2.5">
              <select
                value={selectedRouteId}
                onChange={(e) => handleRouteChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
              >
                <option value="">Choose route to inspect tracking points...</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.routeName} ({r.routeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 scrollbar-thin">
            {routeHistory.map((hist, idx) => (
              <div
                key={hist.id}
                className={`flex justify-between text-xs text-slate-600 ${
                  idx === 0 ? "pt-0" : "pt-2.5 border-t border-slate-100"
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-800">
                    Ping #{routeHistory.length - idx} • {hist.speed || 0} km/h
                  </span>
                  <span className="block text-3xs text-slate-400 font-mono mt-0.5">
                    {hist.latitude.toFixed(5)}, {hist.longitude.toFixed(5)}
                  </span>
                </div>
                <span className="text-3xs text-slate-400 font-mono">
                  {new Date(hist.recordedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}

            {selectedRouteId && routeHistory.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic text-xs">
                No coordinates recorded for this route yet.
              </div>
            )}

            {!selectedRouteId && (
              <div className="py-20 text-center text-slate-400 italic text-xs">
                Select a route above to review chronological coordinate breadcrumbs.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
