import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export interface MobileCardProps {
  title: string;
  subtitle?: string;
  statusBadge?: {
    label: string;
    variant?: "success" | "warning" | "error" | "info" | "neutral" | "purple";
  };
  fields: MobileCardField[];
  actions?: React.ReactNode;
  expandableContent?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function MobileCard({
  title,
  subtitle,
  statusBadge,
  fields,
  actions,
  expandableContent,
  className = "",
  onClick,
}: MobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getBadgeClasses = (variant = "neutral") => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 text-[#16845B] border-emerald-200";
      case "warning":
        return "bg-amber-50 text-[#B7791F] border-amber-200";
      case "error":
        return "bg-rose-50 text-[#C43D4B] border-rose-200";
      case "info":
        return "bg-blue-50 text-[#1769E0] border-blue-200";
      case "neutral":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[#DCE5F0] bg-white p-4 transition ${
        onClick ? "cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-bold text-[#102644] leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="truncate text-[11px] font-medium text-[#64748B] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {statusBadge && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getBadgeClasses(
              statusBadge.variant
            )}`}
          >
            {statusBadge.label}
          </span>
        )}
      </div>

      {/* Metadata Fields Grid (2 Columns) */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-3 text-xs">
        {fields.map((field, idx) => (
          <div key={idx} className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              {field.label}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-[#102644] truncate">
              {field.icon && (
                <span className="shrink-0 text-slate-400">{field.icon}</span>
              )}
              <span className="truncate">{field.value ?? "—"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Accordion Content */}
      {expandableContent && (
        <div className="border-t border-[#F1F5F9] pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center justify-between w-full py-1 text-[11px] font-semibold text-[#1769E0] hover:underline transition"
          >
            <span>{isExpanded ? "Hide Details" : "View More Details"}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {isExpanded && (
            <div className="mt-2 pt-2 border-t border-dashed border-[#DCE5F0] text-xs text-[#64748B]">
              {expandableContent}
            </div>
          )}
        </div>
      )}

      {/* Actions Footer */}
      {actions && (
        <div className="mt-2.5 border-t border-[#F1F5F9] pt-2.5 flex items-center justify-end gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
