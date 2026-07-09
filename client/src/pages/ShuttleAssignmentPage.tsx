import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit,
  MapPin,
  RefreshCcw,
  Search,
  TicketCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  assignShuttleBooking,
  cancelShuttleBooking,
  getAllShuttleBookings,
} from "../api/shuttleBookings";
import type { AssignShuttleBookingInput } from "../api/shuttleBookings";
import { getTransportDropdowns } from "../api/drivers";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  ShuttleBooking,
  ShuttleBookingStatus,
} from "../types/shuttle";
import type {
  SmartStop,
  TransportRoute,
} from "../types/transport";

interface AssignmentFormState {
  routeId: string;
  pickupStopId: string;
  seatNumber: string;
  remarks: string;
}

const defaultAssignmentForm: AssignmentFormState = {
  routeId: "",
  pickupStopId: "",
  seatNumber: "",
  remarks: "",
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status: ShuttleBookingStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "ASSIGNED":
      return "bg-blue-50 text-blue-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    case "NO_SHOW":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ShuttleAssignmentPage() {
  const [bookings, setBookings] = useState<ShuttleBooking[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);

  const [selectedBookingId, setSelectedBookingId] =
    useState<string | null>(null);

  const [form, setForm] = useState<AssignmentFormState>(
    defaultAssignmentForm
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [shiftFilter, setShiftFilter] = useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  const bookingStatuses: Array<ShuttleBookingStatus | "ALL"> = [
    "ALL",
    "PENDING",
    "ASSIGNED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];

  const shiftTypes = [
    "ALL",
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NIGHT",
    "GENERAL",
  ];

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [bookingData, dropdownData] = await Promise.all([
        getAllShuttleBookings(),
        getTransportDropdowns(),
      ]);

      setBookings(bookingData);
      setRoutes(dropdownData.routes ?? []);

      if (
        selectedBookingId &&
        !bookingData.some(
          (booking) => booking.id === selectedBookingId
        )
      ) {
        setSelectedBookingId(null);
        setForm(defaultAssignmentForm);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch shuttle booking data"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedBooking = useMemo(() => {
    return (
      bookings.find(
        (booking) => booking.id === selectedBookingId
      ) ?? null
    );
  }, [bookings, selectedBookingId]);

  const selectedRoute = useMemo(() => {
    return (
      routes.find((route) => route.id === form.routeId) ?? null
    );
  }, [routes, form.routeId]);

  const availableStops: SmartStop[] = useMemo(() => {
    return [...(selectedRoute?.smartStops ?? [])].sort(
      (first, second) => first.stopOrder - second.stopOrder
    );
  }, [selectedRoute]);

  const filteredBookings = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return bookings.filter((booking) => {
      const matchesSearch =
        !keyword ||
        booking.employee?.fullName
          ?.toLowerCase()
          .includes(keyword) ||
        booking.employee?.email?.toLowerCase().includes(keyword) ||
        booking.employee?.employeeCode
          ?.toLowerCase()
          .includes(keyword) ||
        booking.pickupArea.toLowerCase().includes(keyword) ||
        booking.pickupAddress?.toLowerCase().includes(keyword) ||
        booking.route?.routeName?.toLowerCase().includes(keyword) ||
        booking.route?.routeCode?.toLowerCase().includes(keyword) ||
        booking.pickupStop?.stopName
          ?.toLowerCase()
          .includes(keyword) ||
        booking.seatNumber?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        booking.status === statusFilter;

      const matchesShift =
        shiftFilter === "ALL" ||
        booking.shiftType === shiftFilter;

      return matchesSearch && matchesStatus && matchesShift;
    });
  }, [bookings, search, statusFilter, shiftFilter]);

  const summary = useMemo(() => {
    return {
      total: bookings.length,

      pending: bookings.filter(
        (booking) => booking.status === "PENDING"
      ).length,

      assigned: bookings.filter(
        (booking) => booking.status === "ASSIGNED"
      ).length,

      completed: bookings.filter(
        (booking) => booking.status === "COMPLETED"
      ).length,
    };
  }, [bookings]);

  function resetAssignment() {
    setSelectedBookingId(null);
    setForm(defaultAssignmentForm);
    setError("");
  }

  function handleSelectBooking(booking: ShuttleBooking) {
    setSelectedBookingId(booking.id);
    setMessage("");
    setError("");

    setForm({
      routeId: booking.routeId ?? "",
      pickupStopId: booking.pickupStopId ?? "",
      seatNumber: booking.seatNumber ?? "",
      remarks: booking.remarks ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleAssignmentSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedBooking) {
      setError("Select a shuttle booking first");
      return;
    }

    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (!form.routeId) {
        throw new Error("Route is required");
      }

      if (!form.pickupStopId) {
        throw new Error("Pickup stop is required");
      }

      if (!form.seatNumber.trim()) {
        throw new Error("Seat number is required");
      }

      const pickupStopBelongsToRoute = availableStops.some(
        (stop) => stop.id === form.pickupStopId
      );

      if (!pickupStopBelongsToRoute) {
        throw new Error(
          "Selected pickup stop does not belong to the selected route"
        );
      }

      const payload: AssignShuttleBookingInput = {
        routeId: form.routeId,
        pickupStopId: form.pickupStopId,
        seatNumber: form.seatNumber.trim(),
      };

      if (form.remarks.trim()) {
        payload.remarks = form.remarks.trim();
      }

      await assignShuttleBooking(selectedBooking.id, payload);

      setMessage(
        `${selectedBooking.employee?.fullName ?? "Employee"} assigned successfully`
      );

      resetAssignment();
      setStatusFilter("ASSIGNED");

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to assign shuttle booking"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(booking: ShuttleBooking) {
    if (
      booking.status !== "PENDING" &&
      booking.status !== "ASSIGNED"
    ) {
      return;
    }

    const cancellationReason =
      window.prompt(
        "Enter cancellation reason. You may leave it blank."
      ) ?? "";

    const confirmed = window.confirm(
      `Cancel the shuttle booking for ${
        booking.employee?.fullName ?? "this employee"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(booking.id);
      setMessage("");
      setError("");

      await cancelShuttleBooking(booking.id, {
        remarks: cancellationReason.trim() || undefined,
      });

      setMessage("Shuttle booking cancelled successfully");

      if (selectedBookingId === booking.id) {
        resetAssignment();
      }

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to cancel shuttle booking"
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
            Transport Administration
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Shuttle Booking Assignment
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Review employee requests and assign routes, pickup
            stops, and seat numbers.
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

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Total Requests
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <TicketCheck size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Pending Assignment
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.pending}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Clock3 size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Assigned</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.assigned}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <BusFront size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Completed</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.completed}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(330px,420px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
              Assignment Form
            </p>

            <h2 className="mt-2 text-lg font-bold text-slate-900">
              {selectedBooking
                ? selectedBooking.status === "ASSIGNED"
                  ? "Update Assignment"
                  : "Assign Shuttle"
                : "Select a Request"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {selectedBooking
                ? `${
                    selectedBooking.employee?.fullName ??
                    "Employee"
                  } • ${formatDate(
                    selectedBooking.bookingDate
                  )}`
                : "Select a pending or assigned request from the table."}
            </p>
          </div>

          {selectedBooking ? (
            <form
              onSubmit={handleAssignmentSubmit}
              className="space-y-4"
            >
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <UserRound
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {selectedBooking.employee?.fullName ??
                        "Employee"}
                    </p>

                    <p className="truncate text-sm text-slate-500">
                      {selectedBooking.employee?.email ?? "-"}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Pickup: {selectedBooking.pickupArea}
                    </p>

                    <p className="text-xs text-slate-500">
                      Shift: {selectedBooking.shiftType}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Route
                </label>

                <select
                  value={form.routeId}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      routeId: event.target.value,
                      pickupStopId: "",
                    });
                  }}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select route</option>

                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.routeCode} — {route.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Pickup Stop
                </label>

                <select
                  value={form.pickupStopId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      pickupStopId: event.target.value,
                    })
                  }
                  required
                  disabled={!form.routeId}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    {form.routeId
                      ? "Select pickup stop"
                      : "Select a route first"}
                  </option>

                  {availableStops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.stopOrder}. {stop.stopName}
                      {stop.estimatedTime
                        ? ` — ${stop.estimatedTime}`
                        : ""}
                    </option>
                  ))}
                </select>

                {form.routeId &&
                  availableStops.length === 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      This route has no smart stops. Add stops from
                      Routes and Smart Stops first.
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Seat Number
                </label>

                <input
                  value={form.seatNumber}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      seatNumber: event.target.value,
                    })
                  }
                  placeholder="A-01"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assignment Remarks
                </label>

                <textarea
                  rows={4}
                  value={form.remarks}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      remarks: event.target.value,
                    })
                  }
                  placeholder="Optional transport instructions"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  disabled={
                    isSubmitting ||
                    availableStops.length === 0
                  }
                >
                  <CheckCircle2
                    size={16}
                    className="mr-2"
                  />

                  {isSubmitting
                    ? "Saving..."
                    : selectedBooking.status === "ASSIGNED"
                      ? "Update Assignment"
                      : "Assign Shuttle"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetAssignment}
                >
                  Close
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl bg-slate-50 py-12 text-center">
              <TicketCheck
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Select a booking request to begin assignment.
              </p>
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Employee Requests
              </h2>

              <p className="text-sm text-slate-500">
                {filteredBookings.length} requests found
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto">
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
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 xl:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {bookingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL"
                      ? "All statuses"
                      : status}
                  </option>
                ))}
              </select>

              <select
                value={shiftFilter}
                onChange={(event) =>
                  setShiftFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {shiftTypes.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift === "ALL"
                      ? "All shifts"
                      : shift}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              Loading shuttle requests...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1120px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Employee</th>
                    <th className="px-4 py-2">Date / Shift</th>
                    <th className="px-4 py-2">Pickup</th>
                    <th className="px-4 py-2">Route</th>
                    <th className="px-4 py-2">Stop / Seat</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`bg-slate-50 ${
                        selectedBookingId === booking.id
                          ? "outline outline-2 outline-blue-200"
                          : ""
                      }`}
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <div className="flex items-start gap-2">
                          <UserRound
                            size={17}
                            className="mt-0.5 shrink-0 text-blue-700"
                          />

                          <div className="min-w-0">
                            <p className="max-w-44 truncate font-semibold text-slate-900">
                              {booking.employee?.fullName ??
                                "Employee"}
                            </p>

                            <p className="max-w-44 truncate text-xs text-slate-500">
                              {booking.employee?.email ?? "-"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {booking.employee?.employeeCode ??
                                "No employee code"}
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
                            <p className="text-sm font-semibold text-slate-700">
                              {formatDate(booking.bookingDate)}
                            </p>

                            <p className="text-xs text-slate-500">
                              {booking.shiftType}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={16}
                            className="mt-0.5 text-red-500"
                          />

                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {booking.pickupArea}
                            </p>

                            <p className="max-w-44 truncate text-xs text-slate-500">
                              {booking.pickupAddress ?? "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {booking.route ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {booking.route.routeCode}
                            </p>

                            <p className="max-w-44 truncate text-xs text-slate-500">
                              {booking.route.routeName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not assigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {booking.pickupStop?.stopName ?? "-"}
                        </p>

                        <p className="text-xs text-slate-500">
                          Seat: {booking.seatNumber ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>

                        {booking.isProxyBooking && (
                          <p className="mt-2 text-xs font-medium text-violet-600">
                            Proxy booking
                          </p>
                        )}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {(booking.status === "PENDING" ||
                            booking.status === "ASSIGNED") && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() =>
                                handleSelectBooking(booking)
                              }
                            >
                              <Edit
                                size={15}
                                className="mr-2"
                              />

                              {booking.status === "ASSIGNED"
                                ? "Update"
                                : "Assign"}
                            </Button>
                          )}

                          {(booking.status === "PENDING" ||
                            booking.status === "ASSIGNED") && (
                            <Button
                              type="button"
                              variant="danger"
                              disabled={
                                processingId === booking.id
                              }
                              onClick={() => handleCancel(booking)}
                            >
                              <XCircle
                                size={15}
                                className="mr-2"
                              />

                              {processingId === booking.id
                                ? "Cancelling..."
                                : "Cancel"}
                            </Button>
                          )}

                          {booking.status !== "PENDING" &&
                            booking.status !== "ASSIGNED" && (
                              <span className="text-xs text-slate-400">
                                No action
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No shuttle requests matched the selected
                        filters.
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