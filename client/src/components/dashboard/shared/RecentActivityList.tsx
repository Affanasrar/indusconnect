import { Activity, Clock } from "lucide-react";
import EmptyState from "./EmptyState";

export interface ActivityItem {
  id: string;
  action: string;
  entityType?: string;
  userName?: string;
  userEmail?: string;
  details?: string;
  timestamp: string;
}

export interface RecentActivityListProps {
  items: ActivityItem[];
  emptyMessage?: string;
  className?: string;
}

function formatActionText(action: string, entityType?: string): string {
  const normAction = (action || "").toUpperCase();
  const entity = (entityType || "").replace(/_/g, " ").toLowerCase();

  switch (normAction) {
    case "CREATE":
      return `Created new ${entity || "record"}`;
    case "UPDATE":
      return `Updated ${entity || "record"}`;
    case "DELETE":
      return `Deleted ${entity || "record"}`;
    case "APPROVE":
      return `Approved ${entity || "request"}`;
    case "REJECT":
      return `Rejected ${entity || "request"}`;
    case "LOGIN":
      return "Signed in to IndusConnect";
    case "ASSIGN":
      return `Assigned ${entity || "resource"}`;
    case "START_TRIP":
      return "Started transport route";
    case "END_TRIP":
      return "Completed transport trip";
    case "FLAG":
      return `Flagged ${entity || "claim"} for review`;
    default:
      return `${normAction.replace(/_/g, " ")} on ${entity || "system"}`;
  }
}

export default function RecentActivityList({
  items,
  emptyMessage = "No recent activity recorded.",
  className = "",
}: RecentActivityListProps) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No activity"
        description={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <div
      className={`divide-y divide-[#F1F5F9] rounded-xl border border-[#DCE5F0] bg-white overflow-hidden ${className}`}
    >
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-3.5 hover:bg-slate-50/50 transition">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1769E0] mt-0.5">
            <Activity size={14} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#102644] truncate">
                {formatActionText(item.action, item.entityType)}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#64748B] shrink-0">
                <Clock size={11} />
                <span>
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#64748B] truncate">
              {item.userName && <span className="font-medium text-slate-700">{item.userName}</span>}
              {item.details && <span>&bull; {item.details}</span>}
              <span>
                &bull; {new Date(item.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
