import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Button from "../ui/Button";

export default function AppLayout() {
  const { bootstrap, user, logout } = useAuth();

  const menu = bootstrap?.menu ?? [];
  const unread = bootstrap?.notificationSummary?.unread ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">IndusConnect</h1>
            <p className="text-xs text-slate-500">Mobility & Logistics</p>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {menu.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <LayoutDashboard size={18} />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-slate-200 p-2 lg:hidden">
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Role-Based Dashboard
              </h2>
              <p className="text-sm text-slate-500">
                {bootstrap?.role ?? user?.role?.name ?? "Authenticated User"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative rounded-xl border border-slate-200 p-2">
              <Bell size={20} className="text-slate-600" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                  {unread}
                </span>
              )}
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 md:flex">
              <UserCircle size={22} className="text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.fullName ?? "User"}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            <Button variant="secondary" onClick={logout}>
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}