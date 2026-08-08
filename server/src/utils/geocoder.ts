/**
 * Geocoder utility using OpenStreetMap's Nominatim API (zero-dependency).
 */

export interface GeocodedCoordinates {
  latitude: number;
  longitude: number;
  displayName?: string;
}

/**
 * Geocodes a text address/area query into latitude & longitude coordinates.
 * Nominatim requires a user-agent header to comply with usage guidelines.
 */
const GEOCODE_CACHE = new Map<string, GeocodedCoordinates | null>();

const KARACHI_NEIGHBORHOODS: Record<string, { lat: number; lng: number }> = {
  "korangi": { lat: 24.8138, lng: 67.1209 },
  "saddar": { lat: 24.8607, lng: 67.0104 },
  "garden west": { lat: 24.8765, lng: 67.0321 },
  "garden east": { lat: 24.8812, lng: 67.0390 },
  "garden": { lat: 24.8765, lng: 67.0321 },
  "clifton": { lat: 24.8282, lng: 67.0333 },
  "dha": { lat: 24.8080, lng: 67.0624 },
  "defense": { lat: 24.8080, lng: 67.0624 },
  "gulshan": { lat: 24.8978, lng: 67.0984 },
  "gulshan-e-iqbal": { lat: 24.8978, lng: 67.0984 },
  "gulistan-e-jauhar": { lat: 24.9107, lng: 67.1260 },
  "jauhar": { lat: 24.9107, lng: 67.1260 },
  "federal b area": { lat: 24.9317, lng: 67.0782 },
  "fb area": { lat: 24.9317, lng: 67.0782 },
  "north nazimabad": { lat: 24.9372, lng: 67.0426 },
  "nazimabad": { lat: 24.9157, lng: 67.0328 },
  "malir": { lat: 24.8966, lng: 67.1983 },
  "shahrah-e-faisal": { lat: 24.8687, lng: 67.0822 },
  "pechs": { lat: 24.8690, lng: 67.0681 },
  "bahadurabad": { lat: 24.8828, lng: 67.0664 },
  "liaquatabad": { lat: 24.9088, lng: 67.0433 },
  "karachi cantonment": { lat: 24.8510, lng: 67.0345 },
  "cantt": { lat: 24.8510, lng: 67.0345 },
  "kemari": { lat: 24.8166, lng: 66.9777 },
  "lyari": { lat: 24.8741, lng: 66.9946 },
  "baldia": { lat: 24.8990, lng: 66.9680 },
  "orangi": { lat: 24.9528, lng: 66.9622 },
  "site": { lat: 24.9022, lng: 67.0080 },
  "karsaz": { lat: 24.8893, lng: 67.0894 },
};

export function lookupKarachiNeighborhood(query: string): GeocodedCoordinates | null {
  const norm = query.toLowerCase().trim();
  for (const [key, coords] of Object.entries(KARACHI_NEIGHBORHOODS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        displayName: `${query} (Karachi Preset Location)`,
      };
    }
  }
  return null;
}

export async function geocodeAddress(query: string): Promise<GeocodedCoordinates | null> {
  if (!query || query.trim() === "") return null;

  const cacheKey = query.trim().toLowerCase();
  if (GEOCODE_CACHE.has(cacheKey)) {
    return GEOCODE_CACHE.get(cacheKey) || null;
  }

  const preset = lookupKarachiNeighborhood(query);
  if (preset) {
    GEOCODE_CACHE.set(cacheKey, preset);
    return preset;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=pk&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "IndusConnect-Application/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      const coords = {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        displayName: first.display_name,
      };
      GEOCODE_CACHE.set(cacheKey, coords);
      return coords;
    }
  } catch (error) {
    console.error(`[Geocoder Search Error] Failed to geocode query "${query}":`, error);
  }

  GEOCODE_CACHE.set(cacheKey, null);
  return null;
}

/**
 * Reverse geocodes coordinates (lat/lon) into a friendly stop name.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "IndusConnect-Application/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.display_name || data.name || null;
  } catch (error) {
    console.error(`[Geocoder Reverse Error] Failed to reverse geocode (${latitude}, ${longitude}):`, error);
  }

  return null;
}

/**
 * Calculates geographical distance between two points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
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
