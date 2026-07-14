import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CalendarDays,
  ExternalLink,
  RefreshCcw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import {
  cancelExpenseClaim,
  createExpenseClaim,
  getMyExpenseClaims,
  submitExpenseClaim,
} from "../api/expenses";
import type { CreateExpenseClaimInput } from "../api/expenses";
import { getMyTravelRequests } from "../api/travelRequests";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  ExpenseCategory,
  ExpenseClaim,
  ExpenseClaimStatus,
} from "../types/expense";
import type { TravelRequest } from "../types/travel";

interface ExpenseFormState {
  travelRequestId: string;
  category: ExpenseCategory;
  expenseDate: string;
  amount: number;
  description: string;
  receiptUrl: string;
}

const defaultForm: ExpenseFormState = {
  travelRequestId: "",
  category: "TRAVEL",
  expenseDate: "",
  amount: 0,
  description: "",
  receiptUrl: "",
};

const categories: ExpenseCategory[] = [
  "TRAVEL",
  "ACCOMMODATION",
  "MEAL",
  "FUEL",
  "TOLL",
  "LOCAL_TRANSPORT",
  "MEDICAL",
  "OTHER",
];

const statuses: Array<ExpenseClaimStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "PENDING_MANAGER_REVIEW",
  "MANAGER_APPROVED",
  "MANAGER_REJECTED",
  "PENDING_FINANCE_REVIEW",
  "FINANCE_APPROVED",
  "FINANCE_REJECTED",
  "PAID",
  "CANCELLED",
];

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

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return amount.toLocaleString();
}

function getStatusBadge(status?: ExpenseClaimStatus | null) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";

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

function canCancelClaim(status?: ExpenseClaimStatus) {
  return (
    status === "DRAFT" ||
    status === "SUBMITTED" ||
    status === "PENDING_MANAGER_REVIEW"
  );
}

