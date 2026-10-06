import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  ShieldCheck,
  X,
  Search,
  LogOut,
  UserCircle,
  Bus,
  MapPin,
  Car,
  Plane,
  Building2,
  Receipt,
  FileSpreadsheet,
  Settings,
  Bell,
  Wrench,
  FileText,
  Users,
  Compass,
  LayoutDashboard,
} from "lucide-react";

interface MenuItem {
  key: string;
  title: string;
  path: string;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menu: MenuItem[];
  user: any;
  role?: string;
  logout: () => void;
  unreadCount?: number;
}

// Icon helper per menu item
function getMenuIcon(key: string) {
  switch (key) {
    case "dashboard":
      return <LayoutDashboard size={18} />;
    case "shuttle-bookings":
      return <Bus size={18} />;
    case "routes":
      return <MapPin size={18} />;
    case "driver-trips":
      return <Compass size={18} />;
    case "telemetry":
      return <Compass size={18} />;
    case "vehicles":
      return <Car size={18} />;
    case "drivers":
      return <UserCircle size={18} />;
    case "travel-requests":
      return <Plane size={18} />;
    case "accommodation":
      return <Building2 size={18} />;
    case "expenses":
      return <Receipt size={18} />;
    case "vendors":
      return <Building2 size={18} />;
    case "erp-exports":
      return <FileSpreadsheet size={18} />;
    case "policies":
      return <Settings size={18} />;
    case "maintenance":
      return <Wrench size={18} />;
    case "reports":
      return <FileText size={18} />;
    case "audit-logs":
      return <ShieldCheck size={18} />;
    case "notifications":
      return <Bell size={18} />;
    case "users":
      return <Users size={18} />;
    default:
      return <LayoutDashboard size={18} />;
  }
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  menu,
  user,
  role,
  logout,
  unreadCount = 0,
}: MobileNavDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMenu = useMemo(() => {
    if (!searchTerm.trim()) return menu;
    const term = searchTerm.toLowerCase();
    return menu.filter((item) => item.title.toLowerCase().includes(term));
  }, [menu, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Content Drawer */}
      <aside className="relative flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                IndusConnect
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold">
                Mobility & Logistics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="border-b border-slate-100 bg-blue-50/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-base shadow-sm">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.fullName || "User"}
              </p>
              <p className="truncate text-xs text-slate-500 font-medium">
                {user?.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="inline-block rounded-md bg-blue-700 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {(role || user?.role?.name || "User").replace(/_/g, " ")}
                </span>
                {user?.department && (
                  <span className="inline-block rounded-md bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-semibold">
                    {user.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar for Menu */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter menu modules..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 text-slate-500">
                  {getMenuIcon(item.key)}
                </span>
                <span className="truncate">{item.title}</span>
              </div>
              {item.key === "notifications" && unreadCount > 0 && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Drawer Bottom Footer with Logout */}
        <div className="border-t border-slate-200 bg-slate-50/80 p-4 pb-safe">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-2.5 transition active:scale-98"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
