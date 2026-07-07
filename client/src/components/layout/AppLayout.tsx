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
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-slate-200 bg-white xl:block">
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <ShieldCheck size={24} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">
              IndusConnect
            </h1>
            <p className="truncate text-xs text-slate-500">
              Mobility & Logistics
            </p>
          </div>
        </div>

        <nav className="h-[calc(100vh-80px)] space-y-1 overflow-y-auto p-4">
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
              <LayoutDashboard size={18} className="shrink-0" />
              <span className="truncate">{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 xl:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex h-20 min-w-0 items-center justify-between gap-3 px-4 sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button className="shrink-0 rounded-xl border border-slate-200 p-2 xl:hidden">
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                  Role-Based Dashboard
                </h2>
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  {bootstrap?.role ?? user?.role?.name ?? "Authenticated User"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="relative rounded-xl border border-slate-200 p-2">
                <Bell size={19} className="text-slate-600" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                    {unread}
                  </span>
                )}
              </div>

              <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2 lg:flex">
                <UserCircle size={22} className="shrink-0 text-slate-500" />
                <div className="min-w-0">
                  <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
                    {user?.fullName ?? "User"}
                  </p>
                  <p className="max-w-40 truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>
              </div>

              <Button variant="secondary" onClick={logout} className="px-3">
                <LogOut size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-3 xl:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {menu.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) =>
                    `shrink-0 rounded-xl px-4 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`
                  }
                >
                  {item.title}
                </NavLink>
              ))}
            </div>
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden p-4 sm:p-5 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}