import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import { Loader2 } from "lucide-react";

// Code-split route components for high performance and lightweight initial bundle
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const VehiclesPage = lazy(() => import("./pages/VehiclesPage"));
const DriversPage = lazy(() => import("./pages/DriversPage"));
const RoutesPage = lazy(() => import("./pages/RoutesPage"));
const ShuttleModulePage = lazy(() => import("./pages/ShuttleModulePage"));
const DriverTripsPage = lazy(() => import("./pages/DriverTripsPage"));
const TravelRequestsPage = lazy(() => import("./pages/TravelRequestsPage"));
const AccommodationPage = lazy(() => import("./pages/AccommodationPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const TelemetryPage = lazy(() => import("./pages/TelemetryPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProxyBookingsPage = lazy(() => import("./pages/ProxyBookingsPage"));
const PoliciesPage = lazy(() => import("./pages/PoliciesPage"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const ErpExportsPage = lazy(() => import("./pages/ErpExportsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 size={28} className="animate-spin text-[#1769E0]" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Loading module…
      </span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/users" element={<UsersPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/shuttle-bookings" element={<ShuttleModulePage />} />
            <Route path="/driver-trips" element={<DriverTripsPage />} />
            <Route path="/travel-requests" element={<TravelRequestsPage />} />
            <Route path="/accommodation" element={<AccommodationPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/proxy-bookings" element={<ProxyBookingsPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/erp-exports" element={<ErpExportsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}