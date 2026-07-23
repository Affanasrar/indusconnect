import { useEffect, useMemo, useState, useRef } from "react";
import {
  RefreshCcw,
  AlertOctagon,
  BatteryCharging,
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
import type { VehicleTelemetryLog, TelemetryStatus } from "../types/telemetry";
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

  const [isSyncing, setIsSyncing] = useState(false);
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsSyncedCount, setGpsSyncedCount] = useState(0);

  async function syncGPSCoordinates(lat: number, lng: number, status: TelemetryStatus = "MOVING", remarks?: string) {
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

  useEffect(() => {
    if (isSyncing) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setGpsLat(lat);
            setGpsLng(lng);
            syncGPSCoordinates(lat, lng);
          },
          (err) => console.error(err)
        );

        const id = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setGpsLat(lat);
              setGpsLng(lng);
              syncGPSCoordinates(lat, lng);
            },
            (err) => console.error(err)
          );
        }, 10000);

        return () => clearInterval(id);
      } else {
        setError("HTML5 Geolocation is not supported by your browser");
        setIsSyncing(false);
      }
    }
  }, [isSyncing]);

  // Selected active log details
  const [selectedLiveLog, setSelectedLiveLog] = useState<VehicleTelemetryLog | null>(null);

  // UI state
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Audio warning ref for pulsing emergencies
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load telemetry logs
  async function loadTelemetry() {
    try {
      setIsLoading(true);
      setError("");
      
      if (isDriver) {
        const myLogs = await getMyTelemetryLogs();
        if (myLogs.length > 0) {
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

  // Synthesize warning beep for emergency alarms
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
        /* DRIVER LIVE GPS SYNCS PANEL */
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Truck className="text-blue-700" size={18} /> Driver Telemetry Console
              </span>
              {isSyncing && (
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
            </h2>

            {liveLogs.length > 0 && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 space-y-2.5 text-xs text-slate-600 font-semibold">
                <p><strong>Assigned Route:</strong> {liveLogs[0].route?.routeName || "General Route"}</p>
                <p><strong>Route Code:</strong> <span className="font-mono bg-white px-2 py-0.5 border border-slate-200 rounded text-2xs">{liveLogs[0].route?.routeCode || "-"}</span></p>
                <p><strong>Assigned Vehicle:</strong> {liveLogs[0].vehicle?.vehicleNumber || "Unknown"}</p>
              </div>
            )}

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    GPS Tracking status
                  </p>
                  <p className="text-xs font-extrabold text-slate-700 mt-1">
                    {isSyncing ? "🔵 Live Tracking Active" : "⚪ Off (Standby)"}
                  </p>
                </div>
                <Button
                  onClick={() => setIsSyncing(!isSyncing)}
                  className={isSyncing ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                >
                  {isSyncing ? "Stop GPS Sync" : "Start GPS Sync"}
                </Button>
              </div>

              {gpsLat && gpsLng && (
                <div className="pt-2.5 border-t border-blue-100/50 text-xs font-semibold text-slate-700 space-y-1.5">
                  <p>Current Latitude: <span className="font-mono text-blue-700">{gpsLat.toFixed(5)}</span></p>
                  <p>Current Longitude: <span className="font-mono text-blue-700">{gpsLng.toFixed(5)}</span></p>
                  <p>Synced Coordinates: <span className="text-blue-700 font-bold">{gpsSyncedCount} pings</span></p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Report Incident location
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (gpsLat && gpsLng) {
                      syncGPSCoordinates(gpsLat, gpsLng, "SOS", "EMERGENCY: Driver flagged immediate safety SOS!");
                      setMessage("SOS emergency alert flagged to central dispatch!");
                    } else {
                      setError("Cannot send SOS: Waiting for GPS lock. Turn on GPS Sync first.");
                    }
                  }}
                  className="flex-1 text-xs"
                  disabled={!isSyncing}
                >
                  Send emergency SOS
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (gpsLat && gpsLng) {
                      syncGPSCoordinates(gpsLat, gpsLng, "BREAKDOWN", "VEHICLE FAILURE: Driver reported breakdown.");
                      setMessage("Vehicle failure breakdown flagged to central dispatch.");
                    } else {
                      setError("Cannot send Breakdown: Turn on GPS Sync first.");
                    }
                  }}
                  className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
                  disabled={!isSyncing}
                >
                  Report Breakdown
                </Button>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col min-h-[350px]">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2 mb-4">
              <Map className="text-blue-700" size={18} /> Live Location Map
            </h2>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 flex-1 min-h-[280px]">
              <MapView
                latitude={gpsLat ?? 24.8607}
                longitude={gpsLng ?? 67.0104}
                readOnly={true}
                markers={
                  gpsLat && gpsLng
                    ? [
                        {
                          latitude: gpsLat,
                          longitude: gpsLng,
                          label: "Your current live location",
                          color: "bg-blue-600 animate-pulse scale-110",
                          pulse: true,
                        },
                      ]
                    : []
                }
                height="100%"
              />
            </div>
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
                    const isSelected = selectedLiveLog?.id === log.id;
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
                        onClick={() => setSelectedLiveLog(log)}
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
                            <span className="font-extrabold text-slate-800">{log.vehicle?.vehicleNumber || "ACTIVE DEVICE"}</span>
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

          {/* Active vehicle details drawer */}
          {selectedLiveLog && (
            <Card className="border-blue-200 bg-blue-50/5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Device Monitor: {selectedLiveLog.vehicle?.vehicleNumber || "ACTIVE DEVICE"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Operating on route: <strong>{selectedLiveLog.route?.routeName}</strong> • Driver:{" "}
                    <strong>{selectedLiveLog.driver?.user.fullName}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLiveLog(null)}
                  className="rounded text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear Selection
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm text-slate-700">
                <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Coordinates</span>
                  <span className="font-mono font-bold text-slate-850 mt-1 block">
                    {selectedLiveLog.latitude.toFixed(5)}, {selectedLiveLog.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Velocity & Heading</span>
                  <span className="font-bold text-slate-850 mt-1 block">
                    {selectedLiveLog.speed ?? 0} km/h • {selectedLiveLog.heading ?? 0}°
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Source & Status</span>
                  <span className="font-bold text-slate-850 mt-1 block">
                    {selectedLiveLog.source} • {selectedLiveLog.status}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Last Sync Ping</span>
                  <span className="font-bold text-slate-850 mt-1 block">
                    {new Date(selectedLiveLog.recordedAt).toLocaleTimeString()}
                  </span>
                </div>
                {selectedLiveLog.remarks && (
                  <div className="col-span-full bg-white p-3 rounded-xl border border-slate-200/50 text-xs italic text-slate-600">
                    <strong>Status Remarks:</strong> "{selectedLiveLog.remarks}"
                  </div>
                )}
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
                        {event.vehicle?.vehicleNumber || "ACTIVE VEHICLE"} • {event.status}
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
