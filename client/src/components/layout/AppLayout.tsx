import { useState } from "react";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Button from "../ui/Button";
import MobileNavDrawer from "./MobileNavDrawer";
import MobileBottomBar from "./MobileBottomBar";

export default function AppLayout() {
  const { bootstrap, user, logout } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const menu = bootstrap?.menu ?? [];
  const unread = bootstrap?.notificationSummary?.unread ?? 0;
  const userRole = bootstrap?.role ?? user?.role?.name ?? "EMPLOYEE";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      {/* Desktop Persistent Left Sidebar (>= xl) */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-slate-200 bg-white xl:block">
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-xs">
            <ShieldCheck size={24} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 leading-tight">
              IndusConnect
            </h1>
            <p className="truncate text-xs text-slate-500 font-medium">
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
                    ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-700"
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

      {/* Main Container Area */}
      <div className="min-w-0 xl:pl-64">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="flex h-16 sm:h-20 min-w-0 items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 xl:hidden active:scale-95 transition"
                aria-label="Open mobile navigation menu"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-sm sm:text-lg font-bold text-slate-900 leading-tight">
                  Enterprise Operations Hub
                </h2>
                <p className="truncate text-[11px] sm:text-xs text-slate-500 capitalize font-semibold">
                  {userRole.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Notifications Link / Modal Trigger */}
              <Link
                to="/notifications"
                className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition"
                title="Notifications & Alerts"
              >
                <Bell size={18} className="sm:w-[19px] sm:h-[19px]" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white shadow-xs">
                    {unread}
                  </span>
                )}
              </Link>

              {/* Desktop User Profile Badge */}
              <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200 px-3.5 py-1.5 lg:flex">
                <UserCircle size={22} className="shrink-0 text-slate-500" />
                <div className="min-w-0">
                  <p className="max-w-40 truncate text-xs font-bold text-slate-900">
                    {user?.fullName ?? "User"}
                  </p>
                  <p className="max-w-40 truncate text-[11px] text-slate-500 font-medium">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Desktop Sign Out Button */}
              <Button
                variant="secondary"
                onClick={logout}
                className="hidden sm:inline-flex px-3 py-1.5 text-xs"
              >
                <LogOut size={15} className="mr-1.5" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content Body (with pb-24 on mobile to prevent bottom tab bar obstruction) */}
        <main className="min-w-0 overflow-x-hidden p-3 sm:p-5 lg:p-8 pb-24 xl:pb-10">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Slide-over Drawer for Mobile */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        menu={menu}
        user={user}
        role={userRole}
        logout={logout}
        unreadCount={unread}
      />

      {/* Persistent Bottom Tab Bar for Mobile screens (< xl) */}
      <MobileBottomBar
        role={userRole}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
        unreadCount={unread}
      />
    </div>
  );
}