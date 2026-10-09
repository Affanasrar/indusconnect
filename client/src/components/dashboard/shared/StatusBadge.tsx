import { useMemo } from "react";

export interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export default function StatusBadge({
  status = "PENDING",
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const norm = (status || "").toUpperCase().replace(/[\s-]/g, "_");

  const { label, style } = useMemo(() => {
    switch (norm) {
      case "APPROVED":
      case "CONFIRMED":
      case "ACTIVE":
      case "COMPLETED":
      case "CHECKED_OUT":
      case "PAID":
      case "SYNCED":
      case "VALID":
      case "PASSED":
        return {
          label: norm === "APPROVED" ? "Approved" : norm === "COMPLETED" ? "Completed" : norm.replace(/_/g, " "),
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };

      case "PENDING":
      case "PENDING_APPROVAL":
      case "SUBMITTED":
      case "CHECKLIST_PENDING":
      case "WAITING":
      case "NOT_READY":
      case "OPEN":
        return {
          label: norm === "PENDING_APPROVAL" ? "Pending Approval" : norm === "PENDING" ? "Pending" : norm.replace(/_/g, " "),
          style: "bg-amber-50 text-amber-700 border-amber-200",
        };

      case "FLAGGED":
      case "ANOMALY_REVIEW_REQUIRED":
      case "RETURNED":
      case "RETURNED_FOR_CORRECTION":
      case "NEEDS_REVIEW":
      case "WARNING":
      case "REVIEW_REQUIRED":
        return {
          label: norm === "RETURNED_FOR_CORRECTION" ? "Returned for Correction" : norm === "ANOMALY_REVIEW_REQUIRED" ? "Needs Review" : norm.replace(/_/g, " "),
          style: "bg-orange-50 text-orange-700 border-orange-200",
        };

      case "REJECTED":
      case "CANCELLED":
      case "FAILED":
      case "BLOCKED":
      case "EXPIRED":
      case "BREAKDOWN":
      case "SOS":
      case "NO_SHOW":
        return {
          label: norm === "REJECTED" ? "Rejected" : norm === "CANCELLED" ? "Cancelled" : norm.replace(/_/g, " "),
          style: "bg-rose-50 text-rose-700 border-rose-200",
        };

      case "IN_PROGRESS":
      case "ASSIGNED":
      case "READY":
      case "MOVING":
      case "CHECKED_IN":
      case "READY_FOR_EXPORT":
        return {
          label: norm === "IN_PROGRESS" ? "In Progress" : norm === "ASSIGNED" ? "Assigned" : norm.replace(/_/g, " "),
          style: "bg-blue-50 text-blue-700 border-blue-200",
        };

      case "DRAFT":
      case "STOPPED":
      case "OFFLINE":
      default:
        return {
          label: norm ? norm.replace(/_/g, " ") : "Draft",
          style: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  }, [norm]);

  const sizeClass =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 leading-tight font-semibold"
      : "text-xs px-2.5 py-1 leading-normal font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border tracking-wide capitalize ${sizeClass} ${style} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      <span>{label}</span>
    </span>
  );
}
