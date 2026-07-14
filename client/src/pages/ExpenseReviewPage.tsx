import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  RefreshCcw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  financeApproveExpenseClaim,
  financeRejectExpenseClaim,
  getAllExpenseClaims,
  managerApproveExpenseClaim,
  managerRejectExpenseClaim,
  markExpenseClaimPaid,
} from "../api/expenses";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  ExpenseClaim,
  ExpenseClaimStatus,
} from "../types/expense";

interface ExpenseReviewPageProps {
  mode: "MANAGER" | "FINANCE";
}

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

function formatLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Not provided";
  }

  return value
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(value: number | string) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? amount.toLocaleString()
    : "0";
}

function getStatusBadge(status?: ExpenseClaimStatus | null) {
  switch (status) {
    case "SUBMITTED":
    case "PENDING_MANAGER_REVIEW":
    case "PENDING_FINANCE_REVIEW":
      return "bg-amber-50 text-amber-700";

    case "MANAGER_APPROVED":
    case "FINANCE_APPROVED":
      return "bg-blue-50 text-blue-700";

    case "PAID":
      return "bg-emerald-50 text-emerald-700";

    case "MANAGER_REJECTED":
    case "FINANCE_REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ExpenseReviewPage({
  mode,
}: ExpenseReviewPageProps) {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);

  const [selectedClaimId, setSelectedClaimId] =
    useState<string | null>(null);

  const [remarks, setRemarks] = useState("");
  const [paymentReference, setPaymentReference] =
    useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("PENDING");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [processingAction, setProcessingAction] =
    useState<string | null>(null);

  async function loadClaims() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getAllExpenseClaims();
      setClaims(data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch expense claims"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClaims();
  }, []);

  const selectedClaim = useMemo(() => {
    return (
      claims.find(
        (claim) => claim.id === selectedClaimId
      ) ?? null
    );
  }, [claims, selectedClaimId]);

  function isPendingForCurrentRole(
    status?: ExpenseClaimStatus
  ) {
    if (mode === "MANAGER") {
      return (
        status === "SUBMITTED" ||
        status === "PENDING_MANAGER_REVIEW"
      );
    }

    return (
      status === "MANAGER_APPROVED" ||
      status === "PENDING_FINANCE_REVIEW"
    );
  }

  const filteredClaims = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return claims.filter((claim) => {
      const matchesSearch =
        !keyword ||
        (claim.employee?.fullName ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (claim.employee?.email ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (claim.description ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (claim.category ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (claim.travelRequest?.toLocation ?? "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING"
          ? isPendingForCurrentRole(claim.status)
          : claim.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [claims, search, statusFilter, mode]);

  const summary = useMemo(() => {
    return {
      total: claims.length,

      pending: claims.filter((claim) =>
        isPendingForCurrentRole(claim.status)
      ).length,

      approved: claims.filter((claim) =>
        mode === "MANAGER"
          ? claim.status === "MANAGER_APPROVED" ||
            claim.status === "PENDING_FINANCE_REVIEW" ||
            claim.status === "FINANCE_APPROVED" ||
            claim.status === "PAID"
          : claim.status === "FINANCE_APPROVED" ||
            claim.status === "PAID"
      ).length,

      paid: claims.filter(
        (claim) => claim.status === "PAID"
      ).length,
    };
  }, [claims, mode]);

  function selectClaim(claim: ExpenseClaim) {
    setSelectedClaimId(claim.id);

    setRemarks(
      mode === "MANAGER"
        ? claim.managerRemarks ?? ""
        : claim.financeRemarks ?? ""
    );

    setPaymentReference(
      claim.paymentReference ?? ""
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeClaim() {
    setSelectedClaimId(null);
    setRemarks("");
    setPaymentReference("");
    setError("");
  }

  async function handleApprove() {
    if (!selectedClaim) {
      return;
    }

    const confirmed = window.confirm(
      `Approve expense claim for ${
        selectedClaim.employee?.fullName ??
        "this employee"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction("approve");
      setMessage("");
      setError("");

      if (mode === "MANAGER") {
        await managerApproveExpenseClaim(
          selectedClaim.id,
          {
            remarks: remarks.trim() || undefined,
          }
        );
      } else {
        await financeApproveExpenseClaim(
          selectedClaim.id,
          {
            remarks: remarks.trim() || undefined,
          }
        );
      }

      setMessage(
        mode === "MANAGER"
          ? "Expense claim approved by manager"
          : "Expense claim approved by finance"
      );

      closeClaim();
      await loadClaims();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to approve expense claim"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleReject() {
    if (!selectedClaim) {
      return;
    }

    if (!remarks.trim()) {
      setError(
        "Remarks are required when rejecting a claim"
      );
      return;
    }

    const confirmed = window.confirm(
      `Reject expense claim for ${
        selectedClaim.employee?.fullName ??
        "this employee"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction("reject");
      setMessage("");
      setError("");

      if (mode === "MANAGER") {
        await managerRejectExpenseClaim(
          selectedClaim.id,
          {
            remarks: remarks.trim(),
          }
        );
      } else {
        await financeRejectExpenseClaim(
          selectedClaim.id,
          {
            remarks: remarks.trim(),
          }
        );
      }

      setMessage("Expense claim rejected");

      closeClaim();
      await loadClaims();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to reject expense claim"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleMarkPaid() {
    if (!selectedClaim) {
      return;
    }

    if (!paymentReference.trim()) {
      setError(
        "Payment reference is required"
      );
      return;
    }

    const confirmed = window.confirm(
      "Mark this expense claim as paid?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction("paid");
      setMessage("");
      setError("");

      await markExpenseClaimPaid(
        selectedClaim.id,
        {
          paymentReference:
            paymentReference.trim(),

          remarks: remarks.trim() || undefined,
        }
      );

      setMessage(
        "Expense claim marked as paid"
      );

      closeClaim();
      await loadClaims();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to mark expense as paid"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {mode === "MANAGER"
              ? "Manager Verification"
              : "Finance Review"}
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {mode === "MANAGER"
              ? "Expense Claim Verification"
              : "Expense Claim Finance Review"}
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Review receipts, descriptions, travel
            references, amounts, and policy compliance.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadClaims}
        >
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">
            Total Claims
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {summary.total}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Pending Review
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {summary.pending}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Approved
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {summary.approved}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Paid
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {summary.paid}
          </p>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(330px,420px)_minmax(0,1fr)]">
        <Card>
          <h2 className="text-lg font-bold text-slate-900">
            {selectedClaim
              ? "Review Selected Claim"
              : "Select a Claim"}
          </h2>

          {selectedClaim ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <UserRound
                    size={21}
                    className="mt-0.5 text-blue-700"
                  />

                  <div>
                    <p className="font-bold text-slate-900">
                      {selectedClaim.employee?.fullName ??
                        "Employee"}
                    </p>

                    <p className="text-sm text-slate-500">
                      {selectedClaim.employee?.email ??
                        "-"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {selectedClaim.employee
                        ?.department ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Category
                  </p>

                  <p className="font-semibold text-slate-700">
                    {formatLabel(
                      selectedClaim.category
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Description
                  </p>

                  <p className="font-semibold text-slate-700">
                    {selectedClaim.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Amount
                  </p>

                  <p className="text-xl font-bold text-slate-900">
                    PKR{" "}
                    {formatAmount(
                      selectedClaim.amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Expense Date
                  </p>

                  <p className="font-semibold text-slate-700">
                    {formatDate(
                      selectedClaim.expenseDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Travel Reference
                  </p>

                  <p className="font-semibold text-slate-700">
                    {selectedClaim.travelRequest
                      ?.toLocation ??
                      "General expense"}
                  </p>
                </div>
              </div>

              {selectedClaim.receiptUrl ? (
                <a
                  href={selectedClaim.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700"
                >
                  View Receipt
                  <ExternalLink size={16} />
                </a>
              ) : (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-700">
                  No receipt attached
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {mode === "MANAGER"
                    ? "Manager Remarks"
                    : "Finance Remarks"}
                </label>

                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(event.target.value)
                  }
                  placeholder="Add verification comments"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {mode === "FINANCE" &&
                selectedClaim.status ===
                  "FINANCE_APPROVED" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Payment Reference
                    </label>

                    <input
                      value={paymentReference}
                      onChange={(event) =>
                        setPaymentReference(
                          event.target.value
                        )
                      }
                      placeholder="BANK-TRX-2026-001"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                )}

              {isPendingForCurrentRole(
                selectedClaim.status
              ) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={handleApprove}
                    disabled={
                      processingAction !== null
                    }
                  >
                    <CheckCircle2
                      size={16}
                      className="mr-2"
                    />

                    {processingAction === "approve"
                      ? "Approving..."
                      : "Approve"}
                  </Button>

                  <Button
                    variant="danger"
                    onClick={handleReject}
                    disabled={
                      processingAction !== null
                    }
                  >
                    <XCircle
                      size={16}
                      className="mr-2"
                    />

                    {processingAction === "reject"
                      ? "Rejecting..."
                      : "Reject"}
                  </Button>
                </div>
              )}

              {mode === "FINANCE" &&
                selectedClaim.status ===
                  "FINANCE_APPROVED" && (
                  <Button
                    className="w-full"
                    onClick={handleMarkPaid}
                    disabled={
                      processingAction !== null
                    }
                  >
                    <Banknote
                      size={16}
                      className="mr-2"
                    />

                    {processingAction === "paid"
                      ? "Processing..."
                      : "Mark as Paid"}
                  </Button>
                )}

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={closeClaim}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 py-12 text-center">
              <FileCheck2
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm text-slate-500">
                Select a claim from the table.
              </p>
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Employee Expense Claims
              </h2>

              <p className="text-sm text-slate-500">
                {filteredClaims.length} claims found
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search claims..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 xl:w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="PENDING">
                  Pending review
                </option>
                <option value="ALL">
                  All statuses
                </option>
                <option value="MANAGER_APPROVED">
                  Manager approved
                </option>
                <option value="FINANCE_APPROVED">
                  Finance approved
                </option>
                <option value="PAID">Paid</option>
                <option value="MANAGER_REJECTED">
                  Manager rejected
                </option>
                <option value="FINANCE_REJECTED">
                  Finance rejected
                </option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading expense claims...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1080px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">
                      Employee
                    </th>
                    <th className="px-4 py-2">
                      Expense
                    </th>
                    <th className="px-4 py-2">
                      Amount
                    </th>
                    <th className="px-4 py-2">
                      Travel
                    </th>
                    <th className="px-4 py-2">
                      Receipt
                    </th>
                    <th className="px-4 py-2">
                      Status
                    </th>
                    <th className="px-4 py-2 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className={`bg-slate-50 ${
                        selectedClaimId === claim.id
                          ? "outline outline-2 outline-blue-200"
                          : ""
                      }`}
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {claim.employee?.fullName ??
                            "Employee"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {claim.employee?.department ??
                            "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {formatLabel(claim.category)}
                        </p>

                        <p className="max-w-48 truncate text-xs text-slate-500">
                          {claim.description}
                        </p>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-800">
                        PKR {formatAmount(claim.amount)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {claim.travelRequest?.toLocation ??
                          "General expense"}
                      </td>

                      <td className="px-4 py-4">
                        {claim.receiptUrl ? (
                          <a
                            href={claim.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-blue-700 hover:underline"
                          >
                            Open receipt
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Missing
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                            claim.status
                          )}`}
                        >
                          {formatLabel(claim.status)}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            selectClaim(claim)
                          }
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredClaims.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No expense claims matched the
                        selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}