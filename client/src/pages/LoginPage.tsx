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
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import HelpdeskModal from "../components/auth/HelpdeskModal";
import SsoLoginModal from "../components/auth/SsoLoginModal";

/* ─────────────────────────────────────────────
   IndusConnect — Enterprise Login Page
   Two-column layout: Brand Panel + Auth Panel
   ───────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  /* ── Authentication state ── */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  /* ── Modals ── */
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);
  const [isSsoOpen, setIsSsoOpen] = useState(false);

  /* ── Refs ── */
  const passwordRef = useRef<HTMLInputElement>(null);

  /* ── Already authenticated → redirect ── */
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  /* ── Validation helpers ── */
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailTouched && email.length > 0 && !isValidEmail;
  const showPasswordError = passwordTouched && password.length === 0;

  /* ── Submit handler ── */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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

    setError("");
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
      {/* Connection lines */}
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

      {/* Node dots */}
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

      {/* Pulse rings on key nodes */}
      <circle cx="160" cy="80" r="12" stroke="#36B8F5" strokeWidth="0.5" opacity="0.2" />
      <circle cx="380" cy="100" r="12" stroke="#36B8F5" strokeWidth="0.5" opacity="0.2" />
    </svg>
  );

  /* ── Logo SVG (connected nodes mark) ── */
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
    { icon: Bus, label: "Commute" },
    { icon: Plane, label: "Travel" },
    { icon: Car, label: "Fleet" },
    { icon: FileText, label: "Expenses" },
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
                Connect your organization's mobility, travel, fleet, and logistics operations through one secure workspace.
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
            {/* Mobile logo (shown only on small screens) */}
            <div className="login-auth-mobile-logo">
              <LogoMark className="login-brand-logo__mark" />
              <span className="login-brand-logo__text login-brand-logo__text--dark">
                Indus<span className="login-brand-logo__accent--dark">Connect</span>
              </span>
            </div>

            {/* Security indicator */}
            <div className="login-auth-security-badge">
              <Shield size={14} strokeWidth={1.8} />
              <span>Secure organizational access</span>
            </div>

            {/* Welcome heading */}
            <div className="login-auth-heading">
              <h2 className="login-auth-heading__title">Welcome back</h2>
              <p className="login-auth-heading__subtitle">Sign in to your organization</p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="login-auth-error" role="alert" aria-live="assertive">
                <AlertCircle size={16} strokeWidth={2} />
                <p>{error}</p>
              </div>
            )}

            {/* Auth form */}
            <form onSubmit={handleSubmit} className="login-auth-form" noValidate>
              {/* Work email */}
              <div className="login-field">
                <label htmlFor="login-email" className="login-field__label">
                  Work email
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

              {/* SSO button */}
              <button
                type="button"
                onClick={() => setIsSsoOpen(true)}
                className="login-sso-button"
                disabled={isSubmitting}
              >
                <Building2 size={16} strokeWidth={1.8} />
                <span>Continue with organization SSO</span>
              </button>

              {/* Divider */}
              <div className="login-divider" role="separator">
                <div className="login-divider__line" />
                <span className="login-divider__text">or sign in with password</span>
                <div className="login-divider__line" />
              </div>

              {/* Password */}
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
                    className={`login-field__input login-field__input--password ${showPasswordError ? "login-field__input--error" : ""}`}
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

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="login-submit-button__spinner" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            {/* Access note */}
            <div className="login-auth-access-note">
              <Info size={13} strokeWidth={1.6} />
              <span>Access is managed by your organization.</span>
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