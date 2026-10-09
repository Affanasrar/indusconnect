import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  action,
  onRefresh,
  isRefreshing = false,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-[#DCE5F0]/80">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102644]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs sm:text-sm text-[#64748B]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F0] bg-white px-3 py-2 text-xs font-semibold text-[#102644] hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={13}
              className={`text-[#64748B] ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        )}

        {action}
      </div>
    </div>
  );
}
