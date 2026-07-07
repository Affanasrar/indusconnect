import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BadgeCheck,
  CarFront,
  Edit,
  IdCard,
  Power,
  RefreshCcw,
  Search,
  UserRoundCheck,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import {
  createDriver,
  deactivateDriver,
  getDrivers,
  getTransportDropdowns,
  updateDriver,
} from "../api/drivers";
import type {
  CreateDriverInput,
  UpdateDriverInput,
} from "../api/drivers";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type { UserProfile } from "../types/frontend";
import type {
  Driver,
  DriverStatus,
  Vehicle,
} from "../types/transport";

interface DriverFormState {
  userId: string;
  licenseNumber: string;
  cnic: string;
  address: string;
  status: DriverStatus;
  vehicleId: string;
}

const defaultForm: DriverFormState = {
  userId: "",
  licenseNumber: "",
  cnic: "",
  address: "",
  status: "AVAILABLE",
  vehicleId: "",
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

function getStatusBadge(status: DriverStatus) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";

    case "ASSIGNED":
      return "bg-blue-50 text-blue-700";

    case "INACTIVE":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverUsers, setDriverUsers] = useState<UserProfile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [form, setForm] = useState<DriverFormState>(defaultForm);
  const [editingDriverId, setEditingDriverId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  const driverStatuses: DriverStatus[] = [
    "AVAILABLE",
    "ASSIGNED",
    "INACTIVE",
  ];

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [driverData, dropdownData] = await Promise.all([
        getDrivers(),
        getTransportDropdowns(),
      ]);

      setDrivers(driverData);
      setDriverUsers(dropdownData.driverUsers ?? []);
      setVehicles(dropdownData.vehicles ?? []);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch driver data"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const registeredDriverUserIds = useMemo(() => {
    return new Set(drivers.map((driver) => driver.userId));
  }, [drivers]);

  const availableDriverUsers = useMemo(() => {
    return driverUsers.filter(
      (user) =>
        !registeredDriverUserIds.has(user.id) ||
        user.id === form.userId
    );
  }, [driverUsers, registeredDriverUserIds, form.userId]);

  const filteredDrivers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return drivers.filter((driver) => {
      const matchesSearch =
        !keyword ||
        driver.user?.fullName?.toLowerCase().includes(keyword) ||
        driver.user?.email?.toLowerCase().includes(keyword) ||
        driver.user?.phone?.toLowerCase().includes(keyword) ||
        driver.licenseNumber.toLowerCase().includes(keyword) ||
        driver.cnic?.toLowerCase().includes(keyword) ||
        driver.vehicle?.vehicleNumber
          ?.toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        driver.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter(
        (driver) => driver.status === "AVAILABLE"
      ).length,
      assigned: drivers.filter(
        (driver) => driver.status === "ASSIGNED"
      ).length,
      inactive: drivers.filter(
        (driver) => driver.status === "INACTIVE"
      ).length,
    };
  }, [drivers]);

  function resetForm() {
    setForm(defaultForm);
    setEditingDriverId(null);
    setError("");
  }

  function handleEdit(driver: Driver) {
    setEditingDriverId(driver.id);
    setMessage("");
    setError("");

    setForm({
      userId: driver.userId,
      licenseNumber: driver.licenseNumber,
      cnic: driver.cnic ?? "",
      address: driver.address ?? "",
      status: driver.status,
      vehicleId: driver.vehicleId ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (!form.userId && !editingDriverId) {
        throw new Error("Select a driver user");
      }

      if (!form.licenseNumber.trim()) {
        throw new Error("Licence number is required");
      }

      if (editingDriverId) {
        const updatePayload: UpdateDriverInput = {
          licenseNumber: form.licenseNumber.trim(),
          status: form.status,
        };

        if (form.cnic.trim()) {
          updatePayload.cnic = form.cnic.trim();
        }

        if (form.address.trim()) {
          updatePayload.address = form.address.trim();
        }

        if (form.vehicleId) {
          updatePayload.vehicleId = form.vehicleId;
        }

        await updateDriver(editingDriverId, updatePayload);

        setMessage("Driver updated successfully");
      } else {
        const createPayload: CreateDriverInput = {
          userId: form.userId,
          licenseNumber: form.licenseNumber.trim(),
        };

        if (form.cnic.trim()) {
          createPayload.cnic = form.cnic.trim();
        }

        if (form.address.trim()) {
          createPayload.address = form.address.trim();
        }

        if (form.vehicleId) {
          createPayload.vehicleId = form.vehicleId;
        }

        await createDriver(createPayload);

        setMessage("Driver profile created successfully");
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to save driver"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(driver: Driver) {
    if (driver.status === "INACTIVE") {
      return;
    }

    const confirmed = window.confirm(
      `Deactivate driver ${driver.user.fullName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(driver.id);
      setMessage("");
      setError("");

      await deactivateDriver(driver.id);

      setMessage(
        `${driver.user.fullName} was deactivated successfully`
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to deactivate driver"
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
            Driver Management
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Register drivers, maintain licence and CNIC information,
            and assign vehicles.
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
              <p className="text-sm text-slate-500">Total Drivers</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <UsersRound size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.available}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <UserRoundCheck size={22} />
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
              <CarFront size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Inactive</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.inactive}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Power size={22} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <UserRoundPlus size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingDriverId
                  ? "Edit Driver"
                  : "Register Driver"}
              </h2>

              <p className="text-sm text-slate-500">
                {editingDriverId
                  ? "Update the selected driver profile."
                  : "Create a profile from a driver user account."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Driver User
              </label>

              <select
                value={form.userId}
                disabled={Boolean(editingDriverId)}
                onChange={(event) =>
                  setForm({
                    ...form,
                    userId: event.target.value,
                  })
                }
                required={!editingDriverId}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select driver user</option>

                {availableDriverUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} — {user.email}
                  </option>
                ))}
              </select>

              {!editingDriverId &&
                availableDriverUsers.length === 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    No unused DRIVER user accounts are available.
                    Create a DRIVER user from User Management first.
                  </p>
                )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Licence Number
              </label>

              <input
                value={form.licenseNumber}
                onChange={(event) =>
                  setForm({
                    ...form,
                    licenseNumber: event.target.value,
                  })
                }
                placeholder="LIC-KHI-001"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                CNIC
              </label>

              <input
                value={form.cnic}
                onChange={(event) =>
                  setForm({
                    ...form,
                    cnic: event.target.value,
                  })
                }
                placeholder="42101-0000000-1"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Assigned Vehicle
              </label>

              <select
                value={form.vehicleId}
                onChange={(event) => {
                  const vehicleId = event.target.value;

                  setForm({
                    ...form,
                    vehicleId,
                    status: vehicleId ? "ASSIGNED" : "AVAILABLE",
                  });
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">No vehicle assigned</option>

                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber} — {vehicle.vehicleType}
                  </option>
                ))}
              </select>
            </div>

            {editingDriverId && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Driver Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as DriverStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  {driverStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Address
              </label>

              <textarea
                rows={4}
                value={form.address}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: event.target.value,
                  })
                }
                placeholder="Driver residential address"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                disabled={
                  isSubmitting ||
                  (!editingDriverId &&
                    availableDriverUsers.length === 0)
                }
              >
                {isSubmitting
                  ? "Saving..."
                  : editingDriverId
                    ? "Update Driver"
                    : "Register Driver"}
              </Button>

              {editingDriverId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Registered Drivers
              </h2>

              <p className="text-sm text-slate-500">
                {filteredDrivers.length} drivers found
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
                  placeholder="Search drivers..."
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

                {driverStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              Loading drivers...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[940px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Driver</th>
                    <th className="px-4 py-2">Licence / CNIC</th>
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Address</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {driver.user?.fullName ?? "Unknown Driver"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {driver.user?.email ?? "-"}
                        </p>

                        <p className="text-xs text-slate-400">
                          {driver.user?.phone ?? "No phone"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <IdCard
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {driver.licenseNumber}
                            </p>

                            <p className="text-xs text-slate-500">
                              {driver.cnic ?? "No CNIC"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {driver.vehicle ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {driver.vehicle.vehicleNumber}
                            </p>

                            <p className="text-xs text-slate-500">
                              {driver.vehicle.vehicleType}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not assigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                            driver.status
                          )}`}
                        >
                          {driver.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-44 truncate text-sm text-slate-600">
                          {driver.address ?? "-"}
                        </p>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleEdit(driver)}
                          >
                            <Edit size={15} className="mr-2" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            disabled={
                              driver.status === "INACTIVE" ||
                              processingId === driver.id
                            }
                            onClick={() =>
                              handleDeactivate(driver)
                            }
                          >
                            <Power size={15} className="mr-2" />

                            {processingId === driver.id
                              ? "Processing..."
                              : driver.status === "INACTIVE"
                                ? "Inactive"
                                : "Deactivate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No drivers matched the selected filters.
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