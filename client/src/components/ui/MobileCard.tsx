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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "error":
        return "bg-red-50 text-red-700 border-red-200";
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "neutral":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:shadow-sm ${
        onClick ? "cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900 leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="truncate text-[11px] font-semibold text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {statusBadge && (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getBadgeClasses(
              statusBadge.variant
            )}`}
          >
            {statusBadge.label}
          </span>
        )}
      </div>

      {/* Metadata Fields Grid (2 Columns) */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 py-3 text-xs">
        {fields.map((field, idx) => (
          <div key={idx} className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {field.label}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800 truncate">
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
        <div className="border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center justify-between w-full py-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 transition"
          >
            <span>{isExpanded ? "Hide Details" : "View More Details"}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isExpanded && (
            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-xs text-slate-600 animate-in fade-in">
              {expandableContent}
            </div>
          )}
        </div>
      )}

      {/* Actions Footer */}
      {actions && (
        <div className="mt-3 border-t border-slate-100 pt-3 flex items-center justify-end gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
