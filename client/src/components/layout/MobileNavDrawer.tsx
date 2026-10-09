import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  ShieldCheck,
  X,
  Search,
  LogOut,
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
      return <Users size={18} />;
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
        className="fixed inset-0 bg-[#0B1B33]/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Content Drawer */}
      <aside className="relative flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-300">
        {/* Drawer Header with Brand Styling */}
        <div className="flex h-16 items-center justify-between border-b border-[#DCE5F0] px-5 bg-[#102644] text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#36B8F5] border border-white/15 shadow-xs">
              <ShieldCheck size={20} className="text-[#36B8F5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                IndusConnect
              </h2>
              <p className="text-[10px] text-blue-200 font-semibold">
                Enterprise Mobility
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-blue-200 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="border-b border-[#DCE5F0] bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-[#102644] font-bold text-sm">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#102644]">
                {user?.fullName || "User"}
              </p>
              <p className="truncate text-[11px] text-[#64748B] font-medium">
                {user?.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="inline-block rounded-md bg-[#102644] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  {(role || user?.role?.name || "User").replace(/_/g, " ")}
                </span>
                {user?.department && (
                  <span className="inline-block rounded-md bg-white border border-[#DCE5F0] text-slate-700 px-1.5 py-0.5 text-[9px] font-semibold">
                    {user.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar for Menu */}
        <div className="p-3 border-b border-[#DCE5F0]">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search modules..."
              className="w-full rounded-lg border border-[#DCE5F0] bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium outline-hidden focus:bg-white focus:border-[#1769E0]"
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
                `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#1769E0] text-white font-bold shadow-xs"
                    : "text-slate-600 hover:bg-[#F6F8FC] hover:text-[#102644]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}>
                      {getMenuIcon(item.key)}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.key === "notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-[#C43D4B] px-1.5 py-0.2 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Drawer Bottom Footer with Logout */}
        <div className="border-t border-[#DCE5F0] bg-slate-50 p-4 pb-safe">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-2 transition active:scale-98"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
