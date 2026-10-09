import { useState, useMemo } from "react";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  Truck,
  UserCheck,
  Route as RouteIcon,
  Navigation,
  BusFront,
  Plane,
  Building2,
  Receipt,
  Store,
  FileText,
  Radio,
  CheckSquare,
  History,
  BarChart3,
  ChevronDown,
  Building,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import MobileNavDrawer from "./MobileNavDrawer";
import MobileBottomBar from "./MobileBottomBar";
import UserProfileModal from "./UserProfileModal";

function getMenuIcon(key: string, path: string) {
  const normKey = (key || "").toLowerCase();
  const normPath = (path || "").toLowerCase();

  if (normKey.includes("dashboard") || normPath.includes("dashboard")) return LayoutDashboard;
  if (normKey.includes("user") || normPath.includes("user")) return Users;
  if (normKey.includes("vehicle") || normPath.includes("vehicle")) return Truck;
  if (normKey.includes("driver") && !normKey.includes("trip")) return UserCheck;
  if (normKey.includes("drivertrip") || normPath.includes("driver-trip")) return Navigation;
  if (normKey.includes("shuttle") || normPath.includes("shuttle")) return BusFront;
  if (normKey.includes("route") || normPath.includes("route")) return RouteIcon;
  if (normKey.includes("travel") || normPath.includes("travel")) return Plane;
  if (normKey.includes("accommodation") || normPath.includes("accommodation")) return Building2;
  if (normKey.includes("expense") || normPath.includes("expense")) return Receipt;
  if (normKey.includes("vendor") || normPath.includes("vendor")) return Store;
  if (normKey.includes("policy") || normPath.includes("policy")) return FileText;
  if (normKey.includes("telemetry") || normPath.includes("telemetry")) return Radio;
  if (normKey.includes("approval") || normPath.includes("approval")) return CheckSquare;
  if (normKey.includes("audit") || normPath.includes("audit")) return History;
  if (normKey.includes("report") || normPath.includes("report")) return BarChart3;

  return LayoutDashboard;
}

const PAGE_TITLE_MAP: Record<string, string> = {
  "/dashboard": "Enterprise Dashboard",
  "/users": "User Management",
  "/vehicles": "Fleet & Vehicles",
  "/drivers": "Driver Directory",
  "/routes": "Routes & Smart Stops",
  "/shuttle-bookings": "Shuttle Bookings",
  "/driver-trips": "Driver Trips & Manifests",
  "/travel-requests": "Travel Requests & Approvals",
  "/accommodation": "Accommodation & Lodging",
  "/expenses": "Expenses & Claims",
  "/vendors": "Vendor Management",
  "/telemetry": "Live Transit Telemetry",
  "/notifications": "Notifications & Alerts",
  "/proxy-bookings": "Proxy Bookings",
  "/policies": "Approval Policies",
  "/maintenance": "Vehicle Maintenance & Housekeeping",
  "/erp-exports": "ERP Payroll Exports",
  "/reports": "Reports & Analytics",
  "/audit-logs": "Audit Logs Ledger",
};

export default function AppLayout() {
  const { bootstrap, user, logout } = useAuth();
  const location = useLocation();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const menu = bootstrap?.menu ?? [];
  const unread = bootstrap?.notificationSummary?.unread ?? 0;
  const userRole = (bootstrap?.role ?? user?.role?.name ?? "EMPLOYEE").toUpperCase();

  const currentPageTitle = useMemo(() => {
    return PAGE_TITLE_MAP[location.pathname] || "Enterprise Platform";
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F6F8FC] font-sans antialiased">
      {/* Desktop Persistent Left Sidebar (>= xl) */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-[#DCE5F0] bg-white xl:block">
        {/* Brand Header */}
        <div className="flex h-18 items-center gap-3 border-b border-[#DCE5F0] px-5 bg-[#102644] text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#36B8F5] border border-white/15 shadow-xs">
            <ShieldCheck size={22} className="text-[#36B8F5]" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-white leading-tight">
              IndusConnect
            </h1>
            <p className="truncate text-[10px] text-blue-200 font-semibold uppercase tracking-wider">
              Enterprise Mobility
            </p>
          </div>
        </div>

        {/* Navigation Modules */}
        <nav className="h-[calc(100vh-72px)] space-y-1 overflow-y-auto p-3 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Navigation
          </div>

          {menu.map((item) => {
            const Icon = getMenuIcon(item.key, item.path);
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#1769E0] text-white font-bold shadow-xs"
                      : "text-slate-600 hover:bg-[#F6F8FC] hover:text-[#102644]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={`shrink-0 transition ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-[#102644]"
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Container Area */}
      <div className="min-w-0 xl:pl-64">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 border-b border-[#DCE5F0] bg-white/95 backdrop-blur-md">
          <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="shrink-0 rounded-lg border border-[#DCE5F0] p-2 text-slate-600 hover:bg-slate-100 xl:hidden active:scale-95 transition"
                aria-label="Open mobile navigation menu"
              >
                <Menu size={18} />
              </button>

              {/* Breadcrumb / Page Title */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-xs text-[#64748B]">IndusConnect</span>
                  <span className="hidden sm:inline text-slate-300">/</span>
                  <h2 className="truncate text-sm sm:text-base font-bold text-[#102644] leading-tight">
                    {currentPageTitle}
                  </h2>
                </div>
              </div>
            </div>

            {/* Topbar Right Controls */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Organization Pill Badge */}
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-[#DCE5F0] bg-[#F6F8FC] px-3 py-1 text-xs font-semibold text-[#102644]">
                <Building size={13} className="text-[#1769E0]" />
                <span>IndusConnect Enterprise</span>
              </div>

              {/* Notifications Icon with Badge */}
              <Link
                to="/notifications"
                className="relative rounded-lg border border-[#DCE5F0] p-2 text-slate-600 hover:bg-[#F6F8FC] hover:text-[#1769E0] transition"
                title="Notifications"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C43D4B] px-1 text-[10px] font-bold text-white shadow-2xs">
                    {unread}
                  </span>
                )}
              </Link>

              {/* User Profile Pill */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 rounded-lg border border-[#DCE5F0] bg-white px-2.5 py-1.5 text-left hover:bg-[#F6F8FC] transition active:scale-95"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#102644] font-bold text-xs shrink-0">
                  {user?.fullName?.charAt(0) || "U"}
                </div>
                <div className="hidden sm:block min-w-0 max-w-32">
                  <p className="truncate text-xs font-bold text-[#102644]">
                    {user?.fullName || "User Profile"}
                  </p>
                  <p className="truncate text-[10px] text-[#64748B] uppercase font-semibold">
                    {userRole.replace(/_/g, " ")}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:inline" />
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={logout}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-slate-50 hover:text-rose-600 transition"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="min-w-0 overflow-x-hidden p-3.5 sm:p-6 lg:p-8 pb-24 xl:pb-12">
          <div className="mx-auto w-full max-w-[1560px] min-w-0">
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

      {/* User Account / Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        role={userRole}
        logout={logout}
      />
    </div>
  );
}