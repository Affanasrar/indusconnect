import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  FileUp,
  History,
  CheckCircle,
  XCircle,
  PlusCircle,
  RefreshCcw,
  Search,
  Download,
  FileText,
  DollarSign,
  FileSpreadsheet,
  Check,
  X,
  Database,
  ArrowRightLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  createExpenseClaimsExport,
  createVendorBillsExport,
  createTravelAllowancesExport,
  createCombinedPayrollExport,
  getAllPayrollExports,
  markPayrollExportAsSynced,
  markPayrollExportAsFailed,
} from "../api/erpExports";
import { getAllExpenseClaims } from "../api/expenses";
import { getVendorBills } from "../api/vendors";
import { getAllTravelRequests } from "../api/travelRequests";
import type { PayrollExport, PayrollExportStatus } from "../types/erpExport";
import type { ExpenseClaim } from "../types/expense";
import type { VendorBill } from "../types/vendor";
import type { TravelRequest } from "../types/travel";

export default function ErpExportsPage() {
  const { bootstrap } = useAuth();
  
  // Roles check (Finance Officer and Super Admin)
  const isFinanceOrAdmin =
    bootstrap?.role === "SUPER_ADMIN" || bootstrap?.role === "FINANCE_OFFICER";

  // Data states
  const [exports, setExports] = useState<PayrollExport[]>([]);
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([]);

  // Navigation states
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");
  const [pendingSubTab, setPendingSubTab] = useState<"EXPENSES" | "VENDORS" | "TRAVEL">("EXPENSES");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PayrollExportStatus>("ALL");

  // Selection states for exporting
  const [selectedExpenseClaimIds, setSelectedExpenseClaimIds] = useState<string[]>([]);
  const [selectedVendorBillIds, setSelectedVendorBillIds] = useState<string[]>([]);
  const [selectedTravelRequestIds, setSelectedTravelRequestIds] = useState<string[]>([]);

  // Modal / detail states
  const [selectedExport, setSelectedExport] = useState<PayrollExport | null>(null);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [exportNotes, setExportNotes] = useState("");
  const [failureReason, setFailureReason] = useState("");

  // Messaging Alerts
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync data feeds
  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [exportList, claimsList, billsList, requestsList] = await Promise.all([
        getAllPayrollExports(),
        getAllExpenseClaims(),
        getVendorBills(),
        getAllTravelRequests(),
      ]);

      setExports(exportList || []);
      setExpenseClaims(claimsList || []);
      setVendorBills(billsList || []);
      setTravelRequests(requestsList || []);
    } catch (err) {
      setError("Failed to load ERP sync registry");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter items ready for export
  const pendingExpenseClaims = useMemo(() => {
    return expenseClaims.filter(
      (claim) =>
        claim.status === "FINANCE_APPROVED" &&
        (!claim.payrollSyncStatus || claim.payrollSyncStatus === "READY_FOR_EXPORT")
    );
  }, [expenseClaims]);

  const pendingVendorBills = useMemo(() => {
    return vendorBills.filter(
      (bill) =>
        bill.status === "APPROVED" &&
        (!bill.payrollSyncStatus || bill.payrollSyncStatus === "READY_FOR_EXPORT")
    );
  }, [vendorBills]);

  const pendingTravelAllowances = useMemo(() => {
    return travelRequests.filter(
      (req) =>
        req.status === "APPROVED" &&
        req.estimatedBudget &&
        (!req.allowancePayrollSyncStatus || req.allowancePayrollSyncStatus === "READY_FOR_EXPORT")
    );
  }, [travelRequests]);

  // Combined metrics calculations
  const metrics = useMemo(() => {
    const totalExportedSum = exports
      .filter((e) => e.status === "SYNCED" || e.status === "DOWNLOADED" || e.status === "GENERATED")
      .reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      pendingExpensesCount: pendingExpenseClaims.length,
      pendingBillsCount: pendingVendorBills.length,
      pendingTravelCount: pendingTravelAllowances.length,
      totalExportedAmount: totalExportedSum,
    };
  }, [pendingExpenseClaims, pendingVendorBills, pendingTravelAllowances, exports]);

  // Filter exports history
  const filteredExports = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return exports.filter((exp) => {
      const matchesSearch =
        !keyword ||
        exp.exportNumber.toLowerCase().includes(keyword) ||
        exp.exportType.toLowerCase().includes(keyword) ||
        (exp.notes && exp.notes.toLowerCase().includes(keyword));

      const matchesStatus = statusFilter === "ALL" || exp.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [exports, searchQuery, statusFilter]);

  // Export handlers
  async function handleExportExpenses() {
    if (selectedExpenseClaimIds.length === 0) {
      setError("Please select at least one expense claim to export");
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const record = await createExpenseClaimsExport({
        format: "JSON",
        notes: exportNotes.trim() || undefined,
        expenseClaimIds: selectedExpenseClaimIds,
      });
      setMessage(`Export ${record.exportNumber} generated successfully`);
      setSelectedExpenseClaimIds([]);
      setExportNotes("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate expense export");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExportVendorBills() {
    if (selectedVendorBillIds.length === 0) {
      setError("Please select at least one vendor bill to export");
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const record = await createVendorBillsExport({
        format: "JSON",
        notes: exportNotes.trim() || undefined,
        vendorBillIds: selectedVendorBillIds,
      });
      setMessage(`Export ${record.exportNumber} generated successfully`);
      setSelectedVendorBillIds([]);
      setExportNotes("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate vendor bills export");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExportTravelAllowances() {
    if (selectedTravelRequestIds.length === 0) {
      setError("Please select at least one travel request to export");
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const record = await createTravelAllowancesExport({
        format: "JSON",
        notes: exportNotes.trim() || undefined,
        travelRequestIds: selectedTravelRequestIds,
      });
      setMessage(`Export ${record.exportNumber} generated successfully`);
      setSelectedTravelRequestIds([]);
      setExportNotes("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate travel allowances export");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExportCombined() {
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const record = await createCombinedPayrollExport({
        format: "JSON",
        notes: exportNotes.trim() || undefined,
      });
      setMessage(`Combined export ${record.exportNumber} generated successfully`);
      setExportNotes("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate combined export");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update Sync Status handlers
  async function handleMarkSynced(id: string) {
    setError("");
    setMessage("");
    try {
      await markPayrollExportAsSynced(id);
      setMessage("Payroll export marked as synced successfully");
      await loadData();
    } catch (err) {
      setError("Failed to sync export status");
    }
  }

  async function handleMarkFailedSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedExport || !failureReason.trim()) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await markPayrollExportAsFailed(selectedExport.id, {
        failureReason: failureReason.trim(),
      });
      setMessage("Export status updated to FAILED");
      setShowFailedModal(false);
      setFailureReason("");
      await loadData();
      setSelectedExport(null);
    } catch (err) {
      setError("Failed to update export failure logs");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Download CSV helper
  function handleDownloadCsv(exp: PayrollExport) {
    if (!exp.csvContent) return;
    const blob = new Blob([exp.csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${exp.exportNumber}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Multi select toggles
  function toggleExpenseSelect(id: string) {
    setSelectedExpenseClaimIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleVendorBillSelect(id: string) {
    setSelectedVendorBillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleTravelSelect(id: string) {
    setSelectedTravelRequestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Master toggles
  function toggleAllExpenses() {
    if (selectedExpenseClaimIds.length === pendingExpenseClaims.length) {
      setSelectedExpenseClaimIds([]);
    } else {
      setSelectedExpenseClaimIds(pendingExpenseClaims.map((c) => c.id));
    }
  }

  function toggleAllVendorBills() {
    if (selectedVendorBillIds.length === pendingVendorBills.length) {
      setSelectedVendorBillIds([]);
    } else {
      setSelectedVendorBillIds(pendingVendorBills.map((b) => b.id));
    }
  }

  function toggleAllTravelAllowances() {
    if (selectedTravelRequestIds.length === pendingTravelAllowances.length) {
      setSelectedTravelRequestIds([]);
    } else {
      setSelectedTravelRequestIds(pendingTravelAllowances.map((r) => r.id));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            ERP Payroll Integration exports
          </h1>
          <p className="text-sm text-slate-500">
            Synchronize approved claims, vendor transport invoices, and travel allowances into corporate HRIS ledger sheets.
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
            Sync Ledger
          </Button>

          {isFinanceOrAdmin && activeTab === "PENDING" && (
            <Button
              onClick={handleExportCombined}
              disabled={isSubmitting || (pendingExpenseClaims.length === 0 && pendingVendorBills.length === 0 && pendingTravelAllowances.length === 0)}
              className="rounded-xl text-xs py-2"
            >
              <FileSpreadsheet size={15} className="mr-1.5" />
              Generate Combined Export
            </Button>
          )}
        </div>
      </div>

      {/* Message alerts */}
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

      {/* Metrics Cards */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ready claims</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.pendingExpensesCount}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-700">
              <FileText size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ready Vendor Bills</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.pendingBillsCount}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3.5 text-amber-700">
              <PlusCircle size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ready Allowances</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.pendingTravelCount}</p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3.5 text-violet-700">
              <ArrowRightLeft size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Exported Amount</p>
              <p className="mt-2 text-xl font-extrabold text-slate-800">PKR {metrics.totalExportedAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3.5 text-emerald-700">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs list */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
              activeTab === "PENDING"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending Sync Registry
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
              activeTab === "HISTORY"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            ERP Exports Ledger
          </button>
        </div>

        <div className="flex items-center gap-3 pb-2 sm:pb-0">
          {activeTab === "HISTORY" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 py-1.5 px-2.5 text-xs outline-none focus:border-blue-600 bg-white font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="GENERATED">Generated</option>
              <option value="DOWNLOADED">Downloaded</option>
              <option value="SYNCED">Synced Success</option>
              <option value="FAILED">Failed Sync</option>
            </select>
          )}

          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-600 transition bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 italic">
          Syncing ERP exports feeds...
        </div>
      ) : activeTab === "PENDING" ? (
        /* PENDING EXPORT ITEMS TAB */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setPendingSubTab("EXPENSES")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-tight transition ${
                  pendingSubTab === "EXPENSES"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Claims ({pendingExpenseClaims.length})
              </button>
              <button
                onClick={() => setPendingSubTab("VENDORS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-tight transition ${
                  pendingSubTab === "VENDORS"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Vendor Invoices ({pendingVendorBills.length})
              </button>
              <button
                onClick={() => setPendingSubTab("TRAVEL")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-tight transition ${
                  pendingSubTab === "TRAVEL"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Travel Allowances ({pendingTravelAllowances.length})
              </button>
            </div>

            {pendingSubTab === "EXPENSES" ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedExpenseClaimIds.length === pendingExpenseClaims.length && pendingExpenseClaims.length > 0}
                          onChange={toggleAllExpenses}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingExpenseClaims.map((claim) => {
                      const isChecked = selectedExpenseClaimIds.includes(claim.id);
                      return (
                        <tr key={claim.id} className={`hover:bg-slate-50/50 transition ${isChecked ? "bg-blue-50/10" : ""}`}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleExpenseSelect(claim.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            <div>{claim.employee?.fullName || "Employee"}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{claim.employee?.email}</div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                            {claim.category}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            PKR {Number(claim.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-xs">
                            {claim.description}
                          </td>
                        </tr>
                      );
                    })}

                    {pendingExpenseClaims.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <CheckCircle className="mx-auto text-emerald-500" size={32} />
                          <h4 className="mt-3 font-bold text-slate-800 text-sm">All expense claims synced</h4>
                          <p className="text-slate-400 text-xs mt-0.5">There are no approved claims ready for export.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : pendingSubTab === "VENDORS" ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedVendorBillIds.length === pendingVendorBills.length && pendingVendorBills.length > 0}
                          onChange={toggleAllVendorBills}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Bill Number</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingVendorBills.map((bill) => {
                      const isChecked = selectedVendorBillIds.includes(bill.id);
                      return (
                        <tr key={bill.id} className={`hover:bg-slate-50/50 transition ${isChecked ? "bg-blue-50/10" : ""}`}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleVendorBillSelect(bill.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            <div>{bill.vendor?.vendorName || "Vendor"}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{bill.vendor?.contactPerson || ""}</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-xs text-slate-600">
                            {bill.billNumber}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            PKR {bill.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-xs">
                            {bill.description}
                          </td>
                        </tr>
                      );
                    })}

                    {pendingVendorBills.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <CheckCircle className="mx-auto text-emerald-500" size={32} />
                          <h4 className="mt-3 font-bold text-slate-800 text-sm">All vendor bills synced</h4>
                          <p className="text-slate-400 text-xs mt-0.5">There are no approved vendor bills ready for export.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedTravelRequestIds.length === pendingTravelAllowances.length && pendingTravelAllowances.length > 0}
                          onChange={toggleAllTravelAllowances}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Route Path</th>
                      <th className="px-6 py-4">Allowance Amount</th>
                      <th className="px-6 py-4">Travel Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingTravelAllowances.map((req) => {
                      const isChecked = selectedTravelRequestIds.includes(req.id);
                      return (
                        <tr key={req.id} className={`hover:bg-slate-50/50 transition ${isChecked ? "bg-blue-50/10" : ""}`}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTravelSelect(req.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            <div>{req.employee?.fullName || "Employee"}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.employee?.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-slate-800 font-semibold">
                              <span>{req.fromLocation}</span>
                              <span>&rarr;</span>
                              <span>{req.toLocation}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                              {req.travelType.replace(/_/g, " ")}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            PKR {req.estimatedBudget ? req.estimatedBudget.toLocaleString() : "0"}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                            {new Date(req.departureDate).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}

                    {pendingTravelAllowances.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <CheckCircle className="mx-auto text-emerald-500" size={32} />
                          <h4 className="mt-3 font-bold text-slate-800 text-sm">All travel allowances synced</h4>
                          <p className="text-slate-400 text-xs mt-0.5">There are no approved travel requests with allowances ready for export.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Panel Side */}
          <div className="space-y-4">
            <Card>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                <FileUp size={16} className="text-blue-700" /> Export Dispatch Panel
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Export Format
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition bg-slate-50 font-bold"
                    disabled
                  >
                    <option value="JSON">Standard JSON + CSV Payload</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Notes / Reference comments
                  </label>
                  <textarea
                    value={exportNotes}
                    onChange={(e) => setExportNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
                    placeholder="Reference remarks, ledger month info..."
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  {pendingSubTab === "EXPENSES" && (
                    <Button
                      onClick={handleExportExpenses}
                      disabled={isSubmitting || selectedExpenseClaimIds.length === 0}
                      className="rounded-xl w-full text-xs"
                    >
                      <PlusCircle size={13} className="mr-1.5" />
                      Sync Selected Claims ({selectedExpenseClaimIds.length})
                    </Button>
                  )}

                  {pendingSubTab === "VENDORS" && (
                    <Button
                      onClick={handleExportVendorBills}
                      disabled={isSubmitting || selectedVendorBillIds.length === 0}
                      className="rounded-xl w-full text-xs"
                    >
                      <PlusCircle size={13} className="mr-1.5" />
                      Sync Selected Bills ({selectedVendorBillIds.length})
                    </Button>
                  )}

                  {pendingSubTab === "TRAVEL" && (
                    <Button
                      onClick={handleExportTravelAllowances}
                      disabled={isSubmitting || selectedTravelRequestIds.length === 0}
                      className="rounded-xl w-full text-xs"
                    >
                      <PlusCircle size={13} className="mr-1.5" />
                      Sync Selected Allowances ({selectedTravelRequestIds.length})
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* EXPORTS HISTORY LEDGER TAB */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* List Table */}
          <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm max-h-[70vh] overflow-y-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Export ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Records</th>
                  <th className="px-6 py-4">Sync Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExports.map((exp) => {
                  const statusStyles = {
                    GENERATED: "bg-blue-50 text-blue-700 border-blue-100",
                    DOWNLOADED: "bg-amber-50 text-amber-700 border-amber-100",
                    SYNCED: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    FAILED: "bg-red-50 text-red-700 border-red-100",
                  };

                  return (
                    <tr
                      key={exp.id}
                      className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedExport?.id === exp.id ? "bg-slate-100/50" : ""}`}
                      onClick={() => {
                        setSelectedExport(exp);
                      }}
                    >
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1">
                          {exp.exportNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(exp.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                        {exp.exportType.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {exp.totalRecords}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        PKR {exp.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${statusStyles[exp.status]}`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight size={15} className="inline text-slate-400" />
                      </td>
                    </tr>
                  );
                })}

                {filteredExports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <History className="mx-auto text-slate-300" size={32} />
                      <h4 className="mt-3 font-bold text-slate-800 text-sm">No export records matching</h4>
                      <p className="text-slate-400 text-xs mt-0.5">Generate new export files in the pending sync tab.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Details Sidebar Panel */}
          <div className="space-y-4">
            {selectedExport ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800">{selectedExport.exportNumber}</h3>
                    <p className="text-2xs text-slate-400 mt-0.5">Generated by: {selectedExport.generatedBy?.fullName || "System"}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv(selectedExport)}
                    className="p-2 rounded-xl text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
                    title="Download CSV file"
                  >
                    <Download size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs">Total Amount</span>
                    <span className="font-bold text-slate-800">PKR {selectedExport.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs">Total Records</span>
                    <span className="font-bold text-slate-800">{selectedExport.totalRecords}</span>
                  </div>
                </div>

                {selectedExport.notes && (
                  <div>
                    <span className="block text-slate-400 font-semibold uppercase text-3xs mb-1">Export Comments</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{selectedExport.notes}"
                    </p>
                  </div>
                )}

                {selectedExport.status === "FAILED" && selectedExport.failureReason && (
                  <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 text-xs">
                    <span className="font-bold block uppercase tracking-wider text-2xs mb-1">Sync Failure Reason</span>
                    "{selectedExport.failureReason}"
                  </div>
                )}

                {isFinanceOrAdmin && (selectedExport.status === "GENERATED" || selectedExport.status === "DOWNLOADED") && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFailureReason("");
                        setShowFailedModal(true);
                      }}
                      className="rounded-xl w-full text-2xs py-2 border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <X size={12} className="mr-1" />
                      Mark Failed
                    </Button>
                    <Button
                      onClick={() => handleMarkSynced(selectedExport.id)}
                      className="rounded-xl w-full text-2xs py-2"
                    >
                      <Check size={12} className="mr-1" />
                      Mark Synced
                    </Button>
                  </div>
                )}

                <div>
                  <span className="block text-slate-400 font-semibold uppercase text-3xs mb-1.5">JSON Payload Payload</span>
                  <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-950 p-3 text-3xs text-emerald-400 font-mono leading-relaxed border border-slate-800 select-all">
                    <pre>{JSON.stringify(selectedExport.payload, null, 2)}</pre>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic text-xs bg-slate-50">
                <Database className="mx-auto mb-2 text-slate-300" size={32} />
                Select any export log record on the left to review details, sync parameters, payload structures, or download CSVs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MARK FAILED MODAL */}
      {showFailedModal && selectedExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Mark Sync Failure
            </h3>

            <form onSubmit={handleMarkFailedSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Reason for Sync Failure *
                </label>
                <textarea
                  required
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Specify ERP ledger import error warnings or sync details..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowFailedModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Logging sync failure..." : "Confirm Sync Failure"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
