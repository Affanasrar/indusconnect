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
export async function geocodeAddress(query: string): Promise<GeocodedCoordinates | null> {
  if (!query || query.trim() === "") return null;

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
      return {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        displayName: first.display_name,
      };
    }
  } catch (error) {
    console.error(`[Geocoder Search Error] Failed to geocode query "${query}":`, error);
  }

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
