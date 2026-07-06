import { Activity, Bell, CheckCircle2, Database, UserCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";

export default function DashboardPage() {
  const { bootstrap, user } = useAuth();

  const cards = bootstrap?.dashboardCards ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-blue-800 to-blue-600 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {user?.fullName ?? "IndusConnect User"}
        </h1>
        <p className="mt-2 max-w-3xl text-blue-100">
          You are logged in as{" "}
          <span className="font-bold">{bootstrap?.role ?? user?.role?.name}</span>.
          Your menu, permissions, and dashboard cards are coming directly from
          the backend frontend bootstrap API.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Role</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {bootstrap?.role ?? "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <UserCircle />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Menu Items</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {bootstrap?.menu?.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Activity />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Unread Alerts
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {bootstrap?.notificationSummary?.unread ?? 0}
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 p-3 text-red-700">
              <Bell />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">API Status</p>
              <p className="mt-2 text-xl font-bold text-slate-900">Connected</p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <Database />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Dashboard API Cards
        </h2>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.key}>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <CheckCircle2 size={22} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                    {card.api}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {cards.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500">
                No dashboard cards found for this role.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}