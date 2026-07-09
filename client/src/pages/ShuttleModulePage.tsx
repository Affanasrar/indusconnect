import { ShieldAlert } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import ShuttleAssignmentPage from "./ShuttleAssignmentPage";
import ShuttleBookingsPage from "./ShuttleBookingsPage";

export default function ShuttleModulePage() {
  const { bootstrap } = useAuth();

  const role = bootstrap?.role;

  if (role === "EMPLOYEE") {
    return <ShuttleBookingsPage />;
  }

  if (
    role === "SUPER_ADMIN" ||
    role === "TRANSPORT_ADMIN"
  ) {
    return <ShuttleAssignmentPage />;
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Shuttle Management
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Shuttle Bookings
        </h1>
      </div>

      <Card>
        <div className="py-12 text-center">
          <ShieldAlert
            size={44}
            className="mx-auto text-amber-500"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Limited access
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Employee booking and Transport Admin assignment screens
            are not available for your current role.
          </p>
        </div>
      </Card>
    </div>
  );
}