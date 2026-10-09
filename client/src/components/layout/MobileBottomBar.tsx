import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bus,
  Plane,
  Receipt,
  Menu,
  Compass,
  MapPin,
  Bell,
  CheckSquare,
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
  const getTabs = (): BottomTab[] => {
    switch (role) {
      case "DRIVER":
        return [
          {
            key: "dashboard",
            title: "Home",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "routes",
            title: "Routes",
            path: "/routes",
            icon: (a) => <MapPin size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "driver-trips",
            title: "Trips",
            path: "/driver-trips",
            icon: (a) => <Compass size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "notifications",
            title: "Alerts",
            path: "/notifications",
            icon: (a) => (
              <div className="relative">
                <Bell size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#C43D4B] text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            ),
          },
        ];

      case "SUPER_ADMIN":
      case "MANAGER":
        return [
          {
            key: "dashboard",
            title: "Dashboard",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "travel-requests",
            title: "Travel",
            path: "/travel-requests",
            icon: (a) => <Plane size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "shuttle-bookings",
            title: "Shuttles",
            path: "/shuttle-bookings",
            icon: (a) => <Bus size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "expenses",
            title: "Expenses",
            path: "/expenses",
            icon: (a) => <Receipt size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
        ];

      case "FINANCE_OFFICER":
        return [
          {
            key: "dashboard",
            title: "Dashboard",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "expenses",
            title: "Claims",
            path: "/expenses",
            icon: (a) => <Receipt size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "erp-exports",
            title: "ERP Sync",
            path: "/erp-exports",
            icon: (a) => <CheckSquare size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "notifications",
            title: "Alerts",
            path: "/notifications",
            icon: (a) => (
              <div className="relative">
                <Bell size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#C43D4B] text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            ),
          },
        ];

      default:
        // Employee default
        return [
          {
            key: "dashboard",
            title: "Home",
            path: "/dashboard",
            icon: (a) => <LayoutDashboard size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "shuttle-bookings",
            title: "Shuttle",
            path: "/shuttle-bookings",
            icon: (a) => <Bus size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "travel-requests",
            title: "Travel",
            path: "/travel-requests",
            icon: (a) => <Plane size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
          {
            key: "expenses",
            title: "Expenses",
            path: "/expenses",
            icon: (a) => <Receipt size={19} className={a ? "text-[#1769E0]" : "text-slate-400"} />,
          },
        ];
    }
  };

  const tabs = getTabs();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE5F0] xl:hidden pb-safe shadow-[0_-4px_16px_rgba(16,38,68,0.04)]">
      <nav className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition group active:scale-95 ${
                isActive ? "text-[#1769E0] font-bold" : "text-slate-500 font-medium hover:text-[#102644]"
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
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 font-medium hover:text-[#102644] active:scale-95 transition"
        >
          <div className="relative mb-0.5">
            <Menu size={19} className="text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-[#C43D4B]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </nav>
    </div>
  );
}
