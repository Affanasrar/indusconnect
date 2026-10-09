import { AlertCircle, RefreshCw } from "lucide-react";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  message = "We couldn't load this information. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle size={16} className="shrink-0 text-rose-600" />
        <span className="truncate font-medium">{message}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 transition active:scale-95"
        >
          <RefreshCw size={11} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
