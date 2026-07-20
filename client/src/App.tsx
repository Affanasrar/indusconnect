import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ModulePlaceholderPage from "./pages/ModulePlaceholderPage";
import NotFoundPage from "./pages/NotFoundPage";
import UsersPage from "./pages/UsersPage";
import VehiclesPage from "./pages/VehiclesPage";
import DriversPage from "./pages/DriversPage";
import RoutesPage from "./pages/RoutesPage";
import ShuttleModulePage from "./pages/ShuttleModulePage";
import DriverTripsPage from "./pages/DriverTripsPage";
import TravelRequestsPage from "./pages/TravelRequestsPage";
import AccommodationPage from "./pages/AccommodationPage";
import ExpensesPage from "./pages/ExpensesPage";
import VendorsPage from "./pages/VendorsPage";
import TelemetryPage from "./pages/TelemetryPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProxyBookingsPage from "./pages/ProxyBookingsPage";
import PoliciesPage from "./pages/PoliciesPage";
import MaintenancePage from "./pages/MaintenancePage";
import ErpExportsPage from "./pages/ErpExportsPage";

export default function App() {
  return (
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
          <Route
            path="/shuttle-bookings"
            element={<ShuttleModulePage />}
          />
          <Route
            path="/driver-trips"
            element={<DriverTripsPage />}
          />
          <Route
            path="/travel-requests"
            element={<TravelRequestsPage />}
          />
          <Route
            path="/accommodation"
            element={<AccommodationPage />}
          />
          <Route
            path="/expenses"
            element={<ExpensesPage />}
          />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/proxy-bookings" element={<ProxyBookingsPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/erp-exports" element={<ErpExportsPage />} />
          <Route path="/reports" element={<ModulePlaceholderPage />} />
          <Route path="/audit-logs" element={<ModulePlaceholderPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}