import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ShieldAlert,
  Search,
  RefreshCcw,
  Clock,
  User,
  Database,
  Terminal,
  Activity,
  ChevronRight,
  Globe,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getAllAuditLogs, getMyAuditLogs } from "../api/auditLogs";
import type { AuditLog, AuditAction, AuditEntity } from "../types/auditLog";

export default function AuditLogsPage() {
  const { bootstrap } = useAuth();
  
  // Roles check
  const isSuperAdmin = bootstrap?.role === "SUPER_ADMIN";

  // Data states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "MY">(isSuperAdmin ? "ALL" : "MY");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"ALL" | AuditAction>("ALL");
  const [entityFilter, setEntityFilter] = useState<"ALL" | AuditEntity>("ALL");

  // Modals / details state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Loading states
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync data feeds
  async function loadAuditLogs() {
    try {
      setIsLoading(true);
      setError("");

      if (activeTab === "ALL" && isSuperAdmin) {
        const data = await getAllAuditLogs();
        setLogs(data || []);
      } else {
        const data = await getMyAuditLogs();
        setLogs(data || []);
      }
    } catch (err) {
      setError("Failed to query security logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
  }, [activeTab]);

  // Actions list for dropdown selection
  const actionsList: AuditAction[] = [
    "LOGIN",
    "CREATE",
    "UPDATE",
    "DELETE",
    "APPROVE",
    "REJECT",
    "CANCEL",
    "ASSIGN",
    "CHECK_IN",
    "CHECK_OUT",
    "EXPORT",
    "FLAG",
    "START_TRIP",
    "END_TRIP",
    "REPORT_ISSUE",
    "SYSTEM",
  ];

  // Entities list for dropdown selection
  const entitiesList: AuditEntity[] = [
    "AUTH",
    "USER",
    "VEHICLE",
    "DRIVER",
    "ROUTE",
    "SMART_STOP",
    "SHUTTLE_BOOKING",
    "TRAVEL_REQUEST",
    "ROOM",
    "ROOM_RESERVATION",
    "EXPENSE_CLAIM",
    "TRANSPORT_TRIP",
    "REPORT",
    "VENDOR",
    "TELEMETRY",
    "NOTIFICATION",
    "PROXY_BOOKING",
    "POLICY_RULE",
    "MAINTENANCE_TASK",
    "HOUSEKEEPING_TASK",
    "ERP_EXPORT",
    "SYSTEM",
  ];

  // Filter log trails
  const filteredLogs = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const matchesSearch =
        !keyword ||
        (log.description && log.description.toLowerCase().includes(keyword)) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(keyword)) ||
        (log.path && log.path.toLowerCase().includes(keyword));

      const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
      const matchesEntity = entityFilter === "ALL" || log.entity === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, searchQuery, actionFilter, entityFilter]);

  // Color styles mapping based on action types
  function getActionBadgeStyle(action: AuditAction) {
    switch (action) {
      case "LOGIN":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "UPDATE":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "DELETE":
      case "REJECT":
      case "CANCEL":
        return "bg-red-50 text-red-700 border-red-100";
      case "APPROVE":
        return "bg-teal-50 text-teal-700 border-teal-100";
      case "START_TRIP":
      case "END_TRIP":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "SYSTEM":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            System Security & Audit logs
          </h1>
          <p className="text-sm text-slate-500">
            Audit immutable system event trails, login triggers, records mutations, and administrative status reviews.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={loadAuditLogs}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 text-xs py-2"
          >
            <RefreshCcw size={15} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Sync Logs
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 border border-red-100">
          <ShieldAlert size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs / Filters Panel */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-2">
        <div className="flex">
          {isSuperAdmin && (
            <button
              onClick={() => {
                setSelectedLog(null);
                setActiveTab("ALL");
              }}
              className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
                activeTab === "ALL"
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Platform Audit Logs
            </button>
          )}
          <button
            onClick={() => {
              setSelectedLog(null);
              setActiveTab("MY");
            }}
            className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
              activeTab === "MY"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            My Activity Trails
          </button>
        </div>

        {/* Action Filters dropdowns */}
        <div className="flex flex-wrap items-center gap-3.5">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 py-1.5 px-2.5 text-xs outline-none focus:border-blue-600 bg-white font-bold"
          >
            <option value="ALL">All Actions</option>
            {actionsList.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 py-1.5 px-2.5 text-xs outline-none focus:border-blue-600 bg-white font-bold"
          >
            <option value="ALL">All Entities</option>
            {entitiesList.map((ent) => (
              <option key={ent} value={ent}>
                {ent.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search description, path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-600 transition bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 italic">
          Syncing audit logs registry...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Logs Table List */}
          <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm max-h-[70vh] overflow-y-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Status Code</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedLog?.id === log.id ? "bg-slate-100/50" : ""}`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4">
                      {activeTab === "MY" ? (
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-800">{log.actor?.fullName || "System/Actor"}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-xs">{log.actorEmail}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                      {log.entity.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4">
                      {log.statusCode ? (
                        <span className={`font-mono text-xs font-bold ${log.statusCode >= 400 ? "text-red-600" : "text-emerald-600"}`}>
                          {log.statusCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-2xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={15} className="inline text-slate-400" />
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText className="mx-auto text-slate-300" size={32} />
                      <h4 className="mt-3 font-bold text-slate-800 text-sm">No activity logs recorded</h4>
                      <p className="text-slate-400 text-xs mt-0.5">Filter criteria or search query returned empty logs.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Details Sidebar Panel */}
          <div className="space-y-4">
            {selectedLog ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Log Details</h3>
                    <p className="text-2xs text-slate-400 mt-0.5">ID: {selectedLog.id}</p>
                  </div>
                  <Terminal size={18} className="text-blue-700" />
                </div>

                {/* Actor info block */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <User size={13} className="text-slate-400" /> User Profile Info
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 font-semibold text-2xs mt-1">
                    <div>
                      <span className="block text-slate-400 text-3xs uppercase font-bold">Actor Email</span>
                      <span>{selectedLog.actorEmail || "SYSTEM"}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-3xs uppercase font-bold">Actor Role</span>
                      <span className="uppercase">{selectedLog.actorRole || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* HTTP Request metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs">Request Method</span>
                    <span className="font-bold text-slate-800">{selectedLog.method || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs">IP Address</span>
                    <span className="font-bold text-slate-800">{selectedLog.ipAddress || "127.0.0.1"}</span>
                  </div>
                </div>

                {selectedLog.path && (
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs mb-0.5">Request Path</span>
                    <span className="font-mono text-2xs bg-slate-100 px-2 py-1 rounded border border-slate-200/50 block truncate">
                      {selectedLog.path}
                    </span>
                  </div>
                )}

                {selectedLog.description && (
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs mb-1">Event Description</span>
                    <p className="text-xs text-slate-700 bg-blue-50/20 p-2.5 rounded-lg border border-blue-100/30">
                      {selectedLog.description}
                    </p>
                  </div>
                )}

                {selectedLog.userAgent && (
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs mb-1 flex items-center gap-1">
                      <Globe size={11} className="text-slate-400" /> User Agent
                    </span>
                    <p className="text-3xs text-slate-500 font-mono leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 max-h-16 overflow-y-auto">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}

                {/* Request Payload JSON Block */}
                {selectedLog.requestBody && (
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs mb-1.5 flex items-center gap-1">
                      <Database size={11} className="text-slate-400" /> Request Payload Body
                    </span>
                    <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-950 p-3 text-3xs text-emerald-400 font-mono leading-relaxed border border-slate-800 select-all">
                      <pre>{JSON.stringify(selectedLog.requestBody, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div>
                  <span className="block text-slate-400 font-semibold uppercase text-3xs mb-0.5">Created At</span>
                  <span className="text-xs text-slate-700 font-semibold">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
              </Card>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic text-xs bg-slate-50">
                <Activity className="mx-auto mb-2 text-slate-300" size={32} />
                Select any audit log record on the left to review payload request parameters, Actor profiles, and HTTP metadata.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
