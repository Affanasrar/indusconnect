import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ShuttleAssignmentPage from "./ShuttleAssignmentPage";
import ShuttleBookingsPage from "./ShuttleBookingsPage";

export default function ShuttleModulePage() {
  const { bootstrap } = useAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "management">("personal");

  const role = bootstrap?.role;

  if (role === "SUPER_ADMIN" || role === "TRANSPORT_ADMIN") {
    return (
      <div className="min-w-0 space-y-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-3 text-sm font-extrabold transition border-b-2 ${
              activeTab === "personal"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            My Personal Commute
          </button>
          <button
            onClick={() => setActiveTab("management")}
            className={`px-6 py-3 text-sm font-extrabold transition border-b-2 ${
              activeTab === "management"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Shuttle Route & Roster Management
          </button>
        </div>

        {activeTab === "personal" ? (
          <ShuttleBookingsPage />
        ) : (
          <ShuttleAssignmentPage />
        )}
      </div>
    );
  }

  // All other staff roles (MANAGER, FINANCE_OFFICER, ACCOMMODATION_ADMIN, etc.) get direct access to personal bookings
  return <ShuttleBookingsPage />;
}