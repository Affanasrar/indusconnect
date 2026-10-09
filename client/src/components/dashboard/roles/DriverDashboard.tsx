import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Navigation,
  Compass,
  CheckCircle2,
  Bus,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../shared/PageHeader";
import KpiCard from "../shared/KpiCard";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";
import { KpiSkeleton, TableSkeleton } from "../shared/LoadingState";
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
        const rData = routesRes.value.data.data ?? routesRes.value.data;
        setRoutes(Array.isArray(rData) ? rData : []);
      }

      if (tripsRes.status === "fulfilled") {
        const tData = tripsRes.value.data.data ?? tripsRes.value.data;
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Dashboard"
        subtitle="View your assigned routes and daily shuttle trips."
        onRefresh={loadDriverData}
        isRefreshing={isLoading}
        action={
          <Link
            to="/driver-trips"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#102644] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1769E0] transition active:scale-95 shadow-xs"
          >
            <Navigation size={14} />
            <span>Manage Trips</span>
          </Link>
        }
      />

      {hasError && <ErrorState onRetry={loadDriverData} />}

      {/* 4 Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Assigned Routes"
            value={routes.length}
            subtitle={routes.length > 0 ? "Daily transit routes" : "No routes assigned"}
            icon={<Bus size={20} />}
            iconTone="emerald"
            to="/driver-trips"
          />

          <KpiCard
            label="Active Trips Today"
            value={trips.filter((t) => t.status === "IN_PROGRESS").length}
            subtitle={activeTrip ? "Trip in progress" : "No trip active"}
            icon={<Navigation size={20} />}
            iconTone="blue"
            to="/driver-trips"
          />

          <KpiCard
            label="Pre-Trip Checklists"
            value={trips.filter((t) => t.status === "CHECKLIST_PENDING").length}
            subtitle="Vehicle inspection required"
            icon={<CheckCircle2 size={20} />}
            iconTone="amber"
            to="/driver-trips"
          />

          <KpiCard
            label="Completed Runs"
            value={trips.filter((t) => t.status === "COMPLETED").length}
            subtitle="Finished today"
            icon={<Compass size={20} />}
            iconTone="slate"
            to="/driver-trips"
          />
        </div>
      )}

      {/* Active Trip Banner if in progress */}
      {activeTrip && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Navigation size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#102644]">
                Active Trip: {activeTrip.route?.routeName || "Assigned Shuttle"}
              </div>
              <div className="text-[11px] text-[#64748B]">
                Status: {activeTrip.status} &bull; Passengers onboard: {activeTrip.passengersCount || 0}
              </div>
            </div>
          </div>

          <Link
            to="/driver-trips"
            className="inline-flex items-center gap-1 rounded-lg bg-[#1769E0] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            <span>Open Trip Console</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Assigned Routes Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#102644]">Assigned Transit Routes</h2>
            <p className="text-xs text-[#64748B]">Your designated routes and stops schedule</p>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : routes.length === 0 ? (
          <EmptyState
            title="No routes assigned"
            description="You do not have any active shuttle routes assigned by the transport manager."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="rounded-xl border border-[#DCE5F0] bg-white p-4 space-y-3 hover:border-[#1769E0]/40 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#102644]">{route.routeName}</h3>
                    <p className="text-[11px] text-[#64748B]">
                      {route.startPoint} &rarr; {route.endPoint}
                    </p>
                  </div>
                  <StatusBadge status={route.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs text-[#64748B] border-t border-[#F1F5F9] pt-2">
                  <span>Shift: {route.shiftType || "General"}</span>
                  <Link
                    to="/driver-trips"
                    className="text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-0.5"
                  >
                    <span>View Manifest</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
