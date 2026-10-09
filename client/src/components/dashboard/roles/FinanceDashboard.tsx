import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../shared/PageHeader";
import KpiCard from "../shared/KpiCard";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";
import { KpiSkeleton, TableSkeleton } from "../shared/LoadingState";
import ErrorState from "../shared/ErrorState";
import { http } from "../../../api/http";

export default function FinanceDashboard() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadFinanceData() {
    try {
      setIsLoading(true);
      setHasError(false);

      const [summaryRes, claimsRes] = await Promise.allSettled([
        http.get("/reports/expenses"),
        http.get("/expenses"),
      ]);

      if (summaryRes.status === "fulfilled") {
        const sum = summaryRes.value.data.data ?? summaryRes.value.data;
        setSummaryData(sum);
      }

      if (claimsRes.status === "fulfilled") {
        const claims = claimsRes.value.data.data ?? claimsRes.value.data;
        setClaimsList(Array.isArray(claims) ? claims : []);
      }
    } catch (err) {
      console.error("Failed to load finance data:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Compute 4 KPI numbers
  const pendingVerificationCount = summaryData?.claims?.pending ?? 0;
  const returnedOrFlaggedCount = summaryData?.claims?.flagged ?? 0;
  const approvedClaimsCount = summaryData?.claims?.approved ?? 0;
  const paymentsPendingCount = summaryData?.claims?.paid ?? 0;

  // Filter claims
  const filteredClaims = useMemo(() => {
    const listToFilter = claimsList.length > 0 ? claimsList : summaryData?.recentClaims ?? [];

    return listToFilter.filter((claim: any) => {
      // Status filter
      if (statusFilter !== "ALL" && claim.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = (claim.employee?.fullName || "").toLowerCase();
        const title = (claim.title || "").toLowerCase();
        const code = (claim.id || "").toLowerCase();
        const cat = (claim.category || "").toLowerCase();
        return empName.includes(q) || title.includes(q) || code.includes(q) || cat.includes(q);
      }

      return true;
    });
  }, [claimsList, summaryData, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Finance Dashboard"
        subtitle="Review expense claims and track reimbursement workflows."
        onRefresh={loadFinanceData}
        isRefreshing={isLoading}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#102644] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1769E0] transition active:scale-95 shadow-xs"
            >
              <Receipt size={14} />
              <span>Verify Claims</span>
            </Link>

            <Link
              to="/erp-exports"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F0] bg-white px-3 py-2 text-xs font-semibold text-[#102644] hover:bg-slate-50 transition active:scale-95"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">ERP Payroll Sync</span>
            </Link>
          </div>
        }
      />

      {hasError && <ErrorState onRetry={loadFinanceData} />}

      {/* 4 Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Claims Awaiting Verification"
            value={pendingVerificationCount}
            subtitle={
              pendingVerificationCount > 0
                ? "Pending officer review"
                : "No pending claims"
            }
            icon={<Clock size={20} />}
            iconTone="amber"
            to="/expenses"
          />

          <KpiCard
            label="Returned / Flagged Claims"
            value={returnedOrFlaggedCount}
            subtitle={
              returnedOrFlaggedCount > 0
                ? "Flagged for policy correction"
                : "No anomalies found"
            }
            icon={<AlertTriangle size={20} />}
            iconTone={returnedOrFlaggedCount > 0 ? "rose" : "slate"}
            to="/expenses"
          />

          <KpiCard
            label="Approved Claims"
            value={approvedClaimsCount}
            subtitle={`Sum: PKR ${Number(summaryData?.amounts?.approvedAmount ?? 0).toLocaleString()}`}
            icon={<CheckCircle2 size={20} />}
            iconTone="emerald"
            to="/expenses"
          />

          <KpiCard
            label="Payments & ERP Processed"
            value={paymentsPendingCount}
            subtitle="Ready for payroll dispatch"
            icon={<FileSpreadsheet size={20} />}
            iconTone="blue"
            to="/erp-exports"
          />
        </div>
      )}

      {/* Expense Claims Table with Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#102644]">Expense Claims Ledger</h2>
            <p className="text-xs text-[#64748B]">All submitted employee claims requiring finance action</p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee or claim..."
                className="rounded-lg border border-[#DCE5F0] bg-white pl-8 pr-3 py-1.5 text-xs text-[#102644] placeholder-slate-400 focus:border-[#1769E0] focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#DCE5F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#102644] focus:border-[#1769E0] focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Verification</option>
              <option value="FLAGGED">Flagged / Returned</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : filteredClaims.length === 0 ? (
          <EmptyState
            title="No expense claims found"
            description={
              searchQuery || statusFilter !== "ALL"
                ? "No claims match your search filters."
                : "You're all caught up. There are no expense claims pending verification."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#DCE5F0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#DCE5F0] bg-slate-50/80 text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Claim Number</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Claim Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#102644]">
                {filteredClaims.slice(0, 10).map((claim: any) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      EXP-{claim.id.substring(0, 6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {claim.employee?.fullName || "Employee"}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {claim.employee?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <span className="font-medium text-slate-800">{claim.title || "Expense Claim"}</span>
                      {claim.category && (
                        <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600 font-medium">
                          {claim.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      {new Date(claim.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#102644]">
                      PKR {Number(claim.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={claim.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/expenses"
                        className="inline-flex items-center text-xs font-semibold text-[#1769E0] hover:underline"
                      >
                        <span>Review</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
