import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hotel,
  MapPin,
  Plane,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  approveTravelRequest,
  cancelTravelRequest,
  createTravelRequest,
  getAllTravelRequests,
  getMyTravelRequests,
  rejectTravelRequest,
} from "../api/travelRequests";
import type {
  CreateTravelRequestInput,
  TravelDecisionInput,
} from "../api/travelRequests";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  TravelMode,
  TravelRequest,
  TravelRequestStatus,
  TravelType,
} from "../types/travel";

interface TravelFormState {
  travelType: TravelType;
  purpose: string;
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  returnDate: string;
  travelMode: TravelMode;
  requiresAccommodation: boolean;
  isEmergency: boolean;
  notes: string;
}

const defaultForm: TravelFormState = {
  travelType: "INTER_CITY",
  purpose: "",
  fromLocation: "",
  toLocation: "",
  departureDate: "",
  returnDate: "",
  travelMode: "COMPANY_VEHICLE",
  requiresAccommodation: false,
  isEmergency: false,
  notes: "",
};

const travelTypes: TravelType[] = [
  "INTER_CAMPUS",
  "IN_CITY_EVENT",
  "INTER_CITY",
  "INTERNATIONAL",
];

const travelModes: TravelMode[] = [
  "COMPANY_VEHICLE",
  "BUS",
  "TRAIN",
  "AIR",
  "SELF",
];

const requestStatuses: Array<TravelRequestStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "PENDING_MANAGER_APPROVAL",
  "APPROVED",
  "REJECTED",
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

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isPending(
  status?: TravelRequestStatus | null
) {
  return (
    status === "PENDING" ||
    status === "PENDING_MANAGER_APPROVAL"
  );
}

