import { useEffect, useRef, useState } from "react";

// Access global Leaflet from CDN script injection
declare const L: any;

interface MapViewProps {
  latitude: number;
  longitude: number;
  onChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  markers?: { latitude: number; longitude: number; label?: string; color?: string; pulse?: boolean }[];
  polylines?: { latitude: number; longitude: number }[];
  height?: string;
  zoom?: number;
}

export default function MapView({
  latitude,
  longitude,
  onChange,
  readOnly = false,
  markers = [],
  polylines = [],
  height = "350px",
  zoom = 13,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mainMarkerRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [mapId] = useState(() => `leaflet-map-${Math.random().toString(36).slice(2, 9)}`);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = async () => {
    if (!searchQuery.trim() || !mapInstanceRef.current || typeof L === "undefined") return;

    setSearchError("");
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=pk&viewbox=66.8,24.7,67.4,25.1&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "IndusConnect-Application/1.0",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          mapInstanceRef.current.setView([lat, lon], 14);
          
          if (mainMarkerRef.current) {
            mainMarkerRef.current.setLatLng([lat, lon]);
          }

          if (onChange) {
            onChange(lat, lon);
          }
        } else {
          setSearchError("No results found for this address.");
        }
      }
    } catch (err) {
      console.error("Nominatim search failed:", err);
      setSearchError("Search service unavailable.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // If global L is not loaded yet, wait or log warning
    if (typeof L === "undefined") {
      console.warn("Leaflet script has not loaded yet.");
      return;
    }

    if (!mapContainerRef.current) return;

    // Initialize Leaflet map instance centered on target lat/lng
    const map = L.map(mapId).setView([latitude, longitude], zoom);
    mapInstanceRef.current = map;

    // Add standard OSM OpenStreetMap tiles layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create main marker (Draggable if not readOnly)
    const marker = L.marker([latitude, longitude], {
      draggable: !readOnly,
    }).addTo(map);
    mainMarkerRef.current = marker;

    if (!readOnly && onChange) {
      // Map click handler to relocate pin
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      // Draggable marker dragend handler
      marker.on("dragend", (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        onChange(lat, lng);
      });
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapId]);

  // Sync main marker position if lat/lng properties change externally
  useEffect(() => {
    if (mapInstanceRef.current && mainMarkerRef.current) {
      mainMarkerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Update additional markers (stops etc) dynamically
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === "undefined") return;

    // Clear old additional markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    // Add new markers
    markers.forEach((m) => {
      if (m.latitude && m.longitude) {
        const pulseClass = m.pulse ? "animate-pulse" : "";
        const bgClass = m.color || "bg-emerald-500";
        const stopMarker = L.marker([m.latitude, m.longitude], {
          icon: L.divIcon({
            className: `${bgClass} border-2 border-white rounded-full w-4 h-4 shadow-sm ${pulseClass}`,
            iconSize: [16, 16],
          }),
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(m.label || "Stop");
        stopMarkersRef.current.push(stopMarker);
      }
    });
  }, [markers]);

  // Update route path lines (polylines) dynamically
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
          color: "#2563eb", // blue-600
          weight: 4,
          opacity: 0.8,
          dashArray: "5, 10",
        }).addTo(mapInstanceRef.current);
      }
    }
  }, [polylines]);

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                performSearch();
              }
            }}
            placeholder="Search address, landmark or town..."
            className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
          />
          <button
            type="button"
            onClick={performSearch}
            disabled={isSearching}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 transition disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      )}
      {searchError && <p className="text-4xs font-bold text-red-500">{searchError}</p>}
      <div
        ref={mapContainerRef}
        id={mapId}
        className="w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden z-10"
        style={{ height }}
      />
    </div>
  );
}
