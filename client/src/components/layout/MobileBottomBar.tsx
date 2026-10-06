import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bus,
  Plane,
  Receipt,
  Menu,
  Compass,
  MapPin,
  Building2,
  FileSpreadsheet,
  Wrench,
  Bell,
} from "lucide-react";

interface MobileBottomBarProps {
  role?: string;
  onOpenMenu: () => void;
  unreadCount?: number;
}

interface BottomTab {
  key: string;
  title: string;
  path: string;
  icon: (active: boolean) => React.ReactNode;
}

export default function MobileBottomBar({
  role = "EMPLOYEE",
  onOpenMenu,
  unreadCount = 0,
}: MobileBottomBarProps) {
  // Determine role-specific 4 quick navigation links
  const getTabs = (): BottomTab[] => {
    switch (role) {
      case "DRIVER":
        return [
          {
            key: "dashboard",
            title: "Home",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "routes",
            title: "Routes",
            path: "/routes",
            icon: (a) => <MapPin size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "driver-trips",
            title: "Trips",
            path: "/driver-trips",
            icon: (a) => <Compass size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "notifications",
            title: "Alerts",
            path: "/notifications",
            icon: (a) => (
              <div className="relative">
                <Bell size={20} className={a ? "text-blue-700" : "text-slate-500"} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            ),
          },
        ];

      case "TRANSPORT_ADMIN":
        return [
          {
            key: "dashboard",
            title: "Home",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "shuttle-bookings",
            title: "Shuttles",
            path: "/shuttle-bookings",
            icon: (a) => <Bus size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "routes",
            title: "Routes",
            path: "/routes",
            icon: (a) => <MapPin size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "telemetry",
            title: "Live GPS",
            path: "/telemetry",
            icon: (a) => <Compass size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
        ];

      case "ACCOMMODATION_ADMIN":
        return [
          {
            key: "dashboard",
            title: "Home",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "accommodation",
            title: "Rooms",
            path: "/accommodation",
            icon: (a) => <Building2 size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "maintenance",
            title: "Housekeep",
            path: "/maintenance",
            icon: (a) => <Wrench size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "travel-requests",
            title: "Travel",
            path: "/travel-requests",
            icon: (a) => <Plane size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
        ];

      case "FINANCE_OFFICER":
        return [
          {
            key: "dashboard",
            title: "Home",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "expenses",
            title: "Claims",
            path: "/expenses",
            icon: (a) => <Receipt size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "vendors",
            title: "Vendors",
            path: "/vendors",
            icon: (a) => <Building2 size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "erp-exports",
            title: "ERP Sync",
            path: "/erp-exports",
            icon: (a) => <FileSpreadsheet size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
        ];

      case "EMPLOYEE":
      default:
        return [
          {
            key: "dashboard",
            title: "Home",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "shuttle-bookings",
            title: "Shuttle",
            path: "/shuttle-bookings",
            icon: (a) => <Bus size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "travel-requests",
            title: "Travel",
            path: "/travel-requests",
            icon: (a) => <Plane size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
          {
            key: "expenses",
            title: "Expenses",
            path: "/expenses",
            icon: (a) => <Receipt size={20} className={a ? "text-blue-700" : "text-slate-500"} />,
          },
        ];
    }
  };

  const tabs = getTabs();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 xl:hidden pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <nav className="flex items-center justify-around h-15 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition group active:scale-95 ${
                isActive ? "text-blue-700 font-bold" : "text-slate-500 font-medium hover:text-slate-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative mb-0.5">{tab.icon(isActive)}</div>
                <span className="text-[10px] tracking-tight">{tab.title}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* 5th Tab: Menu Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 font-medium hover:text-slate-800 active:scale-95 transition"
        >
          <div className="relative mb-0.5">
            <Menu size={20} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </nav>
    </div>
  );
}
