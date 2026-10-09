import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title = "No records found",
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DCE5F0] bg-slate-50/50 p-8 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#64748B]">
        {icon || <Inbox size={22} />}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[#102644]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-[#64748B] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
