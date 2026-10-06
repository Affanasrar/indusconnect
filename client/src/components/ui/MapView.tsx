import { useEffect, useRef, useState, useCallback } from "react";
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
  heading?: number; // 0 - 360 degrees
  icon?: string;
  speed?: number;
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
}

// Enterprise Transit Hubs & Karachi Presets for instant 1-tap navigation
export const KARACHI_MAP_PRESETS = [
  { name: "Head Office (Saddar)", lat: 24.8607, lng: 67.0104 },
  { name: "Port Qasim / Indus Plant", lat: 24.8138, lng: 67.1209 },
  { name: "Jinnah Int'l Airport", lat: 24.9065, lng: 67.1608 },
  { name: "Clifton Block 4", lat: 24.8282, lng: 67.0333 },
  { name: "DHA Phase 5", lat: 24.808, lng: 67.0624 },
  { name: "Gulshan-e-Iqbal", lat: 24.8978, lng: 67.0984 },
  { name: "Gulistan-e-Jauhar", lat: 24.9107, lng: 67.126 },
  { name: "North Nazimabad", lat: 24.9372, lng: 67.0426 },
  { name: "Shahrah-e-Faisal", lat: 24.8687, lng: 67.0822 },
  { name: "Korangi Industrial Area", lat: 24.835, lng: 67.135 },
];

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
  followCenter = false,
  hideMainPin = false,
  polylineColor = "#2563eb",
  polylineDashArray = "6, 8",
  polylineWeight = 4,
  markers = [],
  polylines = [],
  height = "340px",
  zoom = 13,
  className = "",
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mainMarkerRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const userGpsCircleRef = useRef<any>(null);
  const [mapId] = useState(
    () => `leaflet-map-${Math.random().toString(36).slice(2, 9)}`
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
  const searchDebounceRef = useRef<any>(null);

  // Helper to reverse geocode lat/lng to human address
  const fetchReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!onAddressChange) return;

      // First check local presets to prevent external network latency
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
              "User-Agent": "IndusConnect-Application/1.0",
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
      text: "Locating your current GPS position...",
      type: "info",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude: gpsLat, longitude: gpsLng, accuracy } = position.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([gpsLat, gpsLng], 15, { animate: true });

          if (mainMarkerRef.current && !readOnly) {
            mainMarkerRef.current.setLatLng([gpsLat, gpsLng]);
          }

          // Draw / update accuracy circle
          if (userGpsCircleRef.current) {
            userGpsCircleRef.current.remove();
          }
          if (typeof L !== "undefined") {
            userGpsCircleRef.current = L.circle([gpsLat, gpsLng], {
              radius: Math.min(accuracy, 250),
              color: "#3b82f6",
              fillColor: "#60a5fa",
              fillOpacity: 0.15,
              weight: 1.5,
            }).addTo(mapInstanceRef.current);
          }
        }

        if (onChange) {
          onChange(gpsLat, gpsLng);
        }

        fetchReverseGeocode(gpsLat, gpsLng);

        setStatusMessage({
          text: `Position found (±${Math.round(accuracy)}m accuracy)`,
          type: "success",
        });
        setTimeout(() => setStatusMessage(null), 4000);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please enable GPS in browser settings.";
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
          )}&countrycodes=pk&viewbox=66.8,24.7,67.4,25.1&format=json&limit=5`,
          {
            headers: {
              "User-Agent": "IndusConnect-Application/1.0",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const remoteMatches = data.map((item: any) => ({
            name: item.display_name.split(",").slice(0, 3).join(", "),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));

          setSearchResults([...localMatches, ...remoteMatches]);
        } else {
          setSearchResults(localMatches);
        }
      } catch (err) {
        console.error("Nominatim search failed:", err);
        setSearchResults(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Select a location suggestion
  const handleSelectLocation = (loc: { name: string; lat: number; lng: number }) => {
    setSearchQuery(loc.name);
    setShowSuggestions(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 15, { animate: true });
      if (mainMarkerRef.current && !readOnly) {
        mainMarkerRef.current.setLatLng([loc.lat, loc.lng]);
      }
    }

    if (onChange) {
      onChange(loc.lat, loc.lng);
    }
    if (onAddressChange) {
      onAddressChange(loc.name.replace(" (Preset)", ""));
    }

    setStatusMessage({ text: `Centered on ${loc.name}`, type: "success" });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Fit bounds to all markers and polyline
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
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  };

  // Recenter to main pin
  const handleRecenterPin = () => {
    if (mapInstanceRef.current && latitude && longitude) {
      mapInstanceRef.current.flyTo([latitude, longitude], 15, { animate: true });
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof L === "undefined") {
      console.warn("Leaflet script has not loaded yet.");
      return;
    }

    if (!mapContainerRef.current) return;

    // Create Leaflet map instance
    const map = L.map(mapId, {
      zoomControl: false, // Custom positioned below
    }).setView([latitude, longitude], zoom);
    mapInstanceRef.current = map;

    // Standard OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add zoom control at bottom-right for thumb ergonomics on mobile
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    if (!hideMainPin) {
      // Custom pulse marker for main pin
      const mainPinIcon = L.divIcon({
        className: "relative flex items-center justify-center",
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <span class="absolute w-7 h-7 rounded-full bg-blue-500 opacity-30 animate-ping"></span>
            <span class="relative flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white shadow-lg border-2 border-white font-bold text-2xs">
              📍
            </span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([latitude, longitude], {
        draggable: !readOnly,
        icon: mainPinIcon,
      }).addTo(map);
      mainMarkerRef.current = marker;

      if (!readOnly && onChange) {
        // Map click handler
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onChange(lat, lng);
          fetchReverseGeocode(lat, lng);
        });

        // Marker dragend handler
        marker.on("dragend", (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          onChange(lat, lng);
          fetchReverseGeocode(lat, lng);
        });
      }
    }

    // Invalidate size after layout stabilization
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapId]);

  // Sync main marker position when external lat/lng changes
  useEffect(() => {
    if (mapInstanceRef.current && mainMarkerRef.current && !hideMainPin) {
      mainMarkerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude, hideMainPin]);

  // Pan / Follow vehicle when followCenter is enabled
  useEffect(() => {
    if (mapInstanceRef.current && followCenter && latitude && longitude) {
      mapInstanceRef.current.panTo([latitude, longitude], {
        animate: true,
        duration: 0.6,
      });
    }
  }, [latitude, longitude, followCenter]);

  // Update additional markers
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === "undefined") return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    markers.forEach((m, idx) => {
      if (!m.latitude || !m.longitude) return;

      // Careem / inDrive Rotating Vehicle Marker
      if (m.type === "vehicle" || m.type === "driver") {
        const headingDeg = typeof m.heading === "number" ? m.heading : 0;
        const speedVal = typeof m.speed === "number" ? Math.round(m.speed) : 0;
        const speedLabel = speedVal > 0 ? `${speedVal} km/h` : "Live";

        const vehicleHtml = `
          <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
            <!-- Radar ping halo -->
            <div style="position: absolute; width: 42px; height: 42px; border-radius: 9999px; background: rgba(16, 185, 129, 0.28); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <!-- Heading oriented vehicle body -->
            <div style="transform: rotate(${headingDeg}deg); transition: transform 0.4s ease-out; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; position: relative;">
              <!-- Direction pointer needle -->
              <div style="position: absolute; top: -6px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 8px solid #059669; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));"></div>
              <!-- Car body -->
              <div style="width: 34px; height: 34px; border-radius: 12px; background: #0f172a; border: 2.5px solid #10b981; box-shadow: 0 4px 12px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center;">
                <svg style="width: 20px; height: 20px; color: #34d399;" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
            </div>
            <!-- Bottom speed pill -->
            <div style="position: absolute; bottom: -8px; background: #0f172a; color: #34d399; font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 6px; border: 1px solid #10b981; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${speedLabel}
            </div>
          </div>
        `;

        const vMarker = L.marker([m.latitude, m.longitude], {
          icon: L.divIcon({
            className: "careem-vehicle-marker",
            html: vehicleHtml,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          }),
          zIndexOffset: 1000,
        }).addTo(mapInstanceRef.current);

        vMarker.bindPopup(`
          <div style="min-width: 170px; font-family: sans-serif; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #0f172a; font-size: 13px;">
              <span style="color: #10b981; font-size: 16px;">●</span> ${m.label || "Live Vehicle"}
            </div>
            ${m.subLabel ? `<div style="color: #64748b; font-size: 11px; margin-top: 3px;">${m.subLabel}</div>` : ""}
            <div style="margin-top: 6px; display: flex; gap: 8px; font-size: 10px; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              <span>Speed: <strong>${speedVal} km/h</strong></span>
              <span>Heading: <strong>${headingDeg}°</strong></span>
            </div>
          </div>
        `);
        stopMarkersRef.current.push(vMarker);
        return;
      }

      // Passenger Pickup Point Marker
      if (m.type === "pickup") {
        const pickupHtml = `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(37, 99, 235, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(37,99,235,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 15px;">
              🚶
            </div>
          </div>
        `;
        const pMarker = L.marker([m.latitude, m.longitude], {
          icon: L.divIcon({
            className: "careem-pickup-marker",
            html: pickupHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
          zIndexOffset: 900,
        }).addTo(mapInstanceRef.current);
        pMarker.bindPopup(`<strong>Your Pickup Point</strong><br/><span style="font-size: 11px; color: #64748b;">${m.label || "Waiting for shuttle"}</span>`);
        stopMarkersRef.current.push(pMarker);
        return;
      }

      // Final Destination Flag
      if (m.type === "destination") {
        const destHtml = `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: relative; width: 30px; height: 30px; border-radius: 9999px; background: #ef4444; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(239,68,68,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
              🏁
            </div>
          </div>
        `;
        const dMarker = L.marker([m.latitude, m.longitude], {
          icon: L.divIcon({
            className: "careem-dest-marker",
            html: destHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
          zIndexOffset: 850,
        }).addTo(mapInstanceRef.current);
        dMarker.bindPopup(`<strong>Final Destination</strong><br/><span style="font-size: 11px; color: #64748b;">${m.label || "Drop-off terminus"}</span>`);
        stopMarkersRef.current.push(dMarker);
        return;
      }

      // Standard Sequenced Stop Marker
      const pulseClass = m.pulse ? "animate-pulse" : "";
      const bgClass = m.color || "bg-emerald-500";
      const iconContent = m.icon || `<span>${idx + 1}</span>`;
      const stopMarker = L.marker([m.latitude, m.longitude], {
        icon: L.divIcon({
          className: `${bgClass} border-2 border-white rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-md ${pulseClass}`,
          html: iconContent,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>${m.label || `Stop #${idx + 1}`}</strong>`);
      stopMarkersRef.current.push(stopMarker);
    });
  }, [markers]);

  // Update route polylines
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === "undefined") return;

    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    if (polylines.length > 0) {
      const latlngs = polylines
        .filter((p) => p.latitude && p.longitude)
        .map((p) => [p.latitude, p.longitude]);

      if (latlngs.length > 0) {
        polylineRef.current = L.polyline(latlngs, {
          color: polylineColor,
          weight: polylineWeight,
          opacity: 0.85,
          dashArray: polylineDashArray,
        }).addTo(mapInstanceRef.current);
      }
    }
  }, [polylines, polylineColor, polylineWeight, polylineDashArray]);

  // Invalidate map size when fullscreen toggled
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 150);
    }
  }, [isFullscreen]);

  // Render Map Container
  const mapContent = (
    <div
      className={`relative flex flex-col bg-slate-50 ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen p-3 sm:p-5"
          : `w-full rounded-2xl border border-slate-200 overflow-hidden shadow-xs ${className}`
      }`}
    >
      {/* Top Floating Controls Bar */}
      {(!readOnly || enableSearch) && (
        <div className="relative z-20 mb-2 space-y-1.5 p-2 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            {enableSearch && (
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Search Karachi area or landmark..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={13} />
                  </button>
                )}

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-30 divide-y divide-slate-100">
                    {isSearching ? (
                      <div className="flex items-center gap-2 p-3 text-xs text-slate-500">
                        <Loader2 size={14} className="animate-spin text-blue-600" />
                        <span>Searching Karachi locations...</span>
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
                        No locations matched "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GPS Geolocation "Locate Me" Button */}
            {enableGPS && !readOnly && (
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                title="Locate my GPS position"
                className="flex items-center gap-1.5 shrink-0 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-95 text-white px-3 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Crosshair size={14} />
                )}
                <span className="hidden sm:inline">Locate Me</span>
              </button>
            )}

            {/* Fullscreen Modal Toggle */}
            {enableFullscreenToggle && (
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
                className="shrink-0 p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}
          </div>

          {/* Quick Preset Chips */}
          {enablePresets && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Quick:
              </span>
              {KARACHI_MAP_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() =>
                    handleSelectLocation({
                      name: preset.name,
                      lat: preset.lat,
                      lng: preset.lng,
                    })
                  }
                  className="shrink-0 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-600 px-2.5 py-1 text-[11px] font-semibold transition"
                >
                  {preset.name.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Status / Accuracy Feedback Banner */}
      {statusMessage && (
        <div
          className={`absolute top-24 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md transition animate-in fade-in flex items-center gap-1.5 ${
            statusMessage.type === "error"
              ? "bg-red-600 text-white"
              : statusMessage.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-white"
          }`}
        >
          {statusMessage.type === "success" && <Check size={13} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        id={mapId}
        className="relative w-full flex-1 rounded-xl overflow-hidden z-10"
        style={{ height: isFullscreen ? "calc(100vh - 130px)" : height }}
      />

      {/* Floating Action Buttons over Map (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-20 flex gap-2">
        <button
          type="button"
          onClick={handleRecenterPin}
          title="Recenter to pin"
          className="flex items-center gap-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 px-2.5 py-1.5 text-xs font-bold border border-slate-200 shadow-md backdrop-blur-sm transition"
        >
          <Compass size={14} className="text-blue-600" />
          <span className="hidden sm:inline">Center Pin</span>
        </button>

        {(markers.length > 0 || polylines.length > 0) && (
          <button
            type="button"
            onClick={handleFitBounds}
            title="Fit view to all stops"
            className="flex items-center gap-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 px-2.5 py-1.5 text-xs font-bold border border-slate-200 shadow-md backdrop-blur-sm transition"
          >
            <Layers size={14} className="text-blue-600" />
            <span>Fit Route</span>
          </button>
        )}
      </div>

      {/* Fullscreen Sticky Confirmation Footer on Mobile */}
      {isFullscreen && (
        <div className="relative z-20 mt-2 flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-lg pb-safe">
          <div className="min-w-0 pr-2">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
              Selected Point
            </p>
            <p className="truncate text-xs font-extrabold text-slate-800">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs px-4 py-2.5 shadow-md active:scale-95 transition"
          >
            <Check size={14} />
            <span>Confirm Location</span>
          </button>
        </div>
      )}
    </div>
  );

  return mapContent;
}
