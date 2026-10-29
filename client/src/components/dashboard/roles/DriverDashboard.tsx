import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Navigation,
  CheckCircle2,
  Bus,
  ChevronRight,
  Phone,
  AlertTriangle,
  Play,
  SquareCheckBig,
} from "lucide-react";
import PageHeader from "../shared/PageHeader";
import ErrorState from "../shared/ErrorState";
import { http } from "../../../api/http";

export default function DriverDashboard() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  async function loadDriverData() {
    try {
      setIsLoading(true);
      setHasError(false);

      const [routesRes, tripsRes] = await Promise.allSettled([
        http.get("/driver-trips/routes"),
        http.get("/driver-trips/trips"),
      ]);

      if (routesRes.status === "fulfilled") {
        const rData = routesRes.value.data?.data ?? routesRes.value.data;
        setRoutes(Array.isArray(rData) ? rData : []);
      }

      if (tripsRes.status === "fulfilled") {
        const tData = tripsRes.value.data?.data ?? tripsRes.value.data;
        setTrips(Array.isArray(tData) ? tData : []);
      }
    } catch (err) {
      console.error("Failed to load driver dashboard data:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDriverData();
  }, []);

  const activeTrip = trips.find((t) => t.status === "IN_PROGRESS" || t.status === "READY");
  const primaryRoute = routes[0];
  const passengerCount = primaryRoute?.shuttleBookings?.length || 0;

  return (
    <div className="space-y-6">
      {/* Driver Header */}
      <PageHeader
        title="Driver Quick Console"
        subtitle="Simple, high-contrast dashboard designed for on-road transit operation."
        onRefresh={loadDriverData}
        isRefreshing={isLoading}
        action={
          <Link
            to="/driver-trips"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 transition active:scale-95 shadow-md"
          >
            <Navigation size={18} />
            <span>Open Full Trip Console</span>
          </Link>
        }
      />

      {hasError && <ErrorState onRetry={loadDriverData} />}

      {/* EASY ACTION BANNER - BIG & VISIBLE FOR DRIVERS */}
      <div className="rounded-3xl border-2 border-blue-600 bg-gradient-to-br from-slate-900 to-[#102644] text-white p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-inner">
              <Bus size={32} />
            </div>
            <div>
              <span className="inline-block rounded-full bg-blue-500/30 px-3 py-1 text-2xs font-extrabold uppercase tracking-wider text-blue-300 border border-blue-400/30">
                Today's Assigned Route
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                {primaryRoute ? primaryRoute.routeName : "No Active Route Today"}
              </h2>
              <p className="text-sm font-semibold text-slate-300">
                {primaryRoute
                  ? `${primaryRoute.startPoint} ➔ ${primaryRoute.endPoint}`
                  : "Check with transport coordinator"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTrip ? (
              <span className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-extrabold text-emerald-300 border border-emerald-500/40">
                <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                TRIP IN PROGRESS
              </span>
            ) : (
              <span className="rounded-xl bg-slate-800/80 px-4 py-2 text-sm font-extrabold text-slate-300 border border-slate-700">
                Shift: {primaryRoute?.shiftType || "Morning"}
              </span>
            )}
          </div>
        </div>

        {/* 3 GIANT TOUCH CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* Card 1: Inspection & Safety */}
          <Link
            to="/driver-trips"
            className="group flex flex-col justify-between rounded-2xl border border-slate-700/80 bg-slate-800/70 p-4 hover:border-blue-400 hover:bg-slate-800 transition active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 1</span>
              <SquareCheckBig size={20} className="text-amber-400" />
            </div>
            <div className="my-3">
              <h3 className="text-base font-extrabold text-white group-hover:text-blue-300 transition">
                Pre-Trip Checklist
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                4 vehicle safety checks (Fuel, Tires, Brakes, Lights)
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-amber-400">
              <span>Complete Inspection &rarr;</span>
            </div>
          </Link>

          {/* Card 2: Big Action (Start or View) */}
          <Link
            to="/driver-trips"
            className={`group flex flex-col justify-between rounded-2xl border p-4 transition active:scale-98 ${
              activeTrip
                ? "border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-950/60 text-white"
                : "border-blue-500/60 bg-blue-950/40 hover:bg-blue-950/60 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 2</span>
              {activeTrip ? (
                <CheckCircle2 size={20} className="text-emerald-400" />
              ) : (
                <Play size={20} className="text-blue-400 fill-current" />
              )}
            </div>
            <div className="my-3">
              <h3 className="text-base font-extrabold text-white">
                {activeTrip ? "Active Running Trip" : "Start Today's Run"}
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {activeTrip
                  ? "Click to mark passengers or finish trip"
                  : "Tap when vehicle is ready to depart"}
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-blue-300 group-hover:text-white">
              <span>{activeTrip ? "Manage Live Trip &rarr;" : "Start Departure &rarr;"}</span>
            </div>
          </Link>

          {/* Card 3: Passenger Count */}
          <Link
            to="/driver-trips"
            className="group flex flex-col justify-between rounded-2xl border border-slate-700/80 bg-slate-800/70 p-4 hover:border-emerald-400 hover:bg-slate-800 transition active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 3</span>
              <Bus size={20} className="text-emerald-400" />
            </div>
            <div className="my-3">
              <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition">
                {passengerCount} Passengers
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Roster manifest with pickup stops & phone contacts
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-400">
              <span>Board Passengers &rarr;</span>
            </div>
          </Link>
        </div>
      </div>

      {/* EASY PASSENGER QUICK LIST - BIG, LEGIBLE CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-[#102644]">
              Passenger Pickup List
            </h3>
            <p className="text-xs font-semibold text-[#64748B]">
              Staff registered for this shuttle route
            </p>
          </div>

          <Link
            to="/driver-trips"
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Open Full Manifest Screen</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {primaryRoute?.shuttleBookings && primaryRoute.shuttleBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {primaryRoute.shuttleBookings.slice(0, 6).map((booking: any) => {
              const emp = booking.employee;
              const isBoarded = booking.status === "COMPLETED";

              return (
                <div
                  key={booking.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition ${
                    isBoarded
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-slate-200 bg-white shadow-xs"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#102644] truncate">
                        {emp?.fullName || "Employee Passenger"}
                      </span>
                      {booking.seatNumber && (
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-2xs font-extrabold text-blue-800">
                          Seat {booking.seatNumber}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-600 mt-0.5 truncate">
                      📍 Stop: {booking.pickupStop?.stopName || booking.pickupArea || "Main Gate"}
                    </p>

                    {emp?.phone && (
                      <a
                        href={`tel:${emp.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:underline mt-1"
                      >
                        <Phone size={13} />
                        <span>Call Passenger ({emp.phone})</span>
                      </a>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Link
                      to="/driver-trips"
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition shadow-xs ${
                        isBoarded
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-900 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isBoarded ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Boarded</span>
                        </>
                      ) : (
                        <span>Board Now</span>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <Bus size={36} className="mx-auto text-slate-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Passengers on Current Shift</h4>
            <p className="text-xs text-slate-500 mt-1">
              Any employees who book seats on your route will appear right here.
            </p>
          </div>
        )}
      </div>

      {/* QUICK ASSISTANCE / EMERGENCY DIALER */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-950">
              Need Transport Help or Roadside Assistance?
            </h4>
            <p className="text-2xs font-semibold text-rose-700">
              Direct line to IndusConnect Transport Control Room & Security Desk
            </p>
          </div>
        </div>

        <Link
          to="/driver-trips"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-rose-700 transition"
        >
          <span>Report Breakdown / SOS</span>
        </Link>
      </div>
    </div>
  );
}
