import { useEffect, useRef, useState, useCallback, useId } from "react";
import {
  Compass,
  Crosshair,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Search,
  X,
  Check,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";

// Access global Leaflet from CDN script injection
declare const L: any;

export interface MapMarkerItem {
  latitude: number;
  longitude: number;
  label?: string;
  subLabel?: string;
  color?: string; // e.g. "bg-emerald-500", "bg-blue-600", "bg-red-500"
  pulse?: boolean;
  type?: "standard" | "vehicle" | "pickup" | "destination" | "driver";
  vehicleType?: "BUS" | "VAN" | "CAR" | "COASTER" | "HIACE";
  heading?: number; // 0 - 360 degrees
  icon?: string;
  speed?: number;
  status?: string;
  driverName?: string;
  vehicleNumber?: string;
  routeCode?: string;
  routeName?: string;
  batteryLevel?: number;
  lastUpdated?: string;
}

export interface MapViewProps {
  latitude: number;
  longitude: number;
  onChange?: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
  readOnly?: boolean;
  enableGPS?: boolean;
  enableSearch?: boolean;
  enablePresets?: boolean;
  enableFullscreenToggle?: boolean;
  enableLayerSwitcher?: boolean;
  followCenter?: boolean;
  hideMainPin?: boolean;
  polylineColor?: string;
  polylineDashArray?: string;
  polylineWeight?: number;
  markers?: MapMarkerItem[];
  polylines?: { latitude: number; longitude: number }[];
  height?: string;
  zoom?: number;
  className?: string;
  defaultLayer?: "roadmap" | "hybrid" | "traffic" | "radar" | "terrain";
}

// Enterprise Transit Hubs & Karachi Presets for instant 1-tap navigation
export const KARACHI_MAP_PRESETS = [
  { name: "Head Office (Saddar)", lat: 24.8607, lng: 67.0104 },
  { name: "Port Qasim / Indus Plant", lat: 24.8138, lng: 67.1209 },
  { name: "Jinnah Int'l Airport", lat: 24.9065, lng: 67.1608 },
  { name: "Clifton Block 4", lat: 24.8282, lng: 67.0333 },
  { name: "DHA Phase 5", lat: 24.808, lng: 67.0624 },
  { name: "Gulshan-e-Iqbal Hub", lat: 24.8978, lng: 67.0984 },
  { name: "Gulistan-e-Jauhar", lat: 24.9107, lng: 67.126 },
  { name: "North Nazimabad", lat: 24.9372, lng: 67.0426 },
  { name: "Shahrah-e-Faisal", lat: 24.8687, lng: 67.0822 },
  { name: "Korangi Industrial Area", lat: 24.835, lng: 67.135 },
];

// Tile Layer Configurations (Google Maps & Enterprise Monitoring Layers)
type MapLayerType = "roadmap" | "hybrid" | "traffic" | "radar" | "terrain";

const TILE_PROVIDERS: Record<
  MapLayerType,
  {
    name: string;
    label: string;
    icon: string;
    url: string;
    options: any;
  }
> = {
  roadmap: {
    name: "Google Roadmap",
    label: "Map",
    icon: "🗺️",
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    options: {
      subdomains: ["0", "1", "2", "3"],
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    },
  },
  hybrid: {
    name: "Google Satellite & Roads",
    label: "Satellite",
    icon: "🛰️",
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    options: {
      subdomains: ["0", "1", "2", "3"],
      maxZoom: 20,
      attribution: '&copy; Google Maps Satellite Imagery',
    },
  },
  traffic: {
    name: "Google Live Traffic",
    label: "Traffic",
    icon: "🚦",
    url: "https://mt{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}",
    options: {
      subdomains: ["0", "1", "2", "3"],
      maxZoom: 20,
      attribution: '&copy; Google Maps Traffic Feeds',
    },
  },
  radar: {
    name: "Command Center Dark Radar",
    label: "Radar",
    icon: "🛸",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: '&copy; CARTO &copy; OpenStreetMap',
    },
  },
  terrain: {
    name: "Google Terrain",
    label: "Terrain",
    icon: "⛰️",
    url: "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    options: {
      subdomains: ["0", "1", "2", "3"],
      maxZoom: 20,
      attribution: '&copy; Google Maps Terrain',
    },
  },
};

