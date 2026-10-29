import { useState, useRef, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Building2,
  Info,
  Bus,
  Plane,
  Car,
  FileText,
  Loader2,
  Phone,
  KeyRound,
  Lock,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import HelpdeskModal from "../components/auth/HelpdeskModal";
import SsoLoginModal from "../components/auth/SsoLoginModal";

/* ─────────────────────────────────────────────
   IndusConnect — Simplified Login Page
   Supports Phone Number + 4-Digit PIN (Default for Drivers & Staff)
   and Email + Password (for Management)
   ───────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  /* ── Auth Mode: PHONE (default) or EMAIL ── */
  const [authMethod, setAuthMethod] = useState<"PHONE" | "EMAIL">("PHONE");

  /* ── Phone + 4-digit PIN state ── */
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [pinTouched, setPinTouched] = useState(false);

  /* ── Email + Password state ── */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  /* ── Form state ── */
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Modals ── */
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);
  const [isSsoOpen, setIsSsoOpen] = useState(false);

  /* ── Refs ── */
  const passwordRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  /* ── Already authenticated → redirect ── */
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  /* ── Validation helpers ── */
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const showPhoneError = phoneTouched && (!cleanPhone || cleanPhone.length < 7);
  const showPinError = pinTouched && pin.length !== 4;
  const showEmailError = emailTouched && email.length > 0 && !isValidEmail;
  const showPasswordError = passwordTouched && password.length === 0;

  /* ── Quick fill for testing & field drivers ── */
  function handleQuickFill(selectedPhone: string, defaultPin: string = "1234") {
    setAuthMethod("PHONE");
    setPhone(selectedPhone);
    setPin(defaultPin);
    setError("");
  }

  /* ── Submit handler ── */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (authMethod === "PHONE") {
      setPhoneTouched(true);
      setPinTouched(true);

      if (!cleanPhone || cleanPhone.length < 7) {
        setError("Please enter a valid mobile phone number.");
        return;
      }

      if (!pin || pin.length !== 4) {
        setError("Please enter your 4-digit security PIN.");
        return;
      }

      setIsSubmitting(true);
      try {
        await login({ phone: cleanPhone, pin: pin.trim() });
        navigate("/dashboard");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Unable to sign in. Please verify your phone number and 4-digit PIN.";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setEmailTouched(true);
      setPasswordTouched(true);

      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        return;
      }

      if (!isValidEmail) {
        setError("Please enter a valid email address.");
        return;
      }

      setIsSubmitting(true);
      try {
        await login({ email: email.trim(), password });
        navigate("/dashboard");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Unable to sign in with those details. Check your information and try again.";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  /* ── SSO handler ── */
  async function handleSsoAuthenticate(ssoEmail: string) {
    setIsSubmitting(true);
    try {
      await login({ email: ssoEmail, password: "Demo@123" });
      navigate("/dashboard");
    } catch {
      try {
        await login({ email: ssoEmail, password: "Admin@123" });
        navigate("/dashboard");
      } catch {
        setError("SSO login failed. Please sign in with your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Decorative network SVG ── */
  const NetworkIllustration = () => (
    <svg
      viewBox="0 0 480 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto opacity-30"
      aria-hidden="true"
    >
      <line x1="60" y1="140" x2="160" y2="80" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <line x1="160" y1="80" x2="280" y2="60" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <line x1="280" y1="60" x2="380" y2="100" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <line x1="160" y1="80" x2="200" y2="160" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <line x1="200" y1="160" x2="340" y2="150" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <line x1="340" y1="150" x2="380" y2="100" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <line x1="60" y1="140" x2="120" y2="170" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
      <line x1="120" y1="170" x2="200" y2="160" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
      <line x1="380" y1="100" x2="440" y2="130" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
      <line x1="280" y1="60" x2="320" y2="30" stroke="#36B8F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />

      <circle cx="60" cy="140" r="5" fill="#36B8F5" opacity="0.5" />
      <circle cx="60" cy="140" r="2" fill="#36B8F5" opacity="0.9" />
      <circle cx="160" cy="80" r="7" fill="#36B8F5" opacity="0.4" />
      <circle cx="160" cy="80" r="3" fill="#36B8F5" opacity="0.9" />
      <circle cx="280" cy="60" r="6" fill="#36B8F5" opacity="0.45" />
      <circle cx="280" cy="60" r="2.5" fill="#36B8F5" opacity="0.9" />
      <circle cx="380" cy="100" r="7" fill="#36B8F5" opacity="0.4" />
      <circle cx="380" cy="100" r="3" fill="#36B8F5" opacity="0.9" />
      <circle cx="200" cy="160" r="5" fill="#36B8F5" opacity="0.5" />
      <circle cx="200" cy="160" r="2" fill="#36B8F5" opacity="0.9" />
      <circle cx="340" cy="150" r="4.5" fill="#36B8F5" opacity="0.45" />
      <circle cx="340" cy="150" r="2" fill="#36B8F5" opacity="0.9" />
      <circle cx="120" cy="170" r="3.5" fill="#36B8F5" opacity="0.35" />
      <circle cx="440" cy="130" r="3.5" fill="#36B8F5" opacity="0.35" />
      <circle cx="320" cy="30" r="3" fill="#36B8F5" opacity="0.3" />

      <circle cx="160" cy="80" r="12" stroke="#36B8F5" strokeWidth="0.5" opacity="0.2" />
      <circle cx="380" cy="100" r="12" stroke="#36B8F5" strokeWidth="0.5" opacity="0.2" />
    </svg>
  );

  /* ── Logo SVG ── */
  const LogoMark = ({ className = "" }: { className?: string }) => (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" fill="#36B8F5" />
      <circle cx="24" cy="8" r="3" fill="#36B8F5" />
      <circle cx="16" cy="24" r="3.5" fill="#1769E0" />
      <circle cx="8" cy="20" r="2.5" fill="#36B8F5" opacity="0.6" />
      <circle cx="24" cy="20" r="2.5" fill="#36B8F5" opacity="0.6" />
      <line x1="8" y1="8" x2="24" y2="8" stroke="#36B8F5" strokeWidth="1" opacity="0.4" />
      <line x1="8" y1="8" x2="16" y2="24" stroke="#1769E0" strokeWidth="1" opacity="0.5" />
      <line x1="24" y1="8" x2="16" y2="24" stroke="#1769E0" strokeWidth="1" opacity="0.5" />
      <line x1="8" y1="20" x2="16" y2="24" stroke="#36B8F5" strokeWidth="0.8" opacity="0.35" />
      <line x1="24" y1="20" x2="16" y2="24" stroke="#36B8F5" strokeWidth="0.8" opacity="0.35" />
      <line x1="8" y1="8" x2="8" y2="20" stroke="#36B8F5" strokeWidth="0.8" opacity="0.3" />
      <line x1="24" y1="8" x2="24" y2="20" stroke="#36B8F5" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );

  /* ── Capability items ── */
  const capabilities = [
    { icon: Bus, label: "Buses & Commute" },
    { icon: Plane, label: "Travel & Trips" },
    { icon: Car, label: "Vehicles & Fleet" },
    { icon: FileText, label: "Bills & Expenses" },
  ];

  return (
    <>
      {/* Modals */}
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

      <div className="login-page">
        {/* ════════════════════════════════════════════
            LEFT PANEL — Brand & Product Positioning
            ════════════════════════════════════════════ */}
        <aside className="login-brand-panel" aria-label="IndusConnect brand information">
          <div className="login-brand-panel__inner">
            {/* Logo */}
            <div className="login-brand-panel__header">
              <div className="login-brand-logo">
                <LogoMark className="login-brand-logo__mark" />
                <span className="login-brand-logo__text">
                  Indus<span className="login-brand-logo__accent">Connect</span>
                </span>
              </div>
            </div>

            {/* Headline & description */}
            <div className="login-brand-panel__content">
              <h1 className="login-brand-headline">
                One organization.
                <br />
                <span className="login-brand-headline__accent">One connected experience.</span>
              </h1>
              <p className="login-brand-description">
                Connect company buses, business trips, fleet vehicles, and expense bills in one easy place.
              </p>

              {/* Capability indicators */}
              <div className="login-brand-capabilities">
                {capabilities.map(({ icon: Icon, label }) => (
                  <div key={label} className="login-brand-capability">
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network illustration */}
            <div className="login-brand-panel__illustration">
              <NetworkIllustration />
            </div>
          </div>
        </aside>

        {/* ════════════════════════════════════════════
            RIGHT PANEL — Authentication Interface
            ════════════════════════════════════════════ */}
        <main className="login-auth-panel" aria-label="Sign in">
          <div className="login-auth-panel__inner">
            {/* Mobile logo */}
            <div className="login-auth-mobile-logo">
              <LogoMark className="login-brand-logo__mark" />
              <span className="login-brand-logo__text login-brand-logo__text--dark">
                Indus<span className="login-brand-logo__accent--dark">Connect</span>
              </span>
            </div>

            {/* Security indicator */}
            <div className="login-auth-security-badge">
              <Shield size={14} strokeWidth={1.8} />
              <span>Company Sign In</span>
            </div>

            {/* Welcome heading */}
            <div className="login-auth-heading">
              <h2 className="login-auth-heading__title">Welcome to IndusConnect</h2>
              <p className="login-auth-heading__subtitle">
                {authMethod === "PHONE"
                  ? "Enter your mobile phone number and 4-digit PIN to sign in."
                  : "Sign in with your work email and password."}
              </p>
            </div>

            {/* Method Tabs (Phone & PIN vs Email & Password) */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("PHONE");
                  setError("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-lg transition ${
                  authMethod === "PHONE"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Phone size={14} className="text-blue-600" />
                <span>Phone & 4-Digit PIN</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                  Fast
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("EMAIL");
                  setError("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-lg transition ${
                  authMethod === "EMAIL"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Email & Password</span>
              </button>
            </div>

            {/* Error alert */}
            {error && (
              <div className="login-auth-error mb-4" role="alert" aria-live="assertive">
                <AlertCircle size={16} strokeWidth={2} />
                <p>{error}</p>
              </div>
            )}

            {/* Auth form */}
            <form onSubmit={handleSubmit} className="login-auth-form" noValidate>
              {authMethod === "PHONE" ? (
                <>
                  {/* Phone Number Field */}
                  <div className="login-field">
                    <label htmlFor="login-phone" className="login-field__label flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Mobile Phone Number</span>
                      <span className="text-xs text-slate-400 font-normal">e.g. 0300 0000007</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
                        <Phone size={16} className="text-blue-600" />
                      </div>
                      <input
                        id="login-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="0300 0000007"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-+]/g, ""))}
                        onBlur={() => setPhoneTouched(true)}
                        className={`login-field__input pl-10 text-base tracking-wide font-medium ${
                          showPhoneError ? "login-field__input--error" : ""
                        }`}
                        aria-describedby={showPhoneError ? "login-phone-error" : undefined}
                        disabled={isSubmitting}
                      />
                    </div>
                    {showPhoneError ? (
                      <p id="login-phone-error" className="login-field__error" role="alert">
                        Please enter a valid mobile number (e.g. 0300 0000007).
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">
                        Type your 11-digit mobile number registered with the office.
                      </p>
                    )}
                  </div>

                  {/* 4-Digit Security PIN Field */}
                  <div className="login-field">
                    <div className="login-field__label-row">
                      <label htmlFor="login-pin" className="login-field__label flex items-center gap-1.5">
                        <KeyRound size={15} className="text-blue-600" />
                        <span className="font-semibold text-slate-800">4-Digit Security PIN</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsHelpdeskOpen(true)}
                        className="login-forgot-link"
                        tabIndex={0}
                      >
                        Forgot PIN?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        ref={pinRef}
                        id="login-pin"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        autoComplete="current-password"
                        placeholder="• • • •"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        onBlur={() => setPinTouched(true)}
                        className={`login-field__input text-center text-2xl font-bold tracking-[0.5em] font-mono h-13 ${
                          showPinError ? "login-field__input--error" : ""
                        }`}
                        aria-describedby={showPinError ? "login-pin-error" : undefined}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        aria-label={showPin ? "Hide PIN" : "Show PIN"}
                        tabIndex={-1}
                      >
                        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {showPinError ? (
                      <p id="login-pin-error" className="login-field__error" role="alert">
                        PIN must be exactly 4 numbers.
                      </p>
                    ) : (
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                        <span>Enter your 4 secret digits</span>
                        <span className="font-semibold text-blue-600">Default PIN: 1234</span>
                      </div>
                    )}
                  </div>

                  {/* Quick-tap Demo Accounts for Easy Testing & Drivers */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                        1-Touch Demo Logins:
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md font-mono">
                        PIN: 1234
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickFill("03000000007")}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 text-slate-800 transition shadow-xs group"
                      >
                        <span className="text-base mb-0.5">🚌</span>
                        <span className="text-xs font-bold text-blue-900 group-hover:text-blue-700">Driver</span>
                        <span className="text-[10px] text-slate-400 font-mono">0300...007</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickFill("03000000002")}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 text-slate-800 transition shadow-xs group"
                      >
                        <span className="text-base mb-0.5">👤</span>
                        <span className="text-xs font-bold text-blue-900 group-hover:text-blue-700">Staff</span>
                        <span className="text-[10px] text-slate-400 font-mono">0300...002</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickFill("03000000001")}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-blue-200 hover:border-blue-600 hover:bg-blue-50 text-slate-800 transition shadow-xs group"
                      >
                        <span className="text-base mb-0.5">🛡️</span>
                        <span className="text-xs font-bold text-blue-900 group-hover:text-blue-700">Admin</span>
                        <span className="text-[10px] text-slate-400 font-mono">0300...001</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Work Email Field */}
                  <div className="login-field">
                    <label htmlFor="login-email" className="login-field__label">
                      Email address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      className={`login-field__input ${showEmailError ? "login-field__input--error" : ""}`}
                      aria-describedby={showEmailError ? "login-email-error" : undefined}
                      aria-invalid={showEmailError ? "true" : undefined}
                      disabled={isSubmitting}
                    />
                    {showEmailError && (
                      <p id="login-email-error" className="login-field__error" role="alert">
                        Please enter a valid email address.
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="login-field">
                    <div className="login-field__label-row">
                      <label htmlFor="login-password" className="login-field__label">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsHelpdeskOpen(true)}
                        className="login-forgot-link"
                        tabIndex={0}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="login-field__password-wrapper">
                      <input
                        ref={passwordRef}
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        className={`login-field__input login-field__input--password ${
                          showPasswordError ? "login-field__input--error" : ""
                        }`}
                        aria-describedby={showPasswordError ? "login-password-error" : undefined}
                        aria-invalid={showPasswordError ? "true" : undefined}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassword(!showPassword);
                          passwordRef.current?.focus();
                        }}
                        className="login-field__password-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff size={18} strokeWidth={1.6} />
                        ) : (
                          <Eye size={18} strokeWidth={1.6} />
                        )}
                      </button>
                    </div>
                    {showPasswordError && (
                      <p id="login-password-error" className="login-field__error" role="alert">
                        Password is required.
                      </p>
                    )}
                  </div>

                  {/* SSO button */}
                  <button
                    type="button"
                    onClick={() => setIsSsoOpen(true)}
                    className="login-sso-button"
                    disabled={isSubmitting}
                  >
                    <Building2 size={16} strokeWidth={1.8} />
                    <span>Sign in with Company Single Sign-On (SSO)</span>
                  </button>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit-button mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="login-submit-button__spinner" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Lock size={16} />
                    <span>{authMethod === "PHONE" ? "Sign In with PIN" : "Sign In"}</span>
                  </div>
                )}
              </button>
            </form>

            {/* Access note */}
            <div className="login-auth-access-note">
              <Info size={13} strokeWidth={1.6} />
              <span>Accounts are created and managed by company office.</span>
            </div>

            {/* Footer */}
            <footer className="login-auth-footer">
              <div className="login-auth-footer__links">
                <button
                  type="button"
                  onClick={() => setIsHelpdeskOpen(true)}
                  className="login-auth-footer__link"
                >
                  Privacy
                </button>
                <span className="login-auth-footer__separator">·</span>
                <button
                  type="button"
                  onClick={() => setIsHelpdeskOpen(true)}
                  className="login-auth-footer__link"
                >
                  Help
                </button>
              </div>
              <p className="login-auth-footer__copyright">
                © {new Date().getFullYear()} IndusConnect
              </p>
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}
