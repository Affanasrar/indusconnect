import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  iconTone?: "blue" | "navy" | "amber" | "emerald" | "slate" | "rose";
  to?: string;
  onClick?: () => void;
  className?: string;
}

export default function KpiCard({
  label,
  value,
  subtitle,
  icon,
  iconTone = "blue",
  to,
  onClick,
  className = "",
}: KpiCardProps) {
  const toneMap = {
    blue: "bg-blue-50 text-[#1769E0]",
    navy: "bg-slate-100 text-[#102644]",
    amber: "bg-amber-50 text-[#B7791F]",
    emerald: "bg-emerald-50 text-[#16845B]",
    rose: "bg-rose-50 text-[#C43D4B]",
    slate: "bg-slate-100 text-slate-600",
  };

  const content = (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border border-[#DCE5F0] bg-white p-5 transition-all duration-200 ${
        to || onClick
          ? "cursor-pointer hover:border-[#1769E0]/40 hover:shadow-xs active:scale-[0.99]"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#64748B] tracking-wide truncate">
            {label}
          </p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#102644] sm:text-3xl">
            {value}
          </div>
        </div>

        {icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${toneMap[iconTone]}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#F1F5F9] pt-2.5">
        <span className="text-xs text-[#64748B] truncate">
          {subtitle || "Current status"}
        </span>

        {to && (
          <span className="inline-flex items-center text-xs font-semibold text-[#1769E0] group-hover:underline">
            <span>View</span>
            <ArrowUpRight size={14} className="ml-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  return content;
}