export default function MapView({
  latitude,
  longitude,
  onChange,
  onAddressChange,
  readOnly = false,
  enableGPS = true,
  enableSearch = true,
  enablePresets = true,
  enableFullscreenToggle = true,
  enableLayerSwitcher = true,
  followCenter = false,
  hideMainPin = false,
  polylineColor = "#2563eb",
  polylineDashArray = "6, 8",
  polylineWeight = 4,
  markers = [],
  polylines = [],
  height = "380px",
  zoom = 13,
  className = "",
  defaultLayer = "roadmap",
}: MapViewProps) {
  const reactId = useId();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const mainMarkerRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const userGpsCircleRef = useRef<any>(null);
  const [mapId] = useState(
    () => `google-leaflet-map-${reactId.replace(/[^a-zA-Z0-9]/g, "")}-${Math.random().toString(36).slice(2, 7)}`
  );

  // Active Map Layer State
  const [activeLayer, setActiveLayer] = useState<MapLayerType>(defaultLayer);
  const [isLeafletReady, setIsLeafletReady] = useState(
    () => typeof window !== "undefined" && typeof (window as any).L !== "undefined"
  );

  // Search & Geolocation UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { name: string; lat: number; lng: number }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "info" | "error" | "success";
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude || 24.8607,
    lng: longitude || 67.0104,
  });
  const searchDebounceRef = useRef<any>(null);

  // Ensure Leaflet library is loaded reliably
  useEffect(() => {
    if (typeof (window as any).L !== "undefined") {
      setIsLeafletReady(true);
      return;
    }

    let checkInterval: any;
    let attempts = 0;

    const injectScript = () => {
      // Check if already injected
      if (document.querySelector('script[src*="leaflet"]')) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.async = true;
      script.onload = () => setIsLeafletReady(true);
      document.head.appendChild(script);
    };

    injectScript();

    checkInterval = setInterval(() => {
      attempts++;
      if (typeof (window as any).L !== "undefined") {
        setIsLeafletReady(true);
        clearInterval(checkInterval);
      } else if (attempts > 50) {
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  // Helper to reverse geocode lat/lng to human address
  const fetchReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!onAddressChange) return;

      for (const preset of KARACHI_MAP_PRESETS) {
        const dLat = Math.abs(preset.lat - lat);
        const dLng = Math.abs(preset.lng - lng);
        if (dLat < 0.005 && dLng < 0.005) {
          onAddressChange(preset.name);
          return;
        }
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          {
            headers: {
              "User-Agent": "IndusConnect-Enterprise-Maps/2.0",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const cleanName =
            data.display_name?.split(",").slice(0, 3).join(", ") ||
            data.name ||
            `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          onAddressChange(cleanName);
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      }
    },
    [onAddressChange]
  );

  // Switch Tile Layer Smoothly
  const setTileLayer = useCallback((layerKey: MapLayerType) => {
    if (!mapInstanceRef.current || typeof L === "undefined") return;

    const map = mapInstanceRef.current;
    const provider = TILE_PROVIDERS[layerKey] || TILE_PROVIDERS.roadmap;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(provider.url, provider.options);
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
    setActiveLayer(layerKey);
  }, []);

  // Geolocation "Locate Me" Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setStatusMessage({
        text: "Geolocation is not supported by your browser.",
        type: "error",
      });
      return;
    }

    setIsLocating(true);
    setStatusMessage({
      text: "Locating your high-precision GPS coordinate...",
      type: "info",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude: gpsLat, longitude: gpsLng, accuracy } = position.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([gpsLat, gpsLng], 16, {
            animate: true,
            duration: 1.2,
          });

          if (mainMarkerRef.current && !readOnly) {
            mainMarkerRef.current.setLatLng([gpsLat, gpsLng]);
          }

          if (userGpsCircleRef.current) {
            userGpsCircleRef.current.remove();
          }
          if (typeof L !== "undefined") {
            userGpsCircleRef.current = L.circle([gpsLat, gpsLng], {
              radius: Math.min(accuracy, 300),
              color: "#1a73e8",
              fillColor: "#4285f4",
              fillOpacity: 0.18,
              weight: 2,
            }).addTo(mapInstanceRef.current);
          }
        }

        if (onChange) onChange(gpsLat, gpsLng);
        fetchReverseGeocode(gpsLat, gpsLng);

        setStatusMessage({
          text: `Position locked (±${Math.round(accuracy)}m accuracy)`,
          type: "success",
        });
        setTimeout(() => setStatusMessage(null), 4000);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "GPS permission denied in browser.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out.";
        }
        setStatusMessage({ text: msg, type: "error" });
        setTimeout(() => setStatusMessage(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  };

  // Search autocomplete query with debounce
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowSuggestions(true);

      const localMatches = KARACHI_MAP_PRESETS.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).map((p) => ({ name: `${p.name} (Preset)`, lat: p.lat, lng: p.lng }));

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}+Karachi&format=json&limit=5&countrycodes=pk`,
          {
            headers: {
              "User-Agent": "IndusConnect-Enterprise-Maps/2.0",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const remoteResults = data.map((item: any) => ({
            name: item.display_name.split(",").slice(0, 3).join(", "),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));

          const combined = [
            ...localMatches,
            ...remoteResults.filter(
              (r: any) => !localMatches.some((l) => l.name.startsWith(r.name))
            ),
          ];
          setSearchResults(combined);
        } else {
          setSearchResults(localMatches);
        }
      } catch (err) {
        console.error("Location search error:", err);
        setSearchResults(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Select a location suggestion
  const handleSelectLocation = (loc: { name: string; lat: number; lng: number }) => {
    setSearchQuery(loc.name);
    setShowSuggestions(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16, {
        animate: true,
        duration: 1.2,
      });
      if (mainMarkerRef.current && !readOnly) {
        mainMarkerRef.current.setLatLng([loc.lat, loc.lng]);
      }
    }

    if (onChange) onChange(loc.lat, loc.lng);
    if (onAddressChange) onAddressChange(loc.name.replace(" (Preset)", ""));

    setStatusMessage({ text: `Navigated to ${loc.name}`, type: "success" });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Zoom In / Out
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Fit bounds to all markers and polylines
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || typeof L === "undefined") return;

    const boundsPoints: [number, number][] = [];
    if (latitude && longitude) boundsPoints.push([latitude, longitude]);
    markers.forEach((m) => {
      if (m.latitude && m.longitude) boundsPoints.push([m.latitude, m.longitude]);
    });
    polylines.forEach((p) => {
      if (p.latitude && p.longitude) boundsPoints.push([p.latitude, p.longitude]);
    });

    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  };

  // Recenter to default coordinate or main pin
  const handleRecenterPin = () => {
    if (mapInstanceRef.current && latitude && longitude) {
      mapInstanceRef.current.flyTo([latitude, longitude], 15, {
        animate: true,
        duration: 0.8,
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE LEAFLET MAP INSTANCE
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLeafletReady || typeof L === "undefined") return;
    if (!mapContainerRef.current) return;

    // Check if map container is already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = latitude || 24.8607;
    const initialLng = longitude || 67.0104;

    const map = L.map(mapId, {
      zoomControl: false,
      attributionControl: false,
    }).setView([initialLat, initialLng], zoom);

    mapInstanceRef.current = map;

    // Add Tile Layer
    const provider = TILE_PROVIDERS[activeLayer] || TILE_PROVIDERS.roadmap;
    const tileLayer = L.tileLayer(provider.url, provider.options).addTo(map);
    tileLayerRef.current = tileLayer;

    // Mouse movement coordinate tracker for Google Maps status bar
    map.on("mousemove", (e: any) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    // Main Interactive Pin
    if (!hideMainPin) {
      const mainPinIcon = L.divIcon({
        className: "custom-google-pin",
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(26, 115, 232, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #ea4335; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: !readOnly,
        icon: mainPinIcon,
      }).addTo(map);
      mainMarkerRef.current = marker;

      if (!readOnly && onChange) {
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onChange(lat, lng);
          fetchReverseGeocode(lat, lng);
        });

        marker.on("dragend", (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          onChange(lat, lng);
          fetchReverseGeocode(lat, lng);
        });
      }
    }

    // Auto Invalidate Size using ResizeObserver (never leaves map blank)
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapId, isLeafletReady]);

  // Sync main pin position when props change
  useEffect(() => {
    if (mapInstanceRef.current && mainMarkerRef.current && !hideMainPin) {
      mainMarkerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude, hideMainPin]);

  // Follow camera pan
  useEffect(() => {
    if (mapInstanceRef.current && followCenter && latitude && longitude) {
      mapInstanceRef.current.panTo([latitude, longitude], {
        animate: true,
        duration: 0.6,
      });
    }
  }, [latitude, longitude, followCenter]);

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE REAL ENTERPRISE FLEET TRACKING MARKERS (GOOGLE FLEET STYLE)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === "undefined") return;

    // Clean up old markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    markers.forEach((m) => {
      if (!m.latitude || !m.longitude) return;

      if (m.type === "vehicle" || m.type === "driver") {
        const headingDeg = typeof m.heading === "number" ? Math.round(m.heading) : 0;
        const speedVal = typeof m.speed === "number" ? Math.round(m.speed) : 0;
        const isEmergency = m.status === "SOS" || m.status === "BREAKDOWN" || m.pulse;
        const isMoving = m.status === "MOVING" || speedVal > 5;

        // Theme colors
        const accentBg = isEmergency
          ? "#ef4444"
          : isMoving
          ? "#10b981"
          : "#3b82f6";

        const vehicleIconSvg =
          m.vehicleType === "BUS" || m.vehicleType === "COASTER"
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.6-.3-1.1-.7-1.4l-1.3-.9c-.4-.3-.8-.5-1.3-.5H4.3c-.5 0-.9.2-1.3.5l-1.3.9c-.4.3-.7.8-.7 1.4 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

        const html = `
          <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <!-- Radar concentric beacon -->
            <div style="position: absolute; width: ${isEmergency ? "58px" : "48px"}; height: ${isEmergency ? "58px" : "48px"}; border-radius: 50%; background: ${isEmergency ? "rgba(239,68,68,0.35)" : "rgba(16,185,129,0.25)"}; animation: ping ${isEmergency ? "1.2s" : "2s"} cubic-bezier(0,0,0.2,1) infinite;"></div>
            
            <!-- Heading Direction Needle -->
            <div style="position: absolute; width: 50px; height: 50px; transform: rotate(${headingDeg}deg); transition: transform 0.4s ease-out; pointer-events: none; display: flex; align-items: flex-start; justify-content: center;">
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 9px solid ${accentBg}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>
            </div>

            <!-- Elevated Vehicle Badge (Google Fleet Style) -->
            <div style="position: relative; width: 36px; height: 36px; border-radius: 50%; background: #ffffff; border: 3px solid ${accentBg}; box-shadow: 0 6px 18px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: ${accentBg}; font-weight: 800; z-index: 2;">
              ${vehicleIconSvg}
            </div>

            <!-- Speed Badge Pill Over Vehicle -->
            <div style="position: absolute; bottom: 0; background: #0f172a; color: #ffffff; font-family: ui-monospace, monospace; font-size: 9px; font-weight: 800; padding: 1.5px 6px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; z-index: 3;">
              ${speedVal > 0 ? `${speedVal} km/h` : "IDLE"}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: "google-fleet-vehicle-marker",
          html,
          iconSize: [64, 64],
          iconAnchor: [32, 32],
          popupAnchor: [0, -32],
        });

        // Rich Google Maps InfoWindow Popup
        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 230px; padding: 4px; color: #0f172a;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
              <div>
                <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                  ${m.vehicleType || "FLEET VEHICLE"}
                </span>
                <h4 style="font-size: 15px; font-weight: 900; margin: 0; color: #0f172a; line-height: 1.2;">
                  ${m.vehicleNumber || m.label || "Active Transit"}
                </h4>
              </div>
              <span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background: ${
                isEmergency ? "#fee2e2" : "#dcfce7"
              }; color: ${isEmergency ? "#b91c1c" : "#15803d"};">
                ${m.status || (isMoving ? "MOVING" : "IDLE")}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
              <div style="background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <span style="font-size: 9px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Speed</span>
                <strong style="font-size: 13px; font-weight: 900; color: #0f172a;">${speedVal} <span style="font-size: 9px;">km/h</span></strong>
              </div>
              <div style="background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <span style="font-size: 9px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Bearing</span>
                <strong style="font-size: 13px; font-weight: 900; color: #0f172a;">${headingDeg}°</strong>
              </div>
            </div>

            ${
              m.driverName
                ? `<div style="font-size: 11px; margin-bottom: 4px; color: #334155;">
                    <span style="color: #64748b;">Captain:</span> <strong>${m.driverName}</strong>
                   </div>`
                : ""
            }

            ${
              m.routeName
                ? `<div style="font-size: 11px; margin-bottom: 8px; color: #334155;">
                    <span style="color: #64748b;">Route:</span> <strong>${m.routeName}</strong>
                   </div>`
                : ""
            }

            <div style="font-size: 9px; color: #94a3b8; font-family: monospace; border-top: 1px solid #f1f5f9; padding-top: 6px; text-align: right;">
              ${m.latitude.toFixed(5)}°N, ${m.longitude.toFixed(5)}°E
            </div>
          </div>
        `;

        const marker = L.marker([m.latitude, m.longitude], { icon })
          .bindPopup(popupContent, {
            maxWidth: 280,
            className: "google-maps-infowindow",
          })
          .addTo(mapInstanceRef.current);

        stopMarkersRef.current.push(marker);
      } else {
        // Standard Stop / Hub Marker
        const isDestination = m.type === "destination";
        const pinColor = isDestination ? "#ea4335" : "#1a73e8";

        const icon = L.divIcon({
          className: "google-stop-pin",
          html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([m.latitude, m.longitude], { icon })
          .bindPopup(`<strong>${m.label || "Stop"}</strong>${m.subLabel ? `<br/>${m.subLabel}` : ""}`)
          .addTo(mapInstanceRef.current);

        stopMarkersRef.current.push(marker);
      }
    });
  }, [markers]);

  // Update Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === "undefined") return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (polylines.length > 0) {
      const latlngs = polylines
        .filter((p) => p.latitude && p.longitude)
        .map((p) => [p.latitude, p.longitude]);

      if (latlngs.length > 0) {
        polylineRef.current = L.polyline(latlngs, {
          color: polylineColor,
          weight: polylineWeight,
          opacity: 0.9,
          dashArray: polylineDashArray,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(mapInstanceRef.current);
      }
    }
  }, [polylines, polylineColor, polylineWeight, polylineDashArray]);

  return (
    <div
      className={`relative flex flex-col font-sans select-none ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen bg-slate-900 p-0 m-0"
          : `w-full rounded-2xl border border-slate-200/90 overflow-hidden shadow-md bg-white ${className}`
      }`}
      style={{
        height: isFullscreen ? "100vh" : height,
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE MAPS FLOATING TOP BAR (Search + Layer Switcher)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        {/* Left: Google Search Bar & Karachi Hub Jump */}
        {enableSearch && (
          <div className="pointer-events-auto relative w-full sm:w-80">
            <div className="flex items-center rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Search size={16} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search location or transit hub..."
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl z-30 divide-y divide-slate-100">
                {isSearching ? (
                  <div className="flex items-center gap-2 p-3 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    <span>Searching locations...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((loc, idx) => (
                    <button
                      key={`${loc.name}-${idx}`}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                      <MapPin size={13} className="shrink-0 text-blue-600" />
                      <span className="truncate">{loc.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400 italic">
                    No results for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
            {/* Quick Presets attached to search container */}
            {enablePresets && (
              <div className="flex items-center gap-1 mt-1.5 overflow-x-auto no-scrollbar">
                {KARACHI_MAP_PRESETS.slice(0, 4).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectLocation(p)}
                    className="shrink-0 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-3xs font-bold shadow-xs transition"
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right: Google Maps Style Layer Switcher Pill */}
        {enableLayerSwitcher && (
          <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-1 shadow-lg">
            {(
              [
                { key: "roadmap", label: "Map", icon: "🗺️" },
                { key: "hybrid", label: "Satellite", icon: "🛰️" },
                { key: "traffic", label: "Traffic", icon: "🚦" },
                { key: "radar", label: "Radar", icon: "🛸" },
              ] as const
            ).map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setTileLayer(l.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-2xs font-extrabold transition-all ${
                  activeLayer === l.key
                    ? "bg-[#1a73e8] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title={TILE_PROVIDERS[l.key].name}
              >
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAP STAGE (LEAFLET CANVAS WITH GOOGLE TILES)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={mapContainerRef}
        id={mapId}
        className="relative w-full h-full flex-1 z-10"
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE MAPS FLOATING CONTROLS (Right-Side Vertical Stack)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute right-3.5 bottom-8 z-20 flex flex-col items-center gap-2 pointer-events-none">
        {/* Zoom Controls */}
        <div className="pointer-events-auto flex flex-col rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 active:bg-slate-200 transition border-b border-slate-100"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 active:bg-slate-200 transition"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* GPS Locate Me (Crosshair) */}
        {enableGPS && !readOnly && (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Locate my position (GPS)"
            className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 size={17} className="animate-spin text-blue-600" />
            ) : (
              <Crosshair size={17} strokeWidth={2.2} />
            )}
          </button>
        )}

        {/* Recenter Pin / Compass */}
        <button
          type="button"
          onClick={handleRecenterPin}
          title="Recenter Pin"
          className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 shadow-lg transition active:scale-95"
        >
          <Compass size={17} strokeWidth={2.2} />
        </button>

        {/* Fit Bounds */}
        {(markers.length > 0 || polylines.length > 0) && (
          <button
            type="button"
            onClick={handleFitBounds}
            title="Fit All Fleet & Stops"
            className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 shadow-lg transition active:scale-95"
          >
            <Layers size={17} strokeWidth={2.2} />
          </button>
        )}

        {/* Fullscreen Expand/Collapse */}
        {enableFullscreenToggle && (
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Radar"}
            className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 shadow-lg transition active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 size={17} strokeWidth={2.2} />
            ) : (
              <Maximize2 size={17} strokeWidth={2.2} />
            )}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE MAPS STATUS BAR & COORDINATES READOUT (Bottom Left)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute left-3 bottom-2.5 z-20 pointer-events-none flex items-center gap-2">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono shadow-md border border-slate-700/60">
          <span className="font-bold text-blue-400">IndusConnect Live Map</span>
          <span className="text-slate-400">•</span>
          <span>
            {mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lng.toFixed(4)}°E
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300">Z: {currentZoom}</span>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shadow-lg animate-fadeIn ${
              statusMessage.type === "error"
                ? "bg-red-600 text-white"
                : statusMessage.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white"
            }`}
          >
            {statusMessage.type === "success" && <Check size={12} />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
