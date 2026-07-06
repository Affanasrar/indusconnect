import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("admin@indusconnect.com");
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please check credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const demoUsers = [
    "admin@indusconnect.com",
    "employee@indusconnect.com",
    "manager@indusconnect.com",
    "transport@indusconnect.com",
    "accommodation@indusconnect.com",
    "finance@indusconnect.com",
    "driver@indusconnect.com",
    "security@indusconnect.com",
  ];

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <div className="hidden bg-blue-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck size={30} />
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-tight">
            IndusConnect
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Unified Enterprise Mobility & Logistics Platform for shuttle
            transport, travel, accommodation, expenses, telemetry, and ERP
            exports.
          </p>
        </div>

        <div className="rounded-3xl bg-white/10 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
            FYP-II Demo
          </p>
          <p className="mt-2 text-2xl font-bold">
            Role-based dashboards connected to your backend APIs.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white">
              <ShieldCheck size={30} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              IndusConnect
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-900">Login</h2>
            <p className="mt-2 text-sm text-slate-500">
              Use seeded demo credentials to access role-based dashboards.
            </p>

            {error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@indusconnect.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Demo@123"
                />
              </div>

              <Button className="w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Quick Demo Users
              </p>

              <div className="grid gap-2">
                {demoUsers.map((demoEmail) => (
                  <button
                    key={demoEmail}
                    type="button"
                    onClick={() => {
                      setEmail(demoEmail);
                      setPassword("Demo@123");
                    }}
                    className="rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {demoEmail}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}