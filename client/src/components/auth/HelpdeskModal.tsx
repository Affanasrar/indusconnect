import { useState, type FormEvent } from "react";
import {
  X,
  LifeBuoy,
  Mail,
  PhoneCall,
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

interface HelpdeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function HelpdeskModal({
  isOpen,
  onClose,
  initialEmail = "",
}: HelpdeskModalProps) {
  const [resetEmail, setResetEmail] = useState(initialEmail);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    if (!resetEmail) return;

    setIsLoading(true);
    // Simulate enterprise identity directory self-service dispatch
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 700);
  }

  function handleReset() {
    setIsSubmitted(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-blue-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <LifeBuoy size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Enterprise IT Support & Access
              </h3>
              <p className="text-xs text-slate-400">
                Self-service password recovery & service desk assistance
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recovery Form */}
          {isSubmitted ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="mt-3 text-base font-bold text-white">
                Recovery Instructions Dispatched
              </h4>
              <p className="mt-1.5 text-xs text-slate-300">
                If <strong className="text-emerald-300 font-mono">{resetEmail}</strong> is registered with an active Active Directory / IndusConnect account, a secure credential reset link has been dispatched.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-2xs text-slate-400">
                <Clock size={12} />
                <span>Link valid for 15 minutes • Single-use token</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Corporate Work Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. employee@indusconnect.com"
                    className="w-full rounded-xl bg-slate-800/90 border border-slate-700 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Verifying Corporate Identity...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Self-Service Password Reset</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* IT Helpdesk Channels */}
          <div className="border-t border-slate-800/80 pt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Corporate Support Channels
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 flex items-start gap-2.5">
                <Mail size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Global IT Helpdesk</div>
                  <div className="text-2xs text-slate-400 font-mono">support@indusconnect.com</div>
                  <div className="text-2xs text-slate-500 mt-1">SLA: &lt; 15 mins for tier 1</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 flex items-start gap-2.5">
                <PhoneCall size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Internal VOIP / Tel</div>
                  <div className="text-2xs text-slate-400 font-mono">+1 (800) 555-4638 ext. 4400</div>
                  <div className="text-2xs text-slate-500 mt-1">24/7 Operations Desk</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-rose-950/60 bg-rose-950/20 p-3 flex items-center gap-2.5 text-xs text-rose-300">
              <ShieldAlert size={16} className="text-rose-400 shrink-0" />
              <span>
                For security compromises or lost corporate hardware keys, contact the SOC emergency hotline immediately.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 px-6 py-3.5 bg-slate-950/60 flex items-center justify-between text-2xs text-slate-400">
          <span>Indus Technologies Identity Governance</span>
          <a
            href="#compliance"
            onClick={(e) => {
              e.preventDefault();
              alert("Enterprise Security Policy: All password resets require multi-factor verification.");
            }}
            className="flex items-center gap-1 hover:text-blue-400 transition"
          >
            <span>Security Policy</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
