import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BusFront,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCcw,
  Search,
  Send,
  TicketCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  cancelShuttleBooking,
  createShuttleBooking,
  getMyShuttleBookings,
} from "../api/shuttleBookings";
import type { CreateShuttleBookingInput } from "../api/shuttleBookings";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  ShuttleBooking,
  ShuttleBookingStatus,
} from "../types/shuttle";
import type { ShiftType } from "../types/transport";

interface BookingFormState {
  bookingDate: string;
  shiftType: ShiftType;
  pickupArea: string;
  pickupAddress: string;
  remarks: string;
}

const defaultForm: BookingFormState = {
  bookingDate: "",
  shiftType: "MORNING",
  pickupArea: "",
  pickupAddress: "",
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

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function ShuttleBookingsPage() {
  const { bootstrap } = useAuth();

  const [bookings, setBookings] = useState<ShuttleBooking[]>([]);
  const [form, setForm] = useState<BookingFormState>(defaultForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  const currentRole = bootstrap?.role;

  const shiftTypes = (
    bootstrap?.formOptions?.shiftTypes ?? [
      "MORNING",
      "AFTERNOON",
      "EVENING",
      "NIGHT",
      "GENERAL",
    ]
  ) as ShiftType[];

  const bookingStatuses = (
    bootstrap?.formOptions?.shuttleBookingStatuses ?? [
      "PENDING",
      "ASSIGNED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
    ]
  ) as ShuttleBookingStatus[];

  async function loadBookings() {
    if (currentRole && currentRole !== "EMPLOYEE") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const data = await getMyShuttleBookings();
      setBookings(data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch shuttle bookings"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [currentRole]);

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

  const filteredBookings = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return bookings.filter((booking) => {
      const matchesSearch =
        !keyword ||
        booking.pickupArea.toLowerCase().includes(keyword) ||
        booking.pickupAddress?.toLowerCase().includes(keyword) ||
        booking.route?.routeName?.toLowerCase().includes(keyword) ||
        booking.route?.routeCode?.toLowerCase().includes(keyword) ||
        booking.pickupStop?.stopName?.toLowerCase().includes(keyword) ||
        booking.seatNumber?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

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
      if (!form.bookingDate) {
        throw new Error("Booking date is required");
      }

      if (!form.pickupArea.trim()) {
        throw new Error("Pickup area is required");
      }

      const payload: CreateShuttleBookingInput = {
        bookingDate: form.bookingDate,
        shiftType: form.shiftType,
        pickupArea: form.pickupArea.trim(),
      };

      if (form.pickupAddress.trim()) {
        payload.pickupAddress = form.pickupAddress.trim();
      }

      if (form.remarks.trim()) {
        payload.remarks = form.remarks.trim();
      }

      await createShuttleBooking(payload);

      setMessage("Shuttle booking request submitted successfully");

      resetForm();
      await loadBookings();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to create shuttle booking"
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

    const reason =
      window.prompt(
        "Enter cancellation reason. You may leave it blank."
      ) ?? "";

    const confirmed = window.confirm(
      `Cancel shuttle booking for ${formatDate(
        booking.bookingDate
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(booking.id);
      setMessage("");
      setError("");

      await cancelShuttleBooking(booking.id, {
        remarks: reason.trim() || undefined,
      });

      setMessage("Shuttle booking cancelled successfully");

      await loadBookings();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to cancel shuttle booking"
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (currentRole && currentRole !== "EMPLOYEE") {
    return (
      <div className="min-w-0 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Shuttle Management
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Shuttle Bookings
          </h1>
        </div>

        <Card>
          <div className="py-10 text-center">
            <BusFront
              size={44}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Employee booking view
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              This screen is currently designed for employee shuttle
              requests. The Transport Admin assignment interface will
              be added in the next module.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Employee Mobility
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            My Shuttle Bookings
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Submit a shuttle request and track route, pickup stop,
            vehicle, and seat assignment.
          </p>
        </div>

        <Button variant="secondary" onClick={loadBookings}>
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
                Total Bookings
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
              <p className="text-sm text-slate-500">Pending</p>

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
              <UserCheck size={22} />
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
              <BusFront size={22} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(320px,410px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Send size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                New Booking Request
              </h2>

              <p className="text-sm text-slate-500">
                Transport Admin will assign the route, stop, and seat.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Booking Date
              </label>

              <input
                type="date"
                min={getTodayInputValue()}
                value={form.bookingDate}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bookingDate: event.target.value,
                  })
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Shift
              </label>

              <select
                value={form.shiftType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    shiftType: event.target.value as ShiftType,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {shiftTypes.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Pickup Area
              </label>

              <input
                value={form.pickupArea}
                onChange={(event) =>
                  setForm({
                    ...form,
                    pickupArea: event.target.value,
                  })
                }
                placeholder="Garden West"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Pickup Address
              </label>

              <textarea
                rows={3}
                value={form.pickupAddress}
                onChange={(event) =>
                  setForm({
                    ...form,
                    pickupAddress: event.target.value,
                  })
                }
                placeholder="Enter nearby landmark or complete address"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(event) =>
                  setForm({
                    ...form,
                    remarks: event.target.value,
                  })
                }
                placeholder="Optional instructions"
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
                : "Submit Booking Request"}
            </Button>
          </form>
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Booking History
              </h2>

              <p className="text-sm text-slate-500">
                {filteredBookings.length} bookings found
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
                  placeholder="Search bookings..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 xl:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">All statuses</option>

                {bookingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              Loading bookings...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1020px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Date / Shift</th>
                    <th className="px-4 py-2">Pickup</th>
                    <th className="px-4 py-2">Route</th>
                    <th className="px-4 py-2">Stop / Seat</th>
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4">
                        <div className="flex items-start gap-2">
                          <CalendarDays
                            size={17}
                            className="mt-0.5 text-slate-400"
                          />

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
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
                            size={17}
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
                              {booking.route.routeName}
                            </p>

                            <p className="text-xs text-slate-500">
                              {booking.route.routeCode}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Awaiting assignment
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {booking.pickupStop?.stopName ??
                            "Not assigned"}
                        </p>

                        <p className="text-xs text-slate-500">
                          Seat: {booking.seatNumber ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {booking.route?.vehicle ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {
                                booking.route.vehicle
                                  .vehicleNumber
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {booking.route.vehicle.vehicleType}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            -
                          </span>
                        )}
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

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        {(booking.status === "PENDING" ||
                          booking.status === "ASSIGNED") && (
                          <Button
                            type="button"
                            variant="danger"
                            disabled={processingId === booking.id}
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
                      </td>
                    </tr>
                  ))}

                  {filteredBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No shuttle bookings found.
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