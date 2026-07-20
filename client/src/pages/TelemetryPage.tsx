import { useEffect, useMemo, useState, useRef } from "react";
import type { FormEvent } from "react";
import {
  RefreshCcw,
  AlertOctagon,
  BatteryCharging,
  Compass,
  CheckCircle,
  XCircle,
  Truck,
  Activity,
  Map,
  History,
  BellRing,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MapView from "../components/ui/MapView";
import {
  createTelemetryLog,
  getLiveLocations,
  getEmergencyTelemetryEvents,
  getTelemetryByRoute,
  getMyTelemetryLogs,
} from "../api/telemetry";
import { getRoutes } from "../api/routes";
import type { VehicleTelemetryLog, TelemetryStatus, TelemetrySource } from "../types/telemetry";
import type { TransportRoute } from "../types/transport";

// Campuses/smart stops coordinates for drawing visual SVG map scaling
const MAP_LANDMARKS = [
  { name: "Garden West Stop", lat: 24.8765, lng: 67.0321, color: "#3b82f6" },
  { name: "Saddar Stop", lat: 24.8607, lng: 67.0104, color: "#a855f7" },
  { name: "Korangi Campus Gate", lat: 24.8138, lng: 67.1209, color: "#10b981" },
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

  // Simulation controls
  const [selectedSimulatorLog, setSelectedSimulatorLog] = useState<VehicleTelemetryLog | null>(null);
  
  // Mock form state
  const [mockLat, setMockLat] = useState("24.8765");
  const [mockLng, setMockLng] = useState("67.0321");
  const [mockSpeed, setMockSpeed] = useState("40");
  const [mockHeading, setMockHeading] = useState("90");
  const [mockStatus, setMockStatus] = useState<TelemetryStatus>("MOVING");
  const [mockBattery, setMockBattery] = useState("80");
  const [mockRemarks, setMockRemarks] = useState("");

  // UI state
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Audio simulation ref for pulsing emergencies
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load telemetry logs
  async function loadTelemetry() {
    try {
      setIsLoading(true);
      setError("");
      
      if (isDriver) {
        const myLogs = await getMyTelemetryLogs();
        // Construct a mock default location if driver has no logs yet
        if (myLogs.length > 0) {
          setLiveLogs(myLogs);
          setMockLat(myLogs[0].latitude.toString());
          setMockLng(myLogs[0].longitude.toString());
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
    
    // Auto-refresh telemetry every 10 seconds for real-time monitoring feel
    const interval = setInterval(() => {
      if (!isDriver) {
        silentRefresh();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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

  // Handle telemetry update submit
  async function handleSendTelemetry(e?: FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const latVal = parseFloat(mockLat);
      const lngVal = parseFloat(mockLng);
      const speedVal = parseFloat(mockSpeed);
      const headingVal = parseFloat(mockHeading);
      const batteryVal = parseInt(mockBattery);

      if (isNaN(latVal) || isNaN(lngVal)) {
        throw new Error("Latitude and Longitude must be valid decimal coordinates");
      }

      // If updating from driver view, route info is fetched from their active assignment in the backend
      const input = {
        routeId: !isDriver ? selectedSimulatorLog?.routeId || undefined : undefined,
        vehicleId: !isDriver ? selectedSimulatorLog?.vehicleId || undefined : undefined,
        latitude: latVal,
        longitude: lngVal,
        speed: isNaN(speedVal) ? undefined : speedVal,
        heading: isNaN(headingVal) ? undefined : headingVal,
        status: mockStatus,
        source: "MOCK_GPS" as TelemetrySource,
        batteryLevel: isNaN(batteryVal) ? undefined : batteryVal,
        remarks: mockRemarks.trim() || undefined,
      };

      await createTelemetryLog(input);
      setMessage("Telemetry data pinged successfully");
      
      // Auto increment coordinates slightly to simulate path motion
      setMockLat((latVal + 0.001 * Math.cos((headingVal * Math.PI) / 180)).toFixed(5));
      setMockLng((lngVal + 0.001 * Math.sin((headingVal * Math.PI) / 180)).toFixed(5));
      setMockRemarks("");

      await loadTelemetry();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to send telemetry update");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Mock preset selections
  function applyPreset(preset: "MOVING" | "SOS" | "BREAKDOWN" | "STOPPED") {
    setMockStatus(preset);
    if (preset === "SOS") {
      setMockRemarks("EMERGENCY: Driver requesting immediate medical/security assistance!");
      setMockSpeed("0");
      triggerBeepAlert();
    } else if (preset === "BREAKDOWN") {
      setMockRemarks("VEHICLE FAILURE: Engine overheating, smoke from radiator.");
      setMockSpeed("0");
      triggerBeepAlert();
    } else if (preset === "STOPPED") {
      setMockRemarks("Shuttle stopped at smart stop waiting for boarding passengers.");
      setMockSpeed("0");
    } else {
      setMockRemarks("Shuttle in motion. Route traffic is normal.");
      setMockSpeed("45");
    }
  }

  // Synthesize warning beep for emergency drills
  function triggerBeepAlert() {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note alarm pitch
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio Context beep initialization blocked by browser autoplay policy.");
    }
  }

  // Monitor logs for play trigger on SOS
  useEffect(() => {
    const hasEmergency = liveLogs.some((l) => l.status === "SOS" || l.status === "BREAKDOWN");
    if (hasEmergency) {
      triggerBeepAlert();
    }
  }, [liveLogs]);

  const telemetryMapMarkers = useMemo(() => {
    const list: any[] = [];
    
    // Add default landmarks
    MAP_LANDMARKS.forEach((l) => {
      list.push({
        latitude: l.lat,
        longitude: l.lng,
        label: `${l.name} (Campus Landmark)`,
        color: "bg-blue-600",
      });
    });

    // Add active live vehicles
    liveLogs.forEach((log) => {
      const isEmergency = log.status === "SOS" || log.status === "BREAKDOWN";
      const markerColor =
        log.status === "SOS"
          ? "bg-red-600"
          : log.status === "BREAKDOWN"
          ? "bg-amber-600"
          : log.status === "STOPPED"
          ? "bg-slate-600"
          : "bg-emerald-600";

      list.push({
        latitude: log.latitude,
        longitude: log.longitude,
        label: `Vehicle ${log.vehicle?.vehicleNumber || "MOCK"} - Status: ${log.status} (Driver: ${log.driver?.user.fullName || "N/A"})`,
        color: markerColor,
        pulse: isEmergency,
      });
    });

    return list;
  }, [liveLogs]);





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

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Live Telemetry Command Center
          </h1>
          <p className="text-sm text-slate-500">
            Track active employee transport routes, monitor GPS coordinates, and resolve emergency telemetry alerts.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdminOrSecurity && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`rounded-xl border p-2.5 transition ${
                isMuted ? "bg-red-50 text-red-700 border-red-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
            className="rounded-xl border border-slate-200"
          >
            <RefreshCcw size={16} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Sync Feeds
          </Button>
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

      {/* Emergency pulsing banner for Admin / Security */}
      {isAdminOrSecurity && liveLogs.some((l) => l.status === "SOS") && (
        <div className="flex items-center justify-between rounded-2xl bg-red-600 p-4 text-white shadow-lg border border-red-700 animate-pulse">
          <div className="flex items-center gap-3">
            <BellRing size={24} className="shrink-0" />
            <div>
              <p className="font-extrabold text-sm sm:text-base">CRITICAL ALARM: Active Driver SOS Triggered!</p>
              <p className="text-xs text-red-100 mt-0.5">Please consult the Emergency Logs registry below to assign maintenance or dispatch security dispatchers.</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCcw size={40} className="animate-spin text-blue-700" />
          <p className="mt-4 text-sm font-medium">Loading telemetry dashboard...</p>
        </div>
      ) : isDriver ? (
        /* DRIVER SIMULATION PAGE */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Driver Simulation details */}
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Truck className="text-blue-700" size={18} /> Driver Telemetry Dashboard
            </h2>

            {liveLogs.length > 0 ? (
              <div className="space-y-3.5 text-sm text-slate-700">
                <p>
                  <strong>Active Route:</strong> {liveLogs[0].route?.routeName || "General Route"}
                </p>
                <p>
                  <strong>Route Code:</strong>{" "}
                  <span className="font-mono bg-slate-50 px-2 py-1 rounded text-xs">
                    {liveLogs[0].route?.routeCode || "-"}
                  </span>
                </p>
                <p>
                  <strong>Assigned Vehicle:</strong> {liveLogs[0].vehicle?.vehicleNumber || "Unknown"}
                </p>
                <p className="flex items-center gap-1.5">
                  <strong>Last Status:</strong>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      liveLogs[0].status === "SOS"
                        ? "bg-red-100 text-red-800"
                        : liveLogs[0].status === "BREAKDOWN"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {liveLogs[0].status}
                  </span>
                </p>
                <p>
                  <strong>Telemetry Source:</strong>{" "}
                  <span className="text-slate-500 font-semibold">{liveLogs[0].source}</span>
                </p>
                <p>
                  <strong>Last Ping:</strong> {new Date(liveLogs[0].recordedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-slate-500 text-sm">No telemetry records registered yet for your profile.</p>
                <p className="text-slate-400 text-xs mt-1">Use the simulator form to log your first coordinates.</p>
              </div>
            )}
          </Card>

          {/* Telemetry Simulator Form */}
          <Card>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Compass className="text-blue-700" size={18} /> GPS Coordinate Simulator
            </h2>

            <form onSubmit={handleSendTelemetry} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Latitude (mock)
                  </label>
                  <input
                    type="text"
                    required
                    value={mockLat}
                    onChange={(e) => setMockLat(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Longitude (mock)
                  </label>
                  <input
                    type="text"
                    required
                    value={mockLng}
                    onChange={(e) => setMockLng(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Speed (km/h)
                  </label>
                  <input
                    type="number"
                    value={mockSpeed}
                    onChange={(e) => setMockSpeed(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Heading (degrees)
                  </label>
                  <input
                    type="number"
                    value={mockHeading}
                    onChange={(e) => setMockHeading(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Telemetry Status
                  </label>
                  <select
                    value={mockStatus}
                    onChange={(e) => setMockStatus(e.target.value as TelemetryStatus)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="MOVING">Moving</option>
                    <option value="STOPPED">Stopped</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="BREAKDOWN">Breakdown</option>
                    <option value="SOS">SOS (EMERGENCY)</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Battery Level (%)
                  </label>
                  <input
                    type="number"
                    value={mockBattery}
                    onChange={(e) => setMockBattery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* Status presets shortcuts */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick status presets
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("MOVING")}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100 hover:bg-blue-100"
                  >
                    Set Normal Driving
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("STOPPED")}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-200"
                  >
                    Set Stop Boarding
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("BREAKDOWN")}
                    className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-100 hover:bg-amber-100"
                  >
                    Trigger Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("SOS")}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-100 hover:bg-red-100"
                  >
                    Trigger SOS Alert
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Telemetry Remarks / Incident Details
                </label>
                <textarea
                  value={mockRemarks}
                  onChange={(e) => setMockRemarks(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Provide details about breakdowns, route traffic delay status, or SOS causes..."
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="rounded-xl px-6">
                  {isSubmitting ? "Ping GPS..." : "Ping Coordinates Update"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        /* ADMINISTRATOR COMMAND CENTER VIEW */
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Visual Tracking Map (SVG plotting coordinates dynamically) */}
            <div className="xl:col-span-2 space-y-4">
              <Card className="flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                    <Map className="text-blue-700" size={18} /> Spatial Route Telemetry Mapper
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Karachi Metro Boundaries scaled to SVG canvas</span>
                </div>

                <div className="relative border border-slate-200 rounded-2xl overflow-hidden p-1 bg-white z-10">
                  <MapView
                    latitude={24.8607}
                    longitude={67.0104}
                    readOnly={true}
                    markers={telemetryMapMarkers}
                    height="420px"
                    zoom={12}
                  />
                </div>
              </Card>
            </div>

            {/* List of active locations sidebar */}
            <div className="space-y-4">
              <Card className="max-h-[500px] overflow-y-auto flex flex-col justify-between">
                <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                    <Activity className="text-blue-700" size={18} /> Active Fleet Locations
                  </h3>
                  <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-bold font-mono">
                    {liveLogs.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {liveLogs.map((log) => {
                    const isSelected = selectedSimulatorLog?.id === log.id;
                    const isEmergency = log.status === "SOS" || log.status === "BREAKDOWN";

                    const statusColors = {
                      MOVING: "bg-emerald-50 text-emerald-700 border-emerald-100",
                      STOPPED: "bg-slate-100 text-slate-600 border-slate-200",
                      DELAYED: "bg-amber-50 text-amber-700 border-amber-100",
                      BREAKDOWN: "bg-amber-50 text-amber-700 border-amber-200 border-dashed animate-pulse",
                      SOS: "bg-red-50 text-red-700 border-red-200 border-dashed animate-pulse",
                      OFFLINE: "bg-slate-200 text-slate-700 border-slate-300",
                    };

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedSimulatorLog(log)}
                        className={`rounded-xl border p-3 cursor-pointer transition hover:border-blue-400 ${
                          isSelected
                            ? "border-blue-700 bg-blue-50/20"
                            : isEmergency
                            ? "border-red-400 bg-red-50/10"
                            : "border-slate-100 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="font-extrabold text-slate-800">{log.vehicle?.vehicleNumber || "MOCK DEVICE"}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                              {log.driver?.user.fullName}
                            </span>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              statusColors[log.status]
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-0.5">
                            <BatteryCharging size={13} className="text-slate-400" />
                            {log.batteryLevel ?? "-"}%
                          </span>
                          <span>{log.speed ?? 0} km/h</span>
                          <span className="font-mono text-[9px] text-slate-400">
                            {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {liveLogs.length === 0 && (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                      No vehicles are currently operating.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Admin simulator controls overlay (Selected vehicle details drawer) */}
          {selectedSimulatorLog && (
            <Card className="border-blue-200 bg-blue-50/5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Device Control: {selectedSimulatorLog.vehicle?.vehicleNumber || "MOCK DEVICE"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Operating on route: <strong>{selectedSimulatorLog.route?.routeName}</strong> • Driver:{" "}
                    <strong>{selectedSimulatorLog.driver?.user.fullName}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSimulatorLog(null)}
                  className="rounded text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear Selection
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Visual state summary */}
                <div className="space-y-3.5 text-sm text-slate-700">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device telemetry readings</h4>
                  <p>
                    <strong>Coordinates:</strong> {selectedSimulatorLog.latitude.toFixed(5)}, {selectedSimulatorLog.longitude.toFixed(5)}
                  </p>
                  <p>
                    <strong>Velocity:</strong> {selectedSimulatorLog.speed ?? 0} km/h • <strong>Heading:</strong> {selectedSimulatorLog.heading ?? 0}°
                  </p>
                  <p>
                    <strong>Battery level:</strong> {selectedSimulatorLog.batteryLevel ?? "-"}% • <strong>GPS Source:</strong> {selectedSimulatorLog.source}
                  </p>
                  {selectedSimulatorLog.remarks && (
                    <p className="text-xs italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                      <strong>Remarks:</strong> "{selectedSimulatorLog.remarks}"
                    </p>
                  )}
                </div>

                {/* Mock telemetry coordinates form directly on behalf of driver */}
                <div className="md:col-span-2 border-t border-slate-200 pt-4 md:border-t-0 md:pt-0 md:pl-6 md:border-l space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={14} /> Mock GPS Controller on behalf of Driver
                  </h4>

                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lat</label>
                      <input
                        type="text"
                        value={mockLat}
                        onChange={(e) => setMockLat(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lng</label>
                      <input
                        type="text"
                        value={mockLng}
                        onChange={(e) => setMockLng(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Speed</label>
                      <input
                        type="number"
                        value={mockSpeed}
                        onChange={(e) => setMockSpeed(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Heading</label>
                      <input
                        type="number"
                        value={mockHeading}
                        onChange={(e) => setMockHeading(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex gap-2">
                      <select
                        value={mockStatus}
                        onChange={(e) => setMockStatus(e.target.value as TelemetryStatus)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
                      >
                        <option value="MOVING">Moving</option>
                        <option value="STOPPED">Stopped</option>
                        <option value="DELAYED">Delayed</option>
                        <option value="BREAKDOWN">Breakdown</option>
                        <option value="SOS">SOS (EMERGENCY)</option>
                        <option value="OFFLINE">Offline</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => applyPreset("MOVING")}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1.5 rounded hover:bg-blue-100"
                      >
                        Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("BREAKDOWN")}
                        className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1.5 rounded hover:bg-amber-100"
                      >
                        Breakdown
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("SOS")}
                        className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1.5 rounded hover:bg-red-100"
                      >
                        SOS
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => handleSendTelemetry()}
                      disabled={isSubmitting}
                      className="rounded-xl text-xs py-1.5 px-4"
                    >
                      Ping Update
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Emergency registry log trail */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col justify-between max-h-[350px] overflow-y-auto">
              <div className="border-b border-slate-100 pb-2.5 mb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-1.5 text-red-600">
                  <AlertOctagon size={18} /> Incident Emergency Audit log
                </h3>
                <span className="rounded bg-red-50 text-red-600 px-2 py-0.5 text-xs font-bold font-mono">
                  {emergencies.length}
                </span>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                {emergencies.map((event, idx) => (
                  <div key={event.id} className={`pt-3 ${idx === 0 ? "pt-0 border-t-0" : "border-t border-slate-100"}`}>
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {event.vehicle?.vehicleNumber || "MOCK VEHICLE"} • {event.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(event.recordedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                      Driver {event.driver?.user.fullName} reported status: "{event.remarks || "No comments log"}"
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Coordinates: {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                    </p>
                  </div>
                ))}

                {emergencies.length === 0 && (
                  <div className="py-12 text-center text-slate-400 italic text-xs">
                    No active SOS or breakdowns registered.
                  </div>
                )}
              </div>
            </Card>

            {/* Route history trail selector */}
            <Card className="flex flex-col justify-between max-h-[350px] overflow-y-auto">
              <div className="border-b border-slate-100 pb-2.5 mb-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                  <History className="text-slate-600" size={18} /> Chronological Route Trails
                </h3>
              </div>

              <div className="mb-3">
                <select
                  value={selectedRouteId}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
                >
                  <option value="">Select route to fetch tracking trail...</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} ({r.routeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3.5 divide-y divide-slate-100 overflow-y-auto pr-1">
                {routeHistory.map((hist, idx) => (
                  <div key={hist.id} className={`pt-3 flex justify-between text-xs text-slate-600 ${idx === 0 ? "pt-0 border-t-0" : ""}`}>
                    <div>
                      <span className="font-semibold text-slate-700">GPS Ping #{routeHistory.length - idx}</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {hist.latitude.toFixed(5)}, {hist.longitude.toFixed(5)} • Speed: {hist.speed || 0} km/h
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(hist.recordedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}

                {selectedRouteId && routeHistory.length === 0 && (
                  <div className="py-12 text-center text-slate-400 italic text-xs">
                    No coordinates tracked for this route.
                  </div>
                )}

                {!selectedRouteId && (
                  <div className="py-12 text-center text-slate-400 italic text-xs">
                    Choose a route from the dropdown to check location points.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
