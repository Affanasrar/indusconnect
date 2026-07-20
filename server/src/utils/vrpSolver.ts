import { calculateHaversineDistance } from "./geocoder";

export interface VRPNode {
  bookingId: string;
  latitude: number;
  longitude: number;
  pickupArea: string;
}

export interface VRPOptimizedRoute {
  vehicleId: string;
  driverId: string;
  stops: {
    bookingId: string;
    latitude: number;
    longitude: number;
    stopName: string;
    stopOrder: number;
    estimatedTime: string;
  }[];
}

/**
 * Solves the Capacitated Vehicle Routing Problem (CVRP) using a Nearest Neighbor Heuristic.
 * Groups bookings into clusters matching vehicle capacities, and orders stops to minimize travel time.
 */
export function solveVRP(
  depotLat: number,
  depotLng: number,
  bookings: VRPNode[],
  vehicles: { id: string; capacity: number }[],
  drivers: { id: string }[],
  routeStartTime: string
): VRPOptimizedRoute[] {
  const unvisited = [...bookings];
  const optimizedRoutes: VRPOptimizedRoute[] = [];

  // Parse start time (e.g. "08:00")
  const timeParts = routeStartTime.split(":");
  const startHours = parseInt(timeParts[0], 10) || 8;
  const startMinutes = parseInt(timeParts[1], 10) || 0;

  let vehicleIdx = 0;
  let driverIdx = 0;

  while (unvisited.length > 0 && vehicleIdx < vehicles.length) {
    const vehicle = vehicles[vehicleIdx];
    const driver = drivers[driverIdx % drivers.length]; // Fallback rotate drivers if needed

    if (!driver) {
      break; // No drivers available
    }

    const routeStops: {
      bookingId: string;
      latitude: number;
      longitude: number;
      stopName: string;
      stopOrder: number;
      estimatedTime: string;
    }[] = [];

    let currentLat = depotLat;
    let currentLng = depotLng;
    let currentCapacity = 0;
    const maxCapacity = Math.min(vehicle.capacity, 14); // Keep safety buffer

    // Build route sequentially selecting nearest unvisited bookings
    while (currentCapacity < maxCapacity && unvisited.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const node = unvisited[i];
        const dist = calculateHaversineDistance(currentLat, currentLng, node.latitude, node.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx === -1) break;

      const nextNode = unvisited.splice(nearestIdx, 1)[0];
      routeStops.push({
        bookingId: nextNode.bookingId,
        latitude: nextNode.latitude,
        longitude: nextNode.longitude,
        stopName: nextNode.pickupArea,
        stopOrder: routeStops.length + 1,
        estimatedTime: "", // To be calculated sequentially next
      });

      currentLat = nextNode.latitude;
      currentLng = nextNode.longitude;
      currentCapacity++;
    }

    // Sequence timing calculation for this route
    let cumulativeMinutes = 0;
    let prevLat = depotLat;
    let prevLng = depotLng;

    for (let i = 0; i < routeStops.length; i++) {
      const stop = routeStops[i];
      const dist = calculateHaversineDistance(prevLat, prevLng, stop.latitude, stop.longitude);
      
      // Assume city driving speed of 30 km/h: 2 mins per km + 3 mins passenger boarding buffer
      const travelDuration = Math.round(dist * 2) + 3;
      cumulativeMinutes += travelDuration;

      // Add to base start time
      let stopMin = startMinutes + cumulativeMinutes;
      let stopHr = startHours + Math.floor(stopMin / 60);
      stopMin = stopMin % 60;
      stopHr = stopHr % 24;

      stop.estimatedTime = `${String(stopHr).padStart(2, "0")}:${String(stopMin).padStart(2, "0")}`;

      prevLat = stop.latitude;
      prevLng = stop.longitude;
    }

    optimizedRoutes.push({
      vehicleId: vehicle.id,
      driverId: driver.id,
      stops: routeStops,
    });

    vehicleIdx++;
    driverIdx++;
  }

  return optimizedRoutes;
}
