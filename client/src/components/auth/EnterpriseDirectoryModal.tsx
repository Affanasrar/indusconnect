import { useState } from "react";
import {
  X,
  Search,
  ShieldAlert,
  Car,
  Hotel,
  DollarSign,
  UserCheck,
  Shield,
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export interface Persona {
  role: string;
  fullName: string;
  email: string;
  department: string;
  clearance: "Level 1" | "Level 2" | "Level 3" | "Super Admin";
  icon: any;
  color: string;
  badgeBg: string;
  description: string;
  defaultPassword?: string;
}

export const ENTERPRISE_PERSONAS: Persona[] = [
  {
    role: "SUPER_ADMIN",
    fullName: "System Administrator",
    email: "admin@indusconnect.com",
    department: "Executive & Global Ops",
    clearance: "Super Admin",
    icon: ShieldAlert,
    color: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-100 text-purple-700 border-purple-200",
    description: "Complete platform governance, user IAM, role RBAC, global telemetry, and audit logs.",
    defaultPassword: "Admin@123",
  },
  {
    role: "TRANSPORT_ADMIN",
    fullName: "Fleet Operations Lead",
    email: "transport@indusconnect.com",
    department: "Logistics & Fleet Ops",
    clearance: "Level 3",
    icon: Car,
    color: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 text-blue-700 border-blue-200",
    description: "Vehicle telematics, route schedules, driver assignments, and live dispatch oversight.",
    defaultPassword: "Demo@123",
  },
  {
    role: "MANAGER",
    fullName: "Corporate Department Head",
    email: "manager@indusconnect.com",
    department: "Business Management",
    clearance: "Level 2",
    icon: Briefcase,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "Employee travel request approvals, team expense validation, and mobility budget control.",
    defaultPassword: "Demo@123",
  },
  {
    role: "EMPLOYEE",
    fullName: "Corporate Staff Member",
    email: "employee@indusconnect.com",
    department: "Enterprise Staff",
    clearance: "Level 1",
    icon: UserCheck,
    color: "text-sky-600 dark:text-sky-400",
    badgeBg: "bg-sky-100 text-sky-700 border-sky-200",
    description: "Daily corporate shuttle booking, travel requisitions, and reimbursement submissions.",
    defaultPassword: "Demo@123",
  },
  {
    role: "ACCOMMODATION_ADMIN",
    fullName: "Facilities & Housing Lead",
    email: "accommodation@indusconnect.com",
    department: "Real Estate & Facilities",
    clearance: "Level 2",
    icon: Hotel,
    color: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 text-amber-700 border-amber-200",
    description: "Corporate guesthouse inventories, room reservations, check-ins, and facility allocation.",
    defaultPassword: "Demo@123",
  },
  {
    role: "FINANCE_OFFICER",
    fullName: "Chief Controller / Auditor",
    email: "finance@indusconnect.com",
    department: "Corporate Treasury",
    clearance: "Level 3",
    icon: DollarSign,
    color: "text-teal-600 dark:text-teal-400",
    badgeBg: "bg-teal-100 text-teal-700 border-teal-200",
    description: "Expense verification, invoice audits, and automated SAP / Oracle ERP financial exports.",
    defaultPassword: "Demo@123",
  },
  {
    role: "DRIVER",
    fullName: "Licensed Fleet Operator",
    email: "driver@indusconnect.com",
    department: "Transit Operations",
    clearance: "Level 1",
    icon: Car,
    color: "text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
    description: "Live trip manifest, safety checklists, GPS route guidance, and commuter boarding scan.",
    defaultPassword: "Demo@123",
  },
  {
    role: "SECURITY_OFFICER",
    fullName: "SOC Emergency Dispatcher",
    email: "security@indusconnect.com",
    department: "Corporate Security",
    clearance: "Level 3",
    icon: Shield,
    color: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-100 text-rose-700 border-rose-200",
    description: "24/7 SOS alert monitoring, vehicle perimeter tracking, and incident escalation logs.",
    defaultPassword: "Demo@123",
  },
];

interface EnterpriseDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (email: string, password: string, autoSubmit?: boolean) => void;
}

export default function EnterpriseDirectoryModal({
  isOpen,
  onClose,
  onSelectPersona,
}: EnterpriseDirectoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filtered = ENTERPRISE_PERSONAS.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl shadow-blue-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Enterprise Directory Sandbox
                </h3>
                <span className="rounded-full bg-blue-950 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-blue-400 border border-blue-800">
                  8 Personas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pre-configured enterprise roles for rapid testing & evaluation
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

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by role, name, department or email..."
              className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
        </div>

        {/* Persona Cards List */}
        <div className="overflow-y-auto p-6 space-y-3 max-h-[calc(90vh-180px)] scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching enterprise personas found.
            </div>
          ) : (
            filtered.map((persona) => {
              const Icon = persona.icon;
              return (
                <div
                  key={persona.email}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition duration-150 hover:border-slate-700 hover:bg-slate-800/80"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 ${persona.color}`}
                    >
                      <Icon size={22} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                          {persona.fullName}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-2xs font-semibold border ${persona.badgeBg}`}
                        >
                          {persona.department}
                        </span>
                        <span className="rounded-md bg-slate-700/60 px-1.5 py-0.5 text-2xs font-mono text-slate-300">
                          {persona.clearance}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                        {persona.description}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-2xs text-slate-500 font-mono">
                        <span>{persona.email}</span>
                        <span>•</span>
                        <span>Password: {persona.defaultPassword || "Demo@123"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectPersona(persona.email, persona.defaultPassword || "Demo@123", false)
                      }
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                      Fill Form
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectPersona(persona.email, persona.defaultPassword || "Demo@123", true)
                      }
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition"
                    >
                      <span>Sign In</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-800/80 px-6 py-3.5 bg-slate-950/60 flex items-center justify-between text-2xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={13} className="text-emerald-400" />
            <span>IndusConnect Enterprise Demo Environment Active</span>
          </div>
          <span>Security Sandbox v3.4</span>
        </div>
      </div>
    </div>
  );
}
