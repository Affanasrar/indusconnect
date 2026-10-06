import { useState } from "react";
import {
  X,
  Globe,
  Building2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface SsoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSsoAuthenticate: (email: string) => Promise<void>;
}

export default function SsoLoginModal({
  isOpen,
  onClose,
  onSsoAuthenticate,
}: SsoLoginModalProps) {
  const [ssoDomain, setSsoDomain] = useState("indusconnect.com");
  const [selectedProvider, setSelectedProvider] = useState<"azure" | "okta" | "google">("azure");
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  async function handleSsoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ssoDomain) return;

    setIsRedirecting(true);
    // Corporate federated routing simulation
    setTimeout(async () => {
      try {
        await onSsoAuthenticate("admin@indusconnect.com");
        onClose();
      } catch (err) {
        setIsRedirecting(false);
      }
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-blue-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Corporate Single Sign-On (SSO)
              </h3>
              <p className="text-xs text-slate-400">
                Federated enterprise authentication via SAML 2.0 / OIDC
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSsoSubmit} className="p-6 space-y-5">
          {/* IdP Providers */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Identity Provider (IdP)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedProvider("azure")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                  selectedProvider === "azure"
                    ? "border-blue-500 bg-blue-950/40 text-blue-300 shadow-sm"
                    : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-2xs font-bold mb-1.5">
                  M
                </div>
                <span className="text-2xs font-semibold">Microsoft Entra</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider("okta")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                  selectedProvider === "okta"
                    ? "border-blue-500 bg-blue-950/40 text-blue-300 shadow-sm"
                    : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <div className="h-6 w-6 rounded-md bg-sky-600 flex items-center justify-center text-white text-2xs font-bold mb-1.5">
                  O
                </div>
                <span className="text-2xs font-semibold">Okta Identity</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider("google")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                  selectedProvider === "google"
                    ? "border-blue-500 bg-blue-950/40 text-blue-300 shadow-sm"
                    : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <div className="h-6 w-6 rounded-md bg-red-600 flex items-center justify-center text-white text-2xs font-bold mb-1.5">
                  G
                </div>
                <span className="text-2xs font-semibold">Google Cloud</span>
              </button>
            </div>
          </div>

          {/* Domain / Tenant */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Organization Domain or Tenant ID
            </label>
            <div className="relative">
              <Globe
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                required
                value={ssoDomain}
                onChange={(e) => setSsoDomain(e.target.value)}
                placeholder="company.com"
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono"
              />
            </div>
            <p className="mt-1.5 text-2xs text-slate-400">
              Enter your corporate domain to route to your organization&apos;s Single Sign-On gateway.
            </p>
          </div>

          <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-3 flex items-start gap-2.5 text-2xs text-blue-300">
            <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Zero-Trust Network Access</span>: IndusConnect enforces conditional access policies and hardware token MFA on corporate SSO handshakes.
            </div>
          </div>

          <button
            type="submit"
            disabled={isRedirecting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition disabled:opacity-60"
          >
            {isRedirecting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Redirecting to {selectedProvider === "azure" ? "Microsoft Entra" : selectedProvider === "okta" ? "Okta" : "Google Cloud"} Gateway...</span>
              </div>
            ) : (
              <>
                <span>Authenticate via Corporate IdP</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-800/80 px-6 py-3 bg-slate-950/60 flex items-center justify-between text-2xs text-slate-500 font-mono">
          <span>Protocol: SAML 2.0 / OAuth2 OIDC</span>
          <span>SLA: 99.99% IdP Bridge</span>
        </div>
      </div>
    </div>
  );
}