function getStatusBadge(
  status?: TravelRequestStatus | null
) {
  switch (status) {
    case "PENDING":
    case "PENDING_MANAGER_APPROVAL":
      return "bg-amber-50 text-amber-700";

    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getMinimumDate() {
  return new Date().toISOString().slice(0, 10);
}

function EmployeeTravelRequestsPage() {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [form, setForm] =
    useState<TravelFormState>(defaultForm);

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

  async function loadRequests() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getMyTravelRequests();
      setRequests(data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch travel requests"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const summary = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter((request) =>
        isPending(request.status)
      ).length,

      approved: requests.filter(
        (request) => request.status === "APPROVED"
      ).length,

      accommodation: requests.filter(
        (request) => request.requiresAccommodation
      ).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesSearch =
  !keyword ||
  (request.purpose ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.fromLocation ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.toLocation ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.travelType ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.travelMode ?? "")
    .toLowerCase()
    .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  function resetForm() {
    setForm(defaultForm);
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (!form.purpose.trim()) {
        throw new Error("Travel purpose is required");
      }

      if (!form.fromLocation.trim()) {
        throw new Error("Starting location is required");
      }

      if (!form.toLocation.trim()) {
        throw new Error("Destination is required");
      }

      if (!form.departureDate || !form.returnDate) {
        throw new Error(
          "Departure and return dates are required"
        );
      }

      if (
        new Date(form.returnDate) <
        new Date(form.departureDate)
      ) {
        throw new Error(
          "Return date cannot be before departure date"
        );
      }

      const payload: CreateTravelRequestInput = {
        travelType: form.travelType,
        purpose: form.purpose.trim(),
        fromLocation: form.fromLocation.trim(),
        toLocation: form.toLocation.trim(),
        departureDate: form.departureDate,
        returnDate: form.returnDate,
        travelMode: form.travelMode,
        requiresAccommodation:
          form.requiresAccommodation,
        isEmergency: form.isEmergency,
      };

      if (form.notes.trim()) {
        payload.notes = form.notes.trim();
      }

      await createTravelRequest(payload);

      setMessage(
        "Travel request submitted successfully"
      );

      resetForm();
      await loadRequests();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to submit travel request"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(
    request: TravelRequest
  ) {
    if (!isPending(request.status)) {
      return;
    }

    const reason =
      window.prompt(
        "Enter cancellation reason. You may leave it blank."
      ) ?? "";

    const confirmed = window.confirm(
      `Cancel the travel request to ${request.toLocation}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(request.id);
      setMessage("");
      setError("");

      await cancelTravelRequest(request.id, {
        remarks: reason.trim() || undefined,
      });

      setMessage(
        "Travel request cancelled successfully"
      );

      await loadRequests();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to cancel travel request"
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Official Travel
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            My Travel Requests
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Submit official travel requests and track
            approval, policy, and accommodation status.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadRequests}
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

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Requests
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <Plane
              size={24}
              className="text-blue-700"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pending
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {summary.pending}
              </p>
            </div>

            <Clock3
              size={24}
              className="text-amber-700"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Approved
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {summary.approved}
              </p>
            </div>

            <CheckCircle2
              size={24}
              className="text-emerald-700"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Need Accommodation
              </p>
              <p className="mt-2 text-2xl font-bold text-violet-700">
                {summary.accommodation}
              </p>
            </div>

            <Hotel
              size={24}
              className="text-violet-700"
            />
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Send size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                New Travel Request
              </h2>

              <p className="text-sm text-slate-500">
                Submit travel information for manager
                approval.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Travel Type
              </label>

              <select
                value={form.travelType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    travelType: event.target
                      .value as TravelType,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {travelTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Purpose
              </label>

              <textarea
                rows={3}
                value={form.purpose}
                onChange={(event) =>
                  setForm({
                    ...form,
                    purpose: event.target.value,
                  })
                }
                placeholder="Official meeting, training, conference..."
                required
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                From Location
              </label>

              <input
                value={form.fromLocation}
                onChange={(event) =>
                  setForm({
                    ...form,
                    fromLocation: event.target.value,
                  })
                }
                placeholder="Karachi Head Office"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Destination
              </label>

              <input
                value={form.toLocation}
                onChange={(event) =>
                  setForm({
                    ...form,
                    toLocation: event.target.value,
                  })
                }
                placeholder="Lahore Regional Office"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Departure
                </label>

                <input
                  type="date"
                  min={getMinimumDate()}
                  value={form.departureDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      departureDate:
                        event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Return
                </label>

                <input
                  type="date"
                  min={
                    form.departureDate ||
                    getMinimumDate()
                  }
                  value={form.returnDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      returnDate:
                        event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Travel Mode
              </label>

              <select
                value={form.travelMode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    travelMode: event.target
                      .value as TravelMode,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {travelModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {formatLabel(mode)}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={form.requiresAccommodation}
                onChange={(event) =>
                  setForm({
                    ...form,
                    requiresAccommodation:
                      event.target.checked,
                  })
                }
                className="mt-0.5 h-5 w-5"
              />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Accommodation required
                </p>

                <p className="text-xs text-slate-500">
                  Internal guest-house availability will
                  be checked after approval.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <input
                type="checkbox"
                checked={form.isEmergency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    isEmergency:
                      event.target.checked,
                  })
                }
                className="mt-0.5 h-5 w-5"
              />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Emergency travel
                </p>

                <p className="text-xs text-red-600">
                  Use only for urgent organizational
                  travel.
                </p>
              </div>
            </label>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Additional Notes
              </label>

              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    notes: event.target.value,
                  })
                }
                placeholder="Optional information"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <Button
              className="w-full"
              disabled={isSubmitting}
            >
              <Send size={16} className="mr-2" />

              {isSubmitting
                ? "Submitting..."
                : "Submit Travel Request"}
            </Button>
          </form>
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Request History
              </h2>

              <p className="text-sm text-slate-500">
                {filteredRequests.length} requests found
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
                  placeholder="Search requests..."
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
                {requestStatuses.map((status) => (
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
              Loading travel requests...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1050px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">
                      Travel
                    </th>
                    <th className="px-4 py-2">
                      Locations
                    </th>
                    <th className="px-4 py-2">
                      Dates
                    </th>
                    <th className="px-4 py-2">
                      Mode
                    </th>
                    <th className="px-4 py-2">
                      Accommodation
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
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="bg-slate-50"
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          {formatLabel(
                            request.travelType
                          )}
                        </p>

                        <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                          {request.purpose}
                        </p>

                        {request.isEmergency && (
                          <span className="mt-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                            EMERGENCY
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {request.fromLocation}
                        </p>

                        <p className="text-xs text-slate-500">
                          to {request.toLocation}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-700">
                          {formatDate(
                            request.departureDate
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          Return:{" "}
                          {formatDate(
                            request.returnDate
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {formatLabel(
                          request.travelMode
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {request.requiresAccommodation ? (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                            Required
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not required
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                            request.status
                          )}`}
                        >
                          {formatLabel(
                            request.status
                          )}
                        </span>

                        {request.managerRemarks && (
                          <p className="mt-2 max-w-52 truncate text-xs text-slate-500">
                            {
                              request.managerRemarks
                            }
                          </p>
                        )}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        {isPending(request.status) ? (
                          <Button
                            type="button"
                            variant="danger"
                            disabled={
                              processingId === request.id
                            }
                            onClick={() =>
                              handleCancel(request)
                            }
                          >
                            <XCircle
                              size={15}
                              className="mr-2"
                            />

                            {processingId === request.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No travel requests found.
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

function ManagerTravelApprovalPage() {
  const [requests, setRequests] =
    useState<TravelRequest[]>([]);

  const [selectedRequestId, setSelectedRequestId] =
    useState<string | null>(null);

  const [managerRemarks, setManagerRemarks] =
    useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("PENDING");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [processingAction, setProcessingAction] =
    useState<string | null>(null);

  const selectedRequest = useMemo(() => {
    return (
      requests.find(
        (request) =>
          request.id === selectedRequestId
      ) ?? null
    );
  }, [requests, selectedRequestId]);

  async function loadRequests() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getAllTravelRequests();
      setRequests(data);

      if (
        selectedRequestId &&
        !data.some(
          (request) =>
            request.id === selectedRequestId
        )
      ) {
        setSelectedRequestId(null);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch travel requests"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const summary = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter((request) =>
        isPending(request.status)
      ).length,

      approved: requests.filter(
        (request) =>
          request.status === "APPROVED"
      ).length,

      emergency: requests.filter(
        (request) => request.isEmergency
      ).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesSearch =
  !keyword ||
  (request.employee?.fullName ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.employee?.email ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.employee?.department ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.purpose ?? "")
    .toLowerCase()
    .includes(keyword) ||
  (request.toLocation ?? "")
    .toLowerCase()
    .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING"
          ? isPending(request.status)
          : request.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  function selectRequest(request: TravelRequest) {
    setSelectedRequestId(request.id);
    setManagerRemarks(
      request.managerRemarks ?? ""
    );
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeRequest() {
    setSelectedRequestId(null);
    setManagerRemarks("");
    setError("");
  }

  async function handleApprove() {
    if (!selectedRequest) {
      return;
    }

    const confirmed = window.confirm(
      `Approve travel request for ${
        selectedRequest.employee?.fullName ??
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

      const payload: TravelDecisionInput = {
        managerRemarks:
          managerRemarks.trim() || undefined,
      };

      await approveTravelRequest(
        selectedRequest.id,
        payload
      );

      setMessage(
        "Travel request approved successfully"
      );

      closeRequest();
      await loadRequests();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to approve travel request"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleReject() {
    if (!selectedRequest) {
      return;
    }

    if (!managerRemarks.trim()) {
      setError(
        "Manager remarks are required when rejecting a request"
      );
      return;
    }

    const confirmed = window.confirm(
      `Reject travel request for ${
        selectedRequest.employee?.fullName ??
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

      await rejectTravelRequest(
        selectedRequest.id,
        {
          managerRemarks:
            managerRemarks.trim(),
        }
      );

      setMessage(
        "Travel request rejected successfully"
      );

      closeRequest();
      await loadRequests();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to reject travel request"
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
            Manager Approval
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Travel Request Approvals
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Review official travel purpose, dates,
            policy details, emergency status, and
            accommodation requirements.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadRequests}
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
            Total Requests
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {summary.total}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Pending Approval
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {summary.pending}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Approved
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {summary.approved}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Emergency Requests
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {summary.emergency}
          </p>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(330px,420px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
              Approval Decision
            </p>

            <h2 className="mt-2 text-lg font-bold text-slate-900">
              {selectedRequest
                ? "Review Request"
                : "Select a Request"}
            </h2>
          </div>

          {selectedRequest ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <UserRound
                    size={21}
                    className="mt-0.5 text-blue-700"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {selectedRequest.employee
                        ?.fullName ?? "Employee"}
                    </p>

                    <p className="truncate text-sm text-slate-500">
                      {selectedRequest.employee?.email ??
                        "-"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {selectedRequest.employee
                        ?.department ??
                        "No department"}{" "}
                      •{" "}
                      {selectedRequest.employee
                        ?.hrGrade ?? "No HR grade"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRequest.isEmergency && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle
                      size={20}
                      className="shrink-0 text-red-700"
                    />

                    <div>
                      <p className="font-bold text-red-800">
                        Emergency request
                      </p>

                      <p className="mt-1 text-sm text-red-600">
                        Review this request urgently.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Purpose
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {selectedRequest.purpose}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Journey
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {selectedRequest.fromLocation} →{" "}
                    {selectedRequest.toLocation}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Travel Dates
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {formatDate(
                      selectedRequest.departureDate
                    )}{" "}
                    –{" "}
                    {formatDate(
                      selectedRequest.returnDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Travel Mode
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {formatLabel(
                      selectedRequest.travelMode
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Accommodation
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {selectedRequest.requiresAccommodation
                      ? "Required"
                      : "Not required"}
                  </p>
                </div>

                {selectedRequest.dailyAllowance !==
                  null &&
                  selectedRequest.dailyAllowance !==
                    undefined && (
                    <div>
                      <p className="text-xs uppercase text-slate-400">
                        Policy Allowance
                      </p>

                      <p className="mt-1 font-semibold text-slate-700">
                        PKR{" "}
                        {selectedRequest.dailyAllowance.toLocaleString()}
                      </p>
                    </div>
                  )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Manager Remarks
                </label>

                <textarea
                  rows={4}
                  value={managerRemarks}
                  onChange={(event) =>
                    setManagerRemarks(
                      event.target.value
                    )
                  }
                  placeholder="Add approval or rejection comments"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {isPending(selectedRequest.status) ? (
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
              ) : (
                <div
                  className={`rounded-xl px-4 py-3 text-center text-sm font-bold ${getStatusBadge(
                    selectedRequest.status
                  )}`}
                >
                  Request is{" "}
                  {formatLabel(
                    selectedRequest.status
                  )}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={closeRequest}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 py-12 text-center">
              <Building2
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm text-slate-500">
                Select a request from the table.
              </p>
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Employee Travel Requests
              </h2>

              <p className="text-sm text-slate-500">
                {filteredRequests.length} requests found
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
                  placeholder="Search employee..."
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
                {requestStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL"
                      ? "All statuses"
                      : status === "PENDING"
                        ? "Pending approval"
                        : formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading approval requests...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1120px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">
                      Employee
                    </th>
                    <th className="px-4 py-2">
                      Travel
                    </th>
                    <th className="px-4 py-2">
                      Journey
                    </th>
                    <th className="px-4 py-2">
                      Dates
                    </th>
                    <th className="px-4 py-2">
                      Stay
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
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className={`bg-slate-50 ${
                        selectedRequestId === request.id
                          ? "outline outline-2 outline-blue-200"
                          : ""
                      }`}
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {request.employee?.fullName ??
                            "Employee"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {request.employee
                            ?.department ?? "-"}
                        </p>

                        <p className="text-xs text-slate-400">
                          {request.employee
                            ?.employeeCode ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {formatLabel(
                            request.travelType
                          )}
                        </p>

                        <p className="max-w-44 truncate text-xs text-slate-500">
                          {request.purpose}
                        </p>

                        {request.isEmergency && (
                          <span className="mt-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                            EMERGENCY
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={16}
                            className="mt-0.5 text-red-500"
                          />

                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {request.fromLocation}
                            </p>

                            <p className="text-xs text-slate-500">
                              to{" "}
                              {request.toLocation}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <CalendarDays
                            size={16}
                            className="mt-0.5 text-slate-400"
                          />

                          <div>
                            <p className="text-sm text-slate-700">
                              {formatDate(
                                request.departureDate
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              to{" "}
                              {formatDate(
                                request.returnDate
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {request.requiresAccommodation ? (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                            Required
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                            request.status
                          )}`}
                        >
                          {formatLabel(
                            request.status
                          )}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            selectRequest(request)
                          }
                        >
                          {isPending(request.status)
                            ? "Review"
                            : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No travel requests matched the
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

export default function TravelRequestsPage() {
  const { bootstrap, user } = useAuth();

  const role = bootstrap?.role ?? user?.role?.name;

  if (!role) {
    return (
      <div className="min-w-0 space-y-6">
        <Card>
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-500">
              Loading travel request module...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (role === "EMPLOYEE") {
    return <EmployeeTravelRequestsPage />;
  }

  if (
    role === "MANAGER" ||
    role === "SUPER_ADMIN"
  ) {
    return <ManagerTravelApprovalPage />;
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Official Travel
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Travel Requests
        </h1>
      </div>

      <Card>
        <div className="py-12 text-center">
          <ShieldAlert
            size={44}
            className="mx-auto text-amber-500"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Limited access
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Travel request creation is available to employees,
            while approval access is available to managers and
            Super Admin.
          </p>
        </div>
      </Card>
    </div>
  );
}