import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Check,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";

export interface AttentionItem {
  id: string;
  title: string;
  subtitle?: string;
  referenceNumber?: string;
  status: string;
  date?: string;
  actionLabel?: string;
  actionUrl: string;
  isUrgent?: boolean;
  canQuickApprove?: boolean;
  rawType?: "travel" | "expense" | "maintenance" | "shuttle";
  rawId?: string;
}

export interface NeedsAttentionListProps {
  items: AttentionItem[];
  emptyMessage?: string;
  onQuickApprove?: (item: AttentionItem) => Promise<void>;
  onQuickReject?: (item: AttentionItem, reason?: string) => Promise<void>;
  className?: string;
}

export default function NeedsAttentionList({
  items,
  emptyMessage = "You're all caught up. There are no items needing attention right now.",
  onQuickApprove,
  onQuickReject,
  className = "",
}: NeedsAttentionListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="All clear"
        description={emptyMessage}
        className={className}
      />
    );
  }

  async function handleApprove(item: AttentionItem) {
    if (!onQuickApprove) return;
    try {
      setProcessingId(item.id);
      await onQuickApprove(item);
      setSuccessId(item.id);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error("Failed to approve item:", err);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(item: AttentionItem) {
    if (!onQuickReject) return;
    const reason = window.prompt("Enter rejection reason (optional):") ?? "";
    try {
      setProcessingId(item.id);
      await onQuickReject(item, reason);
    } catch (err) {
      console.error("Failed to reject item:", err);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div
      className={`divide-y divide-[#F1F5F9] rounded-xl border border-[#DCE5F0] bg-white overflow-hidden ${className}`}
    >
      {items.map((item) => {
        const isProcessing = processingId === item.id;
        const isSuccess = successId === item.id;

        return (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition ${
              isSuccess ? "bg-emerald-50/50" : "hover:bg-slate-50/70"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isSuccess
                    ? "bg-emerald-100 text-[#16845B]"
                    : item.isUrgent
                    ? "bg-rose-50 text-[#C43D4B]"
                    : "bg-amber-50 text-[#B7791F]"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 size={16} />
                ) : item.isUrgent ? (
                  <AlertCircle size={15} />
                ) : (
                  <Clock size={15} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#102644]">
                    {item.title}
                  </span>
                  {item.referenceNumber && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-[#64748B]">
                      {item.referenceNumber}
                    </span>
                  )}
                  <StatusBadge
                    status={isSuccess ? "APPROVED" : item.status}
                    size="sm"
                  />
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
                  {item.subtitle && <span>{item.subtitle}</span>}
                  {item.subtitle && item.date && <span>&bull;</span>}
                  {item.date && (
                    <span>
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              {item.canQuickApprove && onQuickApprove && !isSuccess && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(item)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-2xs"
                    title="Quick Approve"
                  >
                    {isProcessing ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    <span>Approve</span>
                  </button>

                  {onQuickReject && (
                    <button
                      type="button"
                      onClick={() => handleReject(item)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
                      title="Reject"
                    >
                      <X size={13} />
                      <span className="hidden xs:inline">Reject</span>
                    </button>
                  )}
                </>
              )}

              {isSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <Check size={14} /> Approved
                </span>
              )}

              <Link
                to={item.actionUrl}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#102644] hover:border-[#1769E0] hover:text-[#1769E0] transition active:scale-95"
              >
                <span>{item.actionLabel || "Review"}</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
