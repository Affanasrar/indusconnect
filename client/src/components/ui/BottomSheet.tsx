import React, { useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  maxWidth?: string; // e.g. "sm:max-w-xl", "sm:max-w-2xl"
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footerActions,
  maxWidth = "sm:max-w-lg",
}: BottomSheetProps) {
  // Prevent background scrolling while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container: Bottom Sheet on Mobile, Centered Modal on sm+ */}
      <div
        className={`relative flex w-full flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] sm:max-h-[85vh] ${maxWidth} overflow-hidden z-10 transition-transform animate-in slide-in-from-bottom duration-300`}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:py-4">
          <div className="min-w-0 pr-4">
            <h3 className="truncate text-base sm:text-lg font-bold text-slate-900">
              {title}
            </h3>
            {subtitle && (
              <p className="truncate text-xs font-medium text-slate-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 touch-pan-y">
          {children}
        </div>

        {/* Footer Actions */}
        {footerActions && (
          <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 pb-safe sm:pb-3.5 flex items-center justify-end gap-2.5">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
}
