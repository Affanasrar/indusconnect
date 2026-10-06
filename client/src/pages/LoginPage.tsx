import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  LifeBuoy,
  X,
  Fingerprint,
  Radio,
  Car,
  Plane,
  Receipt,
  FileCheck2,
  Shield,
  Globe,
  Clock,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import EnterpriseDirectoryModal from "../components/auth/EnterpriseDirectoryModal";
import HelpdeskModal from "../components/auth/HelpdeskModal";
import SsoLoginModal from "../components/auth/SsoLoginModal";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Authentication State
  const [email, setEmail] = useState("admin@indusconnect.com");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCapsOn, setIsCapsOn] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals & Drawers
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);
  const [isSsoOpen, setIsSsoOpen] = useState(false);

  // Showcase Feature Tab State
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<0 | 1 | 2>(0);

  // Biometric status feedback
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  // If already authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Keyboard CapsLock detection
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.getModifierState) {
      setIsCapsOn(e.getModifierState("CapsLock"));
    }
  }

  // Submit Handler
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both work email and enterprise password.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard");
    } catch (err: any) {
      // In case admin seed was configured with Demo@123 or Admin@123
      if (email === "admin@indusconnect.com" && password === "Admin@123") {
        try {
          await login({ email: email.trim(), password: "Demo@123" });
          navigate("/dashboard");
          return;
        } catch {}
      }

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Authentication failed. Please verify corporate credentials or contact your IT administrator.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Persona Selected Handler
  async function handleSelectPersona(
    selectedEmail: string,
    selectedPass: string,
    autoSubmit = false
  ) {
    setEmail(selectedEmail);
    setPassword(selectedPass);
    setIsDirectoryOpen(false);

    if (autoSubmit) {
      setError("");
      setIsSubmitting(true);
      try {
        await login({ email: selectedEmail, password: selectedPass });
        navigate("/dashboard");
      } catch (err: any) {
        // Fallback for demo users
        try {
          await login({ email: selectedEmail, password: "Demo@123" });
          navigate("/dashboard");
        } catch (retryErr: any) {
          setError(
            retryErr.response?.data?.message ||
              "Could not sign in with this persona."
          );
          setIsSubmitting(false);
        }
      }
    }
  }

  // Biometric Mock Login Handler
  async function handleBiometricLogin() {
    setBiometricFeedback("Verifying device biometric signature (Face ID)...");
    setTimeout(async () => {
      try {
        await login({ email: "employee@indusconnect.com", password: "Demo@123" });
        navigate("/dashboard");
      } catch (err) {
        setBiometricFeedback(null);
        setError("Biometric identity verified, but fallback password required.");
      }
    }, 900);
  }

  // SSO Auth Handler
  async function handleSsoAuthenticate(ssoEmail: string) {
    setIsSubmitting(true);
    try {
      await login({ email: ssoEmail, password: "Demo@123" });
      navigate("/dashboard");
    } catch (err) {
      try {
        await login({ email: ssoEmail, password: "Admin@123" });
        navigate("/dashboard");
      } catch (loginErr: any) {
        setError("SSO handshake succeeded, but enterprise session initiation failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const featurePillars = [
    {
      title: "Autonomous Fleet Dispatch",
      badge: "Real-time Telemetry",
      icon: Car,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      description:
        "Real-time GPS telematics, AI route scheduling, multi-stop passenger manifest check-ins, and automated driver compliance.",
      metrics: [
        { label: "Active Shuttles", val: "248" },
        { label: "Dispatch Accuracy", val: "99.4%" },
      ],
    },
    {
      title: "Corporate Travel & Lodging",
      badge: "Policy Engine",
      icon: Plane,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description:
        "Multi-tier approval workflows, corporate guesthouse allocations, and automated per diem governance.",
      metrics: [
        { label: "Avg Approval SLA", val: "1.8 hrs" },
        { label: "Policy Compliance", val: "100%" },
      ],
    },
    {
      title: "Automated ERP Reconciliation",
      badge: "SAP & Oracle Sync",
      icon: Receipt,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      description:
        "Seamless expense verification, mileage auditing, and automated batch financial posting to enterprise ledgers.",
      metrics: [
        { label: "Audit Accuracy", val: "99.98%" },
        { label: "Reconciliation", val: "Instant" },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Modals */}
      <EnterpriseDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectPersona={handleSelectPersona}
      />

      <HelpdeskModal
        isOpen={isHelpdeskOpen}
        onClose={() => setIsHelpdeskOpen(false)}
        initialEmail={email}
      />

      <SsoLoginModal
        isOpen={isSsoOpen}
        onClose={() => setIsSsoOpen(false)}
        onSsoAuthenticate={handleSsoAuthenticate}
      />

      {/* Main Grid Viewport */}
      <main className="grid min-h-screen w-full lg:grid-cols-12">
        {/* ========================================================= */}
        {/* DESKTOP LEFT HERO SHOWCASE (Hidden on mobile/tablet < lg) */}
        {/* ========================================================= */}
        <section className="relative hidden lg:col-span-7 xl:col-span-7 lg:flex lg:flex-col lg:justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
          {/* Ambient Glow & Grid Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Top Bar: Brand & System Operational Status */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">
                    IndusConnect
                  </span>
                  <span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 text-3xs font-mono font-bold tracking-widest text-blue-300 uppercase">
                    v3.4 Enterprise
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Unified Enterprise Mobility & Logistics Suite
                </p>
              </div>
            </div>

            {/* System Operational Status Pill */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-2xs font-semibold text-emerald-300">
                All Systems Operational • 99.98% SLA
              </span>
            </div>
          </div>

          {/* Center Showcase Content */}
          <div className="relative z-10 my-auto py-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-blue-400 mb-4">
              <Radio size={12} className="animate-pulse" />
              <span>Global Transit Cloud & Telematics</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Enterprise Fleet, Travel & Expense Infrastructure.
            </h1>

            <p className="mt-4 text-base xl:text-lg text-slate-300 leading-relaxed font-normal">
              Empowering multinational enterprises to orchestrate daily employee
              commutes, corporate travel, facilities lodging, and ERP ledger
              settlement under zero-trust enterprise security.
            </p>

            {/* Feature Showcase Tabs */}
            <div className="mt-8">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                {featurePillars.map((pillar, idx) => (
                  <button
                    key={pillar.title}
                    type="button"
                    onClick={() => setActiveShowcaseTab(idx as 0 | 1 | 2)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      activeShowcaseTab === idx
                        ? "bg-slate-800 text-white shadow-md border border-slate-700"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    {pillar.title}
                  </button>
                ))}
              </div>

              {/* Active Tab Preview Card */}
              <div className="mt-4 rounded-3xl border border-slate-800/90 bg-slate-900/70 p-6 backdrop-blur-xl shadow-2xl">
                {(() => {
                  const current = featurePillars[activeShowcaseTab];
                  const Icon = current.icon;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${current.color}`}
                          >
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              {current.title}
                            </h3>
                            <span className="text-2xs font-mono text-slate-400">
                              {current.badge}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {current.metrics.map((m) => (
                            <div
                              key={m.label}
                              className="text-right border-l border-slate-800 pl-3"
                            >
                              <div className="text-xs font-bold text-blue-400 font-mono">
                                {m.val}
                              </div>
                              <div className="text-3xs uppercase tracking-wider text-slate-400">
                                {m.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-normal">
                        {current.description}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Live Telemetry Pulse Bar */}
            <div className="mt-8 grid grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
                <div className="text-xl font-extrabold text-white font-mono">248</div>
                <div className="text-3xs uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
                  Live Shuttles
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
                <div className="text-xl font-extrabold text-emerald-400 font-mono">
                  98.8%
                </div>
                <div className="text-3xs uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
                  On-Time Rate
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
                <div className="text-xl font-extrabold text-blue-400 font-mono">
                  1.4k+
                </div>
                <div className="text-3xs uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
                  Commuters
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
                <div className="text-xl font-extrabold text-white font-mono">Zero</div>
                <div className="text-3xs uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
                  Safety Alerts
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Compliance & Security Trust Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-6 text-2xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" />
                <span>SOC-2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={14} className="text-indigo-400" />
                <span>256-Bit TLS 1.3</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck2 size={14} className="text-emerald-400" />
                <span>ISO/IEC 27001</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe size={14} className="text-slate-400" />
                <span>GDPR Ready</span>
              </div>
            </div>

            <div className="text-3xs text-slate-400 font-mono">
              Cluster: us-east-prod-04
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT AUTHENTICATION PORTAL (Desktop & Mobile)           */}
        {/* ========================================================= */}
        <section className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-900/50 backdrop-blur-sm">
          {/* Mobile Top Header (Visible on small screens) */}
          <div className="flex items-center justify-between pb-6 lg:hidden border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  IndusConnect
                </h1>
                <p className="text-2xs text-blue-400 font-semibold uppercase tracking-wider">
                  Enterprise Cloud v3.4
                </p>
              </div>
            </div>

            {/* Mobile Directory Shortcut Pill */}
            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-2xs font-bold text-blue-400 hover:bg-blue-500/20 transition"
            >
              <Sparkles size={12} />
              <span>Test Roles</span>
            </button>
          </div>

          {/* Sign In Form Container */}
          <div className="mx-auto w-full max-w-md my-auto py-8">
            {/* Header Greeting */}
            <div className="mb-8">
              <div className="hidden lg:flex items-center justify-between mb-4">
                <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-2xs font-semibold text-slate-300">
                  Workstation Gateway
                </span>

                {/* Desktop Sandbox Switcher Trigger */}
                <button
                  type="button"
                  onClick={() => setIsDirectoryOpen(true)}
                  className="group flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-950/40 px-3 py-1.5 text-2xs font-bold text-blue-400 hover:bg-blue-900/50 hover:border-blue-400 transition"
                >
                  <Sparkles size={13} className="text-blue-400 group-hover:rotate-12 transition" />
                  <span>Enterprise Directory (8 Personas)</span>
                </button>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Sign In to IndusConnect
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Authenticate with your corporate credentials or single sign-on provider.
              </p>
            </div>

            {/* Biometric Status Feedback (Mobile simulated) */}
            {biometricFeedback && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-500/40 bg-blue-950/40 p-4 text-xs text-blue-200 animate-in fade-in">
                <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                <span>{biometricFeedback}</span>
              </div>
            )}

            {/* Error Notification Banner */}
            {error && (
              <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">
                      Authentication Failed
                    </span>
                    <span>{error}</span>
                  </div>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-rose-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Work Email Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Corporate Email
                  </label>
                  <span className="text-3xs font-mono text-slate-500">
                    Active Directory / SSO
                  </span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail size={17} />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@indusconnect.com"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-3.5 pl-10 pr-10 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Enterprise Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsHelpdeskOpen(true)}
                    className="text-2xs font-semibold text-blue-400 hover:text-blue-300 hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock size={17} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-3.5 pl-10 pr-12 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Real-time CapsLock detection alert */}
                {isCapsOn && (
                  <div className="mt-2 flex items-center gap-1.5 text-2xs font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-1.5 animate-in fade-in">
                    <AlertCircle size={13} className="text-amber-400" />
                    <span>Caps Lock is active. Passwords are case-sensitive.</span>
                  </div>
                )}
              </div>

              {/* Session Persistence & Security options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/30"
                  />
                  <span className="text-xs text-slate-300">
                    Keep me signed in for 30 days
                  </span>
                </label>

                <div className="flex items-center gap-1 text-3xs font-mono text-slate-400">
                  <Clock size={11} />
                  <span>Idle timeout: 12h</span>
                </div>
              </div>

              {/* Sign In Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Verifying Enterprise Credentials...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Workstation</span>
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition"
                    />
                  </>
                )}
              </button>

              {/* Biometrics button (Touch/FaceID mobile simulation) */}
              <button
                type="button"
                onClick={handleBiometricLogin}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-800/40 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <Fingerprint size={16} className="text-blue-400" />
                <span>Sign in with Registered Biometrics / Face ID</span>
              </button>
            </form>

            {/* Single Sign-On (SSO) Section */}
            <div className="mt-8">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative bg-slate-950 px-4 text-3xs font-bold uppercase tracking-widest text-slate-400">
                  Enterprise Single Sign-On
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsSsoOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-800/40 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <div className="h-4 w-4 rounded bg-blue-600 flex items-center justify-center text-white text-3xs font-bold">
                    M
                  </div>
                  <span>Microsoft Entra ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSsoOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-800/40 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <div className="h-4 w-4 rounded bg-sky-600 flex items-center justify-center text-white text-3xs font-bold">
                    O
                  </div>
                  <span>Okta Identity Cloud</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Directory Presets Drawer Opener (Visible on both viewports) */}
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-400" />
                  <span className="text-xs font-bold text-white">
                    Corporate Role Sandbox
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDirectoryOpen(true)}
                  className="text-2xs font-bold text-blue-400 hover:text-blue-300 hover:underline transition"
                >
                  View All 8 Roles →
                </button>
              </div>
              <p className="mt-1 text-2xs text-slate-400">
                Instantly test Transport Ops, Super Admin, Manager, Drivers, Finance, and Security.
              </p>

              {/* Quick Persona Chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { label: "Super Admin", email: "admin@indusconnect.com", pass: "Admin@123" },
                  { label: "Fleet Lead", email: "transport@indusconnect.com", pass: "Demo@123" },
                  { label: "Manager", email: "manager@indusconnect.com", pass: "Demo@123" },
                  { label: "Driver", email: "driver@indusconnect.com", pass: "Demo@123" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectPersona(item.email, item.pass, false)}
                    className="rounded-xl border border-slate-800 bg-slate-800/70 px-2.5 py-1 text-2xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-700 hover:text-white transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <footer className="mt-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-2xs text-slate-400">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsHelpdeskOpen(true)}
                className="hover:text-slate-300 transition flex items-center gap-1"
              >
                <LifeBuoy size={12} />
                <span>IT Service Desk</span>
              </button>
              <span>•</span>
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Enterprise Privacy Policy: All telemetry and logins are cryptographically logged for corporate compliance.");
                }}
                className="hover:text-slate-300 transition"
              >
                Privacy Policy
              </a>
              <span>•</span>
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Terms of Service: Authorized enterprise personnel only. Unauthorized access is logged and investigated.");
                }}
                className="hover:text-slate-300 transition"
              >
                Security Terms
              </a>
            </div>

            <div className="text-3xs text-slate-400 font-mono">
              © {new Date().getFullYear()} IndusConnect Technologies Inc.
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}