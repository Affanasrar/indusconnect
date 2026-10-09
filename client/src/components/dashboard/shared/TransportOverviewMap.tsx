import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Navigation, ExternalLink, Radio, RefreshCw } from "lucide-react";
import MapView, { type MapMarkerItem } from "../../ui/MapView";
import { http } from "../../../api/http";

export interface TransportOverviewMapProps {
  className?: string;
  showLiveVehicles?: boolean;
  autoRefreshIntervalMs?: number;
}

export default function TransportOverviewMap({
  className = "",
  showLiveVehicles = true,
  autoRefreshIntervalMs = 20000, // 20s
}: TransportOverviewMapProps) {
  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [polylines, setPolylines] = useState<{ latitude: number; longitude: number }[]>([]);
  const [activeVehiclesCount, setActiveVehiclesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const timerRef = useRef<any>(null);

  const loadTransportLocations = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setHasError(false);

      const newMarkers: MapMarkerItem[] = [];
      const newPolylinePoints: { latitude: number; longitude: number }[] = [];

      // 1. Fetch routes & stops
      try {
        const routesRes = await http.get("/routes");
        const routesData = routesRes.data.data ?? routesRes.data;
        if (Array.isArray(routesData)) {
          routesData.forEach((route: any) => {
            if (Array.isArray(route.stops)) {
              route.stops.forEach((stop: any) => {
                if (stop.latitude && stop.longitude) {
                  newMarkers.push({
                    latitude: Number(stop.latitude),
                    longitude: Number(stop.longitude),
                    label: stop.stopName || "Transit Stop",
                    subLabel: `Route: ${route.routeName || "Shuttle"}`,
                    color: "bg-blue-600",
                    type: "pickup",
                  });
                  newPolylinePoints.push({
                    latitude: Number(stop.latitude),
                    longitude: Number(stop.longitude),
                  });
                }
              });
            }
          });
        }
      } catch (e) {
        console.warn("Routes for map could not be loaded:", e);
      }

      // 2. Fetch live/latest vehicle telemetry if permitted
      if (showLiveVehicles) {
        try {
          const telemetryRes = await http.get("/telemetry/live");
          const telemetryData = telemetryRes.data.data ?? telemetryRes.data;
          if (Array.isArray(telemetryData)) {
            setActiveVehiclesCount(telemetryData.length);
            telemetryData.forEach((item: any) => {
              if (item.latitude && item.longitude) {
                const vehicleNum = item.vehicle?.vehicleNumber || "Fleet Vehicle";
                const driverName = item.driver?.user?.fullName || "Assigned Driver";
                const lastSeen = item.recordedAt
                  ? new Date(item.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Recent";

                newMarkers.push({
                  latitude: Number(item.latitude),
                  longitude: Number(item.longitude),
                  label: vehicleNum,
                  subLabel: `Last reported location (${lastSeen}) • ${driverName}`,
                  color: item.status === "SOS" || item.status === "BREAKDOWN" ? "bg-red-500" : "bg-emerald-600",
                  type: "vehicle",
                  pulse: item.status === "MOVING",
                  speed: item.speed ? Number(item.speed) : undefined,
                });
              }
            });
          }
        } catch (e) {
          console.warn("Telemetry for map could not be loaded:", e);
        }
      }

      setMarkers(newMarkers);
      setPolylines(newPolylinePoints);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load map points:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showLiveVehicles]);

  // Initial load
  useEffect(() => {
    loadTransportLocations(false);
  }, [loadTransportLocations]);

  // Live Auto-Refresh Interval
  useEffect(() => {
    if (!autoRefreshIntervalMs || autoRefreshIntervalMs <= 0) return;

    timerRef.current = setInterval(() => {
      // Only refresh if tab is currently visible to conserve network & memory
      if (!document.hidden) {
        loadTransportLocations(true);
      }
    }, autoRefreshIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefreshIntervalMs, loadTransportLocations]);

  return (
    <div className={`rounded-xl border border-[#DCE5F0] bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE5F0] px-4 py-3 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-[#1769E0]" />
            <h3 className="text-sm font-bold text-[#102644]">Transport Overview</h3>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time coordinates and last reported fleet positions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeVehiclesCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#1769E0] border border-blue-200">
              <span>{activeVehiclesCount} Active Vehicles</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => loadTransportLocations(true)}
            disabled={isRefreshing}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-[#102644] transition active:scale-95 disabled:opacity-50"
            title="Refresh Map Coordinates"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[#1769E0]" : ""} />
          </button>

          <Link
            to="/routes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769E0] hover:underline"
          >
            <span>Open Full Map</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Map View Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <span className="text-xs font-semibold text-[#64748B] animate-pulse">
              Loading transit coordinates...
            </span>
          </div>
        )}

        {hasError ? (
          <div className="flex h-[280px] flex-col items-center justify-center p-6 text-center bg-slate-50">
            <Radio size={24} className="text-[#64748B] mb-2" />
            <p className="text-xs font-semibold text-[#102644]">No transport locations are available right now.</p>
            <p className="text-xs text-[#64748B] mt-1">Check back once routes or fleet telemetry are synchronized.</p>
          </div>
        ) : (
          <MapView
            latitude={24.8607} // Default Karachi hub
            longitude={67.0104}
            readOnly={true}
            enableSearch={false}
            enableGPS={false}
            enablePresets={false}
            enableFullscreenToggle={true}
            markers={markers}
            polylines={polylines}
            height="290px"
            zoom={12}
            className="rounded-none border-0"
          />
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] text-[#64748B] border-t border-[#F1F5F9] bg-white">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span>Stops ({markers.filter((m) => m.type === "pickup").length})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>Vehicles ({markers.filter((m) => m.type === "vehicle").length})</span>
          </span>
        </div>

        <span className="text-slate-400">
          Last sync: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
