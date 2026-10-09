import { useState, type FormEvent } from "react";
import {
  X,
  Radio,
  PhoneCall,
  AlertTriangle,
  Send,
  CheckCircle2,
  Navigation,
} from "lucide-react";

interface FleetDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FleetDispatchModal({
  isOpen,
  onClose,
}: FleetDispatchModalProps) {
  const [dispatchMessage, setDispatchMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!dispatchMessage.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  }

  function handleReset() {
    setIsSubmitted(false);
    setDispatchMessage("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-slate-900/95 text-slate-100 shadow-2xl shadow-cyan-950/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Fleet Dispatch Center
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-3xs font-mono font-bold text-emerald-300">
                  LIVE DESK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transit & Stay Central Control • Route 4 Operations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Active Live Alert Box matching Dashboard */}
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Route 4 Weather Advisory
                  </span>
                  <span className="text-3xs text-amber-400 font-mono">10-15m Delay</span>
                </div>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  Heavy rain expected on Route 4. Shuttles may experience 10-15 min delays.
                  Emergency Support Hotline is on high alert.
                </p>
              </div>
            </div>
          </div>

          {/* Hotline Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                <PhoneCall size={18} />
              </div>
              <div>
                <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400">
                  Emergency Support Hotline
                </p>
                <a
                  href="tel:+18005550199"
                  className="text-sm font-mono font-bold text-cyan-300 hover:text-cyan-200 hover:underline"
                >
                  +1 (800) 555-0199
                </a>
              </div>
            </div>
            <a
              href="tel:+18005550199"
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-300 transition"
            >
              Call Desk
            </a>
          </div>

          {/* Quick Dispatch Radio Message Form */}
          {isSubmitted ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 text-center animate-in fade-in">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white">
                Dispatch Acknowledged
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Your radio message has been routed to Route 4 controllers. A dispatcher will reach out to your device shortly.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Direct Dispatch Message</span>
                <span className="text-3xs text-cyan-400 font-mono flex items-center gap-1">
                  <Navigation size={10} /> GPS Telematics Linked
                </span>
              </label>
              <textarea
                rows={3}
                required
                value={dispatchMessage}
                onChange={(e) => setDispatchMessage(e.target.value)}
                placeholder="Inquire about shuttle pickup, flight connection delay, or urgent guesthouse transfer..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 p-3.5 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 resize-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send to Fleet Operations Dispatch</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
            <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-800">
              <div className="text-xs font-mono font-bold text-cyan-400">42</div>
              <div className="text-3xs text-slate-400">Active Shuttles</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-800">
              <div className="text-xs font-mono font-bold text-emerald-400">94%</div>
              <div className="text-3xs text-slate-400">Fleet Capacity</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/30 border border-slate-800">
              <div className="text-xs font-mono font-bold text-purple-400">&lt; 3 min</div>
              <div className="text-3xs text-slate-400">Avg SLA Response</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
