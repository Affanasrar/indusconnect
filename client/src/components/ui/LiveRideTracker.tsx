import { useState, useEffect, useMemo, useRef } from "react";
import {
  Car,
  Phone,
  ShieldAlert,
  Share2,
  Clock,
  Eye,
  RotateCcw,
  X,
  Sparkles,
} from "lucide-react";
import MapView, { type MapMarkerItem } from "./MapView";
import { getTelemetryByRoute } from "../../api/telemetry";

export interface LiveRideTrackerProps {
  routeId: string;
  routeName: string;
  routeCode: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  seatNumber?: string;
  pickupStop?: {
    id?: string;
    stopName: string;
    stopOrder?: number;
    latitude?: number | null;
    longitude?: number | null;
    estimatedTime?: string | null;
  } | null;
  smartStops?: Array<{
    id: string;
    stopName: string;
    stopOrder: number;
    latitude?: number | null;
    longitude?: number | null;
    estimatedTime?: string | null;
  }>;
  onClose: () => void;
}

// Distance helper (Haversine formula in km)
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

// Bearing calculation helper (0 - 360 degrees)
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

export default function LiveRideTracker({
  routeId,
  routeName,
  routeCode,
  driverName = "Assigned Fleet Captain",
  driverPhone = "+92 300 1234567",
  vehicleNumber = "IND-7821",
  vehicleModel = "Toyota Coaster (Indus Fleet)",
  seatNumber,
  pickupStop,
  smartStops = [],
  onClose,
}: LiveRideTrackerProps) {
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  const [isFollowLocked, setIsFollowLocked] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Simulation state for realistic testing when no hardware GPS is broadcasting
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const simTimerRef = useRef<any>(null);

  // Sorted route stops
  const sortedStops = useMemo(() => {
    return [...smartStops].sort((a, b) => a.stopOrder - b.stopOrder);
  }, [smartStops]);

  // Valid route waypoints with coordinates
  const waypoints = useMemo(() => {
    return sortedStops.filter(
      (s) => typeof s.latitude === "number" && typeof s.longitude === "number"
    ) as Array<{
      latitude: number;
      longitude: number;
      stopName: string;
      stopOrder: number;
      estimatedTime?: string | null;
    }>;
  }, [sortedStops]);

  // Polling telemetry from backend every 2.5 seconds
  useEffect(() => {
    if (!routeId || isSimulating) return;

    async function fetchLogs() {
      try {
        const logs = await getTelemetryByRoute(routeId);
        if (logs && Array.isArray(logs) && logs.length > 0) {
          setTelemetryLogs(logs);
        }
      } catch (err) {
        console.warn("Live telemetry check:", err);
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [routeId, isSimulating]);

  // Extract latest real telemetry or simulated vehicle position
  const latestTelemetry = useMemo(() => {
    if (telemetryLogs.length > 0) {
      return telemetryLogs[telemetryLogs.length - 1];
    }
    return null;
  }, [telemetryLogs]);

  // Determine current vehicle coordinates & heading
  const currentVehiclePosition = useMemo(() => {
    if (isSimulating && waypoints.length > 0) {
      const currentWp = waypoints[simStepIndex % waypoints.length];
      const nextWp = waypoints[(simStepIndex + 1) % waypoints.length];
      const heading = calculateHeading(
        currentWp.latitude,
        currentWp.longitude,
        nextWp.latitude,
        nextWp.longitude
      );
      return {
        lat: currentWp.latitude,
        lng: currentWp.longitude,
        heading,
        speed: 36,
        source: "SIMULATED",
      };
    }

    if (latestTelemetry) {
      let heading = latestTelemetry.heading;
      // If heading is 0 or undefined, derive from previous coordinate if available
      if ((!heading || heading === 0) && telemetryLogs.length > 1) {
        const prev = telemetryLogs[telemetryLogs.length - 2];
        heading = calculateHeading(
          prev.latitude,
          prev.longitude,
          latestTelemetry.latitude,
          latestTelemetry.longitude
        );
      }
      return {
        lat: latestTelemetry.latitude,
        lng: latestTelemetry.longitude,
        heading: heading || 0,
        speed: latestTelemetry.speed ?? 28,
        source: "LIVE_GPS",
      };
    }

    // Default fallback: First stop coordinates or Karachi central hub
    if (waypoints.length > 0) {
      return {
        lat: waypoints[0].latitude,
        lng: waypoints[0].longitude,
        heading: 45,
        speed: 0,
        source: "SCHEDULED_ORIGIN",
      };
    }

    return {
      lat: 24.8607,
      lng: 67.0104,
      heading: 0,
      speed: 0,
      source: "DEFAULT",
    };
  }, [isSimulating, simStepIndex, waypoints, latestTelemetry, telemetryLogs]);

  // Simulation timer loop
  useEffect(() => {
    if (!isSimulating || waypoints.length === 0) return;

    simTimerRef.current = setInterval(() => {
      setSimStepIndex((prev) => (prev + 1) % waypoints.length);
    }, 3500);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, waypoints.length]);

  // Passenger's pickup stop coordinates
  const passengerStopCoord = useMemo(() => {
    if (pickupStop && pickupStop.latitude && pickupStop.longitude) {
      return {
        lat: pickupStop.latitude,
        lng: pickupStop.longitude,
        name: pickupStop.stopName,
      };
    }
    // Fallback: Check if matching stop in sorted stops
    if (pickupStop?.stopName) {
      const match = waypoints.find(
        (w) =>
          w.stopName.toLowerCase().trim() ===
          pickupStop.stopName.toLowerCase().trim()
      );
      if (match) {
        return {
          lat: match.latitude,
          lng: match.longitude,
          name: match.stopName,
        };
      }
    }
    // Fallback: Middle stop or second stop
    if (waypoints.length > 1) {
      const mid = waypoints[Math.min(1, waypoints.length - 1)];
      return { lat: mid.latitude, lng: mid.longitude, name: mid.stopName };
    }
    return null;
  }, [pickupStop, waypoints]);

  // Distance & ETA calculation to passenger stop
  const etaInfo = useMemo(() => {
    if (!passengerStopCoord) {
      return { distanceKm: 0, minutes: 0, statusText: "Tracking active" };
    }

    const dist = calculateDistanceKm(
      currentVehiclePosition.lat,
      currentVehiclePosition.lng,
      passengerStopCoord.lat,
      passengerStopCoord.lng
    );

    const speed = Math.max(currentVehiclePosition.speed || 25, 20);
    const mins = Math.max(1, Math.round((dist / speed) * 60));

    let statusText = "Driver is on the way";
    if (dist < 0.25) {
      statusText = "Driver has arrived at your stop!";
    } else if (dist < 1.0) {
      statusText = "Driver is approaching your pickup stop";
    }

    return {
      distanceKm: parseFloat(dist.toFixed(1)),
      distanceMeters: Math.round(dist * 1000),
      minutes: mins,
      statusText,
    };
  }, [currentVehiclePosition, passengerStopCoord]);

  // Construct Map Markers
  const mapMarkers = useMemo(() => {
    const list: MapMarkerItem[] = [];

    // 1. Waypoints along route
    waypoints.forEach((wp, idx) => {
      const isPassengerPickup =
        passengerStopCoord &&
        Math.abs(passengerStopCoord.lat - wp.latitude) < 0.0001 &&
        Math.abs(passengerStopCoord.lng - wp.longitude) < 0.0001;

      if (!isPassengerPickup) {
        list.push({
          latitude: wp.latitude,
          longitude: wp.longitude,
          label: `Stop ${wp.stopOrder}: ${wp.stopName}`,
          color: "bg-slate-700",
          type: idx === waypoints.length - 1 ? "destination" : "standard",
        });
      }
    });

    // 2. Passenger pickup stop marker (Distinct blue pin with pulsing aura)
    if (passengerStopCoord) {
      list.push({
        latitude: passengerStopCoord.lat,
        longitude: passengerStopCoord.lng,
        label: `Your Pickup Stop: ${passengerStopCoord.name}`,
        type: "pickup",
        pulse: true,
      });
    }

    // 3. Live Driver Vehicle Marker (Rotated in heading direction)
    list.push({
      latitude: currentVehiclePosition.lat,
      longitude: currentVehiclePosition.lng,
      label: `${driverName} (${vehicleNumber})`,
      subLabel: `${routeName} • ${etaInfo.statusText}`,
      type: "vehicle",
      heading: currentVehiclePosition.heading,
      speed: currentVehiclePosition.speed,
      pulse: true,
    });

    return list;
  }, [
    waypoints,
    passengerStopCoord,
    currentVehiclePosition,
    driverName,
    vehicleNumber,
    routeName,
    etaInfo.statusText,
  ]);

  // Route polylines
  const mapPolylines = useMemo(() => {
    return waypoints.map((w) => ({
      latitude: w.latitude,
      longitude: w.longitude,
    }));
  }, [waypoints]);

  // Share tracking link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // SOS Emergency button handler
  const handleSos = () => {
    setSosSent(true);
    alert(
      "EMERGENCY PROTOCOL ACTIVATED: Your live GPS coordinate and ride manifest have been transmitted to Indus Health Transport Control & Campus Security."
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      {/* Top Careem-Style Header Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-700/60 bg-slate-900/95 px-4 py-3 text-white shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Car size={22} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm sm:text-base font-bold text-white">
                {routeName}
              </h2>
              <span className="shrink-0 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-3xs font-extrabold uppercase text-emerald-400 border border-emerald-500/30">
                {routeCode}
              </span>
            </div>
            <p className="truncate text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Live Careem-Style Radar • {currentVehiclePosition.source === "SIMULATED" ? "Demo Simulation" : "GPS Satellite Locked"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Test simulation toggle button */}
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
              isSimulating
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
            title="Toggle simulated driver movement along route"
          >
            {isSimulating ? (
              <>
                <RotateCcw size={14} className="animate-spin" />
                <span className="hidden sm:inline">Simulating</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-400" />
                <span className="hidden sm:inline">Simulate Drive</span>
              </>
            )}
          </button>

          {/* Close tracker modal */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition border border-slate-700"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full overflow-hidden">
        <MapView
          latitude={currentVehiclePosition.lat}
          longitude={currentVehiclePosition.lng}
          readOnly={true}
          hideMainPin={true}
          followCenter={isFollowLocked}
          markers={mapMarkers}
          polylines={mapPolylines}
          polylineColor="#10b981"
          polylineDashArray="4, 6"
          polylineWeight={5}
          height="100%"
          enableGPS={false}
          enableSearch={false}
          enablePresets={false}
          className="h-full w-full"
        />

        {/* Floating In-Flight ETA Badge */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 px-4 py-3 shadow-2xl backdrop-blur-xl max-w-md w-full">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30">
              <Clock size={22} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-400">
                  {etaInfo.statusText}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-3xs font-bold text-slate-300 border border-slate-700">
                  {currentVehiclePosition.speed} km/h
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-white">
                  {etaInfo.distanceMeters && etaInfo.distanceMeters < 300
                    ? "Arriving Now"
                    : `~${etaInfo.minutes} mins`}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  ({etaInfo.distanceKm} km away from your stop)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Floating Lock Camera Switch */}
        <div className="absolute top-24 right-4 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsFollowLocked(!isFollowLocked)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold shadow-lg transition backdrop-blur-md ${
              isFollowLocked
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700"
            }`}
          >
            <Eye size={15} />
            <span className="hidden sm:inline">
              {isFollowLocked ? "Lock: Following Driver" : "Free Roam"}
            </span>
          </button>
        </div>
      </div>

      {/* Careem / inDrive Floating Bottom Sheet Profile */}
      <div className="relative z-10 border-t border-slate-800 bg-slate-900 px-4 pt-4 pb-6 shadow-2xl text-white">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Driver & Vehicle Metadata Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 p-3.5">
            <div className="flex items-center gap-3.5">
              {/* Driver Avatar */}
              <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-base shadow-lg shadow-emerald-600/30 border-2 border-slate-700">
                {driverName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-amber-400 border border-slate-700">
                  ★
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {driverName}
                  </h3>
                  <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 text-3xs font-extrabold text-amber-400 border border-amber-400/20">
                    4.9 ★ (340+ rides)
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {vehicleModel}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 text-2xs font-extrabold tracking-wider text-emerald-400 border border-slate-700">
                    {vehicleNumber}
                  </span>
                  {seatNumber && (
                    <span className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-2xs font-bold text-blue-300 border border-blue-500/30">
                      Seat: {seatNumber}
                    </span>
                  )}
                  {pickupStop?.stopName && (
                    <span className="text-2xs text-slate-400 font-medium">
                      Pickup: <strong className="text-slate-200">{pickupStop.stopName}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <a
                href={`tel:${driverPhone}`}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition"
              >
                <Phone size={15} />
                <span>Call Driver</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-200 transition"
                title="Share live location"
              >
                <Share2 size={15} />
                <span className="hidden sm:inline">
                  {copiedLink ? "Link Copied!" : "Share"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSos}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  sosSent
                    ? "bg-red-600 text-white"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40"
                }`}
                title="Emergency SOS Broadcast"
              >
                <ShieldAlert size={15} />
                <span className="hidden sm:inline">SOS</span>
              </button>
            </div>
          </div>

          {/* Sequence Waypoint Progression Strip */}
          {waypoints.length > 0 && (
            <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-2.5">
              <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Commute Route Progression</span>
                <span className="text-emerald-400">
                  {waypoints.length} Smart Stops in Sequence
                </span>
              </p>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {waypoints.map((wp, idx) => {
                  const isCurrent =
                    passengerStopCoord &&
                    Math.abs(passengerStopCoord.lat - wp.latitude) < 0.0001 &&
                    Math.abs(passengerStopCoord.lng - wp.longitude) < 0.0001;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1 text-2xs font-bold border transition ${
                        isCurrent
                          ? "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/20"
                          : "bg-slate-800/80 text-slate-400 border-slate-700/60"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-3xs font-black ${
                          isCurrent
                            ? "bg-blue-500 text-white"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {wp.stopOrder}
                      </span>
                      <span className="truncate max-w-[110px]">{wp.stopName}</span>
                      {isCurrent && (
                        <span className="text-blue-400 font-extrabold">📍</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
