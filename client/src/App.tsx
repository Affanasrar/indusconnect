import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ModulePlaceholderPage from "./pages/ModulePlaceholderPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/users" element={<ModulePlaceholderPage />} />
          <Route path="/vehicles" element={<ModulePlaceholderPage />} />
          <Route path="/drivers" element={<ModulePlaceholderPage />} />
          <Route path="/routes" element={<ModulePlaceholderPage />} />
          <Route
            path="/shuttle-bookings"
            element={<ModulePlaceholderPage />}
          />
          <Route path="/driver-trips" element={<ModulePlaceholderPage />} />
          <Route path="/travel-requests" element={<ModulePlaceholderPage />} />
          <Route path="/accommodation" element={<ModulePlaceholderPage />} />
          <Route path="/expenses" element={<ModulePlaceholderPage />} />
          <Route path="/vendors" element={<ModulePlaceholderPage />} />
          <Route path="/telemetry" element={<ModulePlaceholderPage />} />
          <Route path="/notifications" element={<ModulePlaceholderPage />} />
          <Route path="/proxy-bookings" element={<ModulePlaceholderPage />} />
          <Route path="/policies" element={<ModulePlaceholderPage />} />
          <Route path="/maintenance" element={<ModulePlaceholderPage />} />
          <Route path="/erp-exports" element={<ModulePlaceholderPage />} />
          <Route path="/reports" element={<ModulePlaceholderPage />} />
          <Route path="/audit-logs" element={<ModulePlaceholderPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}