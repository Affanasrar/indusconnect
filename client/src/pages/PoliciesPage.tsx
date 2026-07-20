import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldAlert as ShieldWarning,
  UserCheck,
  CheckCircle,
  XCircle,
  PlusCircle,
  RefreshCcw,
  Search,
  X,
  FileText,
  Sliders,
  DollarSign,
  Clock,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  getPolicyRules,
  createPolicyRule,
  updatePolicyRule,
  deactivatePolicyRule,
  getPolicyDecisionLogs,
} from "../api/policies";
import type { PolicyRule, PolicyDecisionLog, PolicyRuleType, PolicyRuleStatus } from "../types/policy";
import type { HRGrade } from "../types/frontend";

interface RuleFormState {
  ruleName: string;
  ruleCode: string;
  ruleType: PolicyRuleType;
  status: PolicyRuleStatus;
  department: string;
  hrGrade: HRGrade | "";
  maxAmount: string;
  requiresManagerApproval: boolean;
  requiresFinanceApproval: boolean;
  requiresTransportApproval: boolean;
  requiresAccommodationApproval: boolean;
  allowEmergencyOverride: boolean;
  cutoffHoursBeforeShift: string;
  internalFirstRequired: boolean;
  description: string;
}

const defaultForm: RuleFormState = {
  ruleName: "",
  ruleCode: "",
  ruleType: "TRAVEL_APPROVAL",
  status: "ACTIVE",
  department: "",
  hrGrade: "",
  maxAmount: "",
  requiresManagerApproval: false,
  requiresFinanceApproval: false,
  requiresTransportApproval: false,
  requiresAccommodationApproval: false,
  allowEmergencyOverride: false,
  cutoffHoursBeforeShift: "",
  internalFirstRequired: false,
  description: "",
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };
    return responseError.response?.data?.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}

export default function PoliciesPage() {
  const { bootstrap } = useAuth();
  
  // Roles
  const isSuperAdmin = bootstrap?.role === "SUPER_ADMIN";

  // Data States
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<PolicyDecisionLog[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<"RULES" | "LOGS">("RULES");
  const [searchQuery, setSearchQuery] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<"ALL" | "PASSED" | "WARNING" | "REVIEW_REQUIRED" | "BLOCKED">("ALL");

  // Modals state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(defaultForm);

  // Status indicators
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync data
  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [rulesList, logsList] = await Promise.all([
        getPolicyRules(),
        getPolicyDecisionLogs(),
      ]);

      setRules(rulesList || []);
      setDecisionLogs(logsList || []);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load policy config matrices");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter computations
  const filteredRules = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return rules.filter((r) => {
      return (
        !keyword ||
        r.ruleName.toLowerCase().includes(keyword) ||
        r.ruleCode.toLowerCase().includes(keyword) ||
        r.ruleType.toLowerCase().includes(keyword) ||
        (r.description && r.description.toLowerCase().includes(keyword))
      );
    });
  }, [rules, searchQuery]);

  const filteredLogs = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return decisionLogs.filter((log) => {
      const matchesKeyword =
        !keyword ||
        log.message.toLowerCase().includes(keyword) ||
        log.entityType.toLowerCase().includes(keyword) ||
        log.entityId.toLowerCase().includes(keyword) ||
        (log.user?.fullName && log.user.fullName.toLowerCase().includes(keyword));

      const matchesDecision =
        decisionFilter === "ALL" || log.decision === decisionFilter;

      return matchesKeyword && matchesDecision;
    });
  }, [decisionLogs, searchQuery, decisionFilter]);

  const metrics = useMemo(() => {
    const active = rules.filter((r) => r.status === "ACTIVE").length;
    const blockedCount = decisionLogs.filter((l) => l.decision === "BLOCKED").length;
    const warningsCount = decisionLogs.filter((l) => l.decision === "WARNING" || l.decision === "REVIEW_REQUIRED").length;
    return {
      totalRules: rules.length,
      activeRules: active,
      violationsCount: blockedCount + warningsCount,
    };
  }, [rules, decisionLogs]);

  // Handle Create or Update
  async function handleRuleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!ruleForm.ruleName.trim() || !ruleForm.ruleCode.trim()) {
        throw new Error("Rule Name and unique Rule Code are required");
      }

      const payload = {
        ruleName: ruleForm.ruleName.trim(),
        ruleCode: ruleForm.ruleCode.trim(),
        ruleType: ruleForm.ruleType,
        status: ruleForm.status,
        department: ruleForm.department.trim() || undefined,
        hrGrade: ruleForm.hrGrade || undefined,
        maxAmount: ruleForm.maxAmount ? parseFloat(ruleForm.maxAmount) : undefined,
        requiresManagerApproval: ruleForm.requiresManagerApproval,
        requiresFinanceApproval: ruleForm.requiresFinanceApproval,
        requiresTransportApproval: ruleForm.requiresTransportApproval,
        requiresAccommodationApproval: ruleForm.requiresAccommodationApproval,
        allowEmergencyOverride: ruleForm.allowEmergencyOverride,
        cutoffHoursBeforeShift: ruleForm.cutoffHoursBeforeShift ? parseInt(ruleForm.cutoffHoursBeforeShift) : undefined,
        internalFirstRequired: ruleForm.internalFirstRequired,
        description: ruleForm.description.trim() || undefined,
      };

      if (editingRuleId) {
        await updatePolicyRule(editingRuleId, payload);
        setMessage("Policy rule updated successfully");
      } else {
        await createPolicyRule(payload);
        setMessage("Policy rule created successfully");
      }

      setRuleForm(defaultForm);
      setEditingRuleId(null);
      setShowRuleModal(false);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to configure policy rule");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Edit Action
  function startEdit(rule: PolicyRule) {
    setEditingRuleId(rule.id);
    setRuleForm({
      ruleName: rule.ruleName,
      ruleCode: rule.ruleCode,
      ruleType: rule.ruleType,
      status: rule.status,
      department: rule.department || "",
      hrGrade: rule.hrGrade || "",
      maxAmount: rule.maxAmount ? String(rule.maxAmount) : "",
      requiresManagerApproval: rule.requiresManagerApproval,
      requiresFinanceApproval: rule.requiresFinanceApproval,
      requiresTransportApproval: rule.requiresTransportApproval,
      requiresAccommodationApproval: rule.requiresAccommodationApproval,
      allowEmergencyOverride: rule.allowEmergencyOverride,
      cutoffHoursBeforeShift: rule.cutoffHoursBeforeShift ? String(rule.cutoffHoursBeforeShift) : "",
      internalFirstRequired: rule.internalFirstRequired,
      description: rule.description || "",
    });
    setShowRuleModal(true);
  }

  // Deactivate Toggle
  async function handleToggleDeactivate(id: string) {
    setError("");
    setMessage("");
    try {
      await deactivatePolicyRule(id);
      setMessage("Policy rule deactivated successfully");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Deactivation trigger failed");
    }
  }

  // Return icons representing evaluation results
  function getDecisionBadge(decision: string) {
    switch (decision) {
      case "PASSED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-2xs font-bold text-emerald-700">
            <CheckCircle size={10} /> PASSED
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-2xs font-bold text-amber-700">
            <ShieldWarning size={10} /> WARNING
          </span>
        );
      case "REVIEW_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-2xs font-bold text-blue-700">
            <UserCheck size={10} /> REVIEW REQUIRED
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2.5 py-0.5 text-2xs font-bold text-red-700">
            <XCircle size={10} /> BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5 text-2xs font-bold text-slate-700">
            UNKNOWN
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Compliance Policy Manager
          </h1>
          <p className="text-sm text-slate-500">
            Configure financial caps, grade approvals, and audit automated validation decision logs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={loadData}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 text-xs py-2"
          >
            <RefreshCcw size={15} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Sync Policies
          </Button>

          {isSuperAdmin && (
            <Button
              onClick={() => {
                setEditingRuleId(null);
                setRuleForm(defaultForm);
                setShowRuleModal(true);
              }}
              className="rounded-xl text-xs py-2"
            >
              <PlusCircle size={15} className="mr-1.5" />
              Add Policy Rule
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-100">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 border border-red-100">
          <XCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Rules Configured</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.totalRules}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-700">
              <Sliders size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Rule Guards</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.activeRules}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3.5 text-emerald-700">
              <ShieldCheck size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Flagged Anomalies Logs</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.violationsCount}</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-3.5 text-red-700">
              <ShieldAlert size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("RULES")}
            className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
              activeTab === "RULES"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Policy Rules Registry
          </button>
          <button
            onClick={() => setActiveTab("LOGS")}
            className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
              activeTab === "LOGS"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Decision logs ({decisionLogs.length})
          </button>
        </div>

        <div className="flex items-center gap-3 pb-2 sm:pb-0">
          {activeTab === "LOGS" && (
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 py-1.5 px-2.5 text-xs outline-none focus:border-blue-600 bg-white"
            >
              <option value="ALL">All Decisions</option>
              <option value="PASSED">Passed</option>
              <option value="WARNING">Warnings</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          )}

          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder={activeTab === "RULES" ? "Search policy rules..." : "Search logs trail..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-600 transition bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCcw size={40} className="animate-spin text-blue-700" />
          <p className="mt-4 text-sm font-medium">Syncing compliance policy rules...</p>
        </div>
      ) : activeTab === "RULES" ? (
        /* RULES TAB */
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Rule Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Applies To</th>
                <th className="px-6 py-4">Restrictions</th>
                <th className="px-6 py-4">Status</th>
                {isSuperAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((rule) => {
                return (
                  <tr key={rule.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{rule.ruleName}</div>
                      {rule.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{rule.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-600">
                      {rule.ruleCode}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      {rule.ruleType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {rule.department && <div>Dept: {rule.department}</div>}
                      {rule.hrGrade && <div>Grade: {rule.hrGrade.replace(/_/g, " ")}</div>}
                      {!rule.department && !rule.hrGrade && <span className="text-slate-400">Global System</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      <div className="space-y-1">
                        {rule.maxAmount && (
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <DollarSign size={11} className="text-slate-400" /> Max: PKR {rule.maxAmount.toLocaleString()}
                          </div>
                        )}
                        {rule.cutoffHoursBeforeShift && (
                          <div className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" /> Cutoff: {rule.cutoffHoursBeforeShift} hrs
                          </div>
                        )}
                        {rule.requiresManagerApproval && <span className="inline-block bg-slate-100 px-1 py-0.5 rounded mr-1">Mgr Appr</span>}
                        {rule.requiresFinanceApproval && <span className="inline-block bg-slate-100 px-1 py-0.5 rounded mr-1">Finance Appr</span>}
                        {rule.requiresTransportApproval && <span className="inline-block bg-slate-100 px-1 py-0.5 rounded mr-1">Transport Appr</span>}
                        {rule.requiresAccommodationApproval && <span className="inline-block bg-slate-100 px-1 py-0.5 rounded mr-1">Accom Appr</span>}
                        {rule.allowEmergencyOverride && <span className="inline-block bg-red-50 text-red-700 px-1 py-0.5 rounded">Emergency Override</span>}
                        {rule.internalFirstRequired && <span className="inline-block bg-blue-50 text-blue-700 px-1 py-0.5 rounded">Internal Fleet First</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider ${
                        rule.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {rule.status}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(rule)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            title="Edit rule config"
                          >
                            <Sliders size={15} />
                          </button>
                          {rule.status === "ACTIVE" && (
                            <button
                              onClick={() => handleToggleDeactivate(rule.id)}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Deactivate rule"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Sliders className="mx-auto text-slate-300" size={32} />
                    <h4 className="mt-3 font-bold text-slate-800 text-sm">No rules configured</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Use the "Add Policy Rule" button to register new constraints.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* LOGS TAB */
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Trigger User</th>
                <th className="px-6 py-4">Evaluation Result</th>
                <th className="px-6 py-4">Rule Checked</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">Message Trail</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div>
                          <div className="font-bold text-slate-800">{log.user.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System Trigger</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getDecisionBadge(log.decision)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {log.policyRule ? (
                        <div>
                          <div className="text-slate-800 font-bold">{log.policyRule.ruleName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.policyRule.ruleCode}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Static Fallback Guard</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">{log.entityType.replace(/([A-Z])/g, " $1").trim()}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {log.entityId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-sm">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-400 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="mx-auto text-slate-300" size={32} />
                    <h4 className="mt-3 font-bold text-slate-800 text-sm">No evaluation logs found</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Automated checks will log audit trails here on next reservations.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* POLICY RULE CONFIGURATION MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              {editingRuleId ? "Configure Policy Rule" : "Add Policy Rule"}
            </h3>

            <form onSubmit={handleRuleSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleForm.ruleName}
                    onChange={(e) => setRuleForm({ ...ruleForm, ruleName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Executive Hotel Cap Limit"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Rule Code (Unique ID) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRuleId}
                    value={ruleForm.ruleCode}
                    onChange={(e) => setRuleForm({ ...ruleForm, ruleCode: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="e.g. EXP_EXEC_HOTEL_CAP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Rule Type *
                  </label>
                  <select
                    value={ruleForm.ruleType}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, ruleType: e.target.value as PolicyRuleType })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="TRAVEL_APPROVAL">Travel Approval</option>
                    <option value="EXPENSE_LIMIT">Expense Limit</option>
                    <option value="ACCOMMODATION_FALLBACK">Accommodation Fallback</option>
                    <option value="TRANSPORT_CUTOFF">Transport Cutoff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={ruleForm.status}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, status: e.target.value as PolicyRuleStatus })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="ACTIVE">Active Guard</option>
                    <option value="INACTIVE">Inactive / Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={ruleForm.department}
                    onChange={(e) => setRuleForm({ ...ruleForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Sales, Operations"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target HR Grade (Optional)
                  </label>
                  <select
                    value={ruleForm.hrGrade}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, hrGrade: e.target.value as HRGrade | "" })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="">All HR Grades</option>
                    <option value="SUPPORT_STAFF">Support Staff</option>
                    <option value="STAFF">Staff</option>
                    <option value="OFFICER">Officer</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SENIOR_MANAGER">Senior Manager</option>
                    <option value="EXECUTIVE">Executive</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="CONSULTANT">Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Max Amount (PKR limit)
                  </label>
                  <input
                    type="number"
                    value={ruleForm.maxAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. 5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cutoff Hours Before Shift
                  </label>
                  <input
                    type="number"
                    value={ruleForm.cutoffHoursBeforeShift}
                    onChange={(e) => setRuleForm({ ...ruleForm, cutoffHoursBeforeShift: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. 24"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Rule Description / Message template
                </label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  rows={2.5}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Describe compliance rules instructions..."
                />
              </div>

              {/* Switches block */}
              <div className="border-t border-slate-100 pt-4 mt-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Workflow Approvals required
                </label>

                <div className="grid gap-3 sm:grid-cols-2 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleForm.requiresManagerApproval}
                      onChange={(e) => setRuleForm({ ...ruleForm, requiresManagerApproval: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Requires Line Manager Approval
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleForm.requiresFinanceApproval}
                      onChange={(e) => setRuleForm({ ...ruleForm, requiresFinanceApproval: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Requires Finance Officer review
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleForm.requiresTransportApproval}
                      onChange={(e) => setRuleForm({ ...ruleForm, requiresTransportApproval: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Requires Transport Desk review
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleForm.requiresAccommodationApproval}
                      onChange={(e) => setRuleForm({ ...ruleForm, requiresAccommodationApproval: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Requires Accommodation Desk review
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleForm.allowEmergencyOverride}
                      onChange={(e) => setRuleForm({ ...ruleForm, allowEmergencyOverride: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    Allow Emergency Overrides
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleForm.internalFirstRequired}
                      onChange={(e) => setRuleForm({ ...ruleForm, internalFirstRequired: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Require Internal Fleet Booking First
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowRuleModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Saving rule..." : editingRuleId ? "Save Rule" : "Add Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