export default function EmployeeExpensesPage() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [travelRequests, setTravelRequests] = useState<
    TravelRequest[]
  >([]);

  const [form, setForm] =
    useState<ExpenseFormState>(defaultForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [claimData, travelData] = await Promise.all([
        getMyExpenseClaims(),
        getMyTravelRequests(),
      ]);

      setClaims(claimData);

      setTravelRequests(
        travelData.filter(
          (request) => request.status === "APPROVED"
        )
      );
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
    loadData();
  }, []);

  const summary = useMemo(() => {
    return {
      total: claims.length,

      underReview: claims.filter((claim) =>
        [
          "SUBMITTED",
          "PENDING_MANAGER_REVIEW",
          "MANAGER_APPROVED",
          "PENDING_FINANCE_REVIEW",
        ].includes(claim.status)
      ).length,

      approved: claims.filter(
        (claim) =>
          claim.status === "FINANCE_APPROVED"
      ).length,

      paid: claims.filter(
        (claim) => claim.status === "PAID"
      ).length,
    };
  }, [claims]);

  const filteredClaims = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return claims.filter((claim) => {
      const matchesSearch =
        !keyword ||
        (claim.description ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (claim.category ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (claim.travelRequest?.toLocation ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (claim.paymentReference ?? "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        claim.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [claims, search, statusFilter]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (!form.expenseDate) {
        throw new Error("Expense date is required");
      }

      if (form.amount <= 0) {
        throw new Error(
          "Expense amount must be greater than zero"
        );
      }

      if (!form.description.trim()) {
        throw new Error(
          "Expense description is required"
        );
      }

      const payload: CreateExpenseClaimInput = {
        category: form.category,
        expenseDate: form.expenseDate,
        amount: Number(form.amount),
        currency: "PKR",
        description: form.description.trim(),
      };

      if (form.travelRequestId) {
        payload.travelRequestId =
          form.travelRequestId;
      }

      if (form.receiptUrl.trim()) {
        payload.receiptUrl =
          form.receiptUrl.trim();
      }

      await createExpenseClaim(payload);

      setMessage(
        "Expense claim created successfully"
      );

      setForm(defaultForm);
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to create expense claim"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitDraft(
    claim: ExpenseClaim
  ) {
    try {
      setProcessingId(claim.id);
      setMessage("");
      setError("");

      await submitExpenseClaim(claim.id);

      setMessage(
        "Expense claim submitted for review"
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to submit expense claim"
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCancel(
    claim: ExpenseClaim
  ) {
    const reason =
      window.prompt(
        "Enter cancellation reason. You may leave it blank."
      ) ?? "";

    const confirmed = window.confirm(
      "Cancel this expense claim?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(claim.id);
      setMessage("");
      setError("");

      await cancelExpenseClaim(
        claim.id,
        reason.trim() || undefined
      );

      setMessage(
        "Expense claim cancelled successfully"
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to cancel expense claim"
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Employee Finance
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            My Expense Claims
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Submit official expenses and track manager,
            finance, and payment status.
          </p>
        </div>

        <Button variant="secondary" onClick={loadData}>
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
            Under Review
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {summary.underReview}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Finance Approved
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

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <FileReceipt size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                New Expense Claim
              </h2>

              <p className="text-sm text-slate-500">
                Add accurate expense and receipt details.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Related Travel Request
              </label>

              <select
                value={form.travelRequestId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    travelRequestId:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  General expense — no travel request
                </option>

                {travelRequests.map((request) => (
                  <option
                    key={request.id}
                    value={request.id}
                  >
                    {request.toLocation} —{" "}
                    {formatDate(request.departureDate)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Expense Category
              </label>

              <select
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category:
                      event.target
                        .value as ExpenseCategory,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {formatLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Expense Date
              </label>

              <input
                type="date"
                value={form.expenseDate}
                onChange={(event) =>
                  setForm({
                    ...form,
                    expenseDate: event.target.value,
                  })
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Amount in PKR
              </label>

              <input
                type="number"
                min={1}
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    amount: Number(event.target.value),
                  })
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                placeholder="Explain the official expense"
                required
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Receipt URL
              </label>

              <input
                type="url"
                value={form.receiptUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    receiptUrl: event.target.value,
                  })
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Enter the uploaded receipt or invoice URL.
              </p>
            </div>

            <Button
              className="w-full"
              disabled={isSubmitting}
            >
              <Send size={16} className="mr-2" />

              {isSubmitting
                ? "Submitting..."
                : "Create Expense Claim"}
            </Button>
          </form>
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Claim History
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
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL"
                      ? "All statuses"
                      : formatLabel(status)}
                  </option>
                ))}
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
                      Expense
                    </th>
                    <th className="px-4 py-2">
                      Date
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
                      className="bg-slate-50"
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {formatLabel(claim.category)}
                        </p>

                        <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                          {claim.description}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <CalendarDays size={16} />
                          {formatDate(claim.expenseDate)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-800">
                        PKR {formatAmount(claim.amount)}
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-44 truncate text-sm text-slate-600">
                          {claim.travelRequest?.toLocation ??
                            "General expense"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {claim.receiptUrl ? (
                          <a
                            href={claim.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                          >
                            View receipt
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No receipt
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

                        {(claim.managerRemarks ||
                          claim.financeRemarks) && (
                          <p className="mt-2 max-w-48 truncate text-xs text-slate-500">
                            {claim.financeRemarks ??
                              claim.managerRemarks}
                          </p>
                        )}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {claim.status === "DRAFT" && (
                            <Button
                              type="button"
                              disabled={
                                processingId === claim.id
                              }
                              onClick={() =>
                                handleSubmitDraft(claim)
                              }
                            >
                              <Send
                                size={15}
                                className="mr-2"
                              />
                              Submit
                            </Button>
                          )}

                          {canCancelClaim(claim.status) && (
                            <Button
                              type="button"
                              variant="danger"
                              disabled={
                                processingId === claim.id
                              }
                              onClick={() =>
                                handleCancel(claim)
                              }
                            >
                              <XCircle
                                size={15}
                                className="mr-2"
                              />

                              {processingId === claim.id
                                ? "Processing..."
                                : "Cancel"}
                            </Button>
                          )}

                          {!canCancelClaim(claim.status) &&
                            claim.status !== "DRAFT" && (
                              <span className="text-xs text-slate-400">
                                No action
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredClaims.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No expense claims found.
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