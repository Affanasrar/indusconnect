import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BusFront,
  Edit,
  PlusCircle,
  Power,
  RefreshCcw,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import {
  createVehicle,
  deactivateVehicle,
  getVehicles,
  updateVehicle,
} from "../api/vehicles";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "../api/vehicles";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  FitnessStatus,
  OwnershipType,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from "../types/transport";

interface VehicleFormState {
  vehicleNumber: string;
  vehicleType: VehicleType;
  capacity: number;
  ownershipType: OwnershipType;
  vendorName: string;
  status: VehicleStatus;
  fitnessStatus: FitnessStatus;
  notes: string;
}

const defaultForm: VehicleFormState = {
  vehicleNumber: "",
  vehicleType: "VAN",
  capacity: 12,
  ownershipType: "OWNED",
  vendorName: "",
  status: "ACTIVE",
  fitnessStatus: "PENDING",
  notes: "",
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

function getStatusBadge(status: VehicleStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "MAINTENANCE":
      return "bg-amber-50 text-amber-700";

    case "INACTIVE":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getFitnessBadge(status: FitnessStatus) {
  switch (status) {
    case "VALID":
      return "bg-emerald-50 text-emerald-700";

    case "EXPIRED":
      return "bg-red-50 text-red-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function VehiclesPage() {
  const { bootstrap } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleFormState>(defaultForm);
  const [editingVehicleId, setEditingVehicleId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ownershipFilter, setOwnershipFilter] = useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  const vehicleTypes = (
    bootstrap?.formOptions?.vehicleTypes ?? [
      "BUS",
      "VAN",
      "CAR",
      "COASTER",
      "HIACE",
    ]
  ) as VehicleType[];

  const vehicleStatuses = (
    bootstrap?.formOptions?.vehicleStatuses ?? [
      "ACTIVE",
      "INACTIVE",
      "MAINTENANCE",
    ]
  ) as VehicleStatus[];

  const ownershipTypes = (
    bootstrap?.formOptions?.ownershipTypes ?? ["OWNED", "VENDOR"]
  ) as OwnershipType[];

  const fitnessStatuses = (
    bootstrap?.formOptions?.fitnessStatuses ?? [
      "VALID",
      "EXPIRED",
      "PENDING",
    ]
  ) as FitnessStatus[];

  async function loadVehicles() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getVehicles();
      setVehicles(data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ?? "Failed to fetch vehicles"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const summary = useMemo(() => {
    return {
      total: vehicles.length,
      active: vehicles.filter(
        (vehicle) => vehicle.status === "ACTIVE"
      ).length,
      maintenance: vehicles.filter(
        (vehicle) => vehicle.status === "MAINTENANCE"
      ).length,
      validFitness: vehicles.filter(
        (vehicle) => vehicle.fitnessStatus === "VALID"
      ).length,
    };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !keyword ||
        vehicle.vehicleNumber.toLowerCase().includes(keyword) ||
        vehicle.vehicleType.toLowerCase().includes(keyword) ||
        vehicle.ownershipType.toLowerCase().includes(keyword) ||
        vehicle.vendorName?.toLowerCase().includes(keyword) ||
        vehicle.notes?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        vehicle.status === statusFilter;

      const matchesOwnership =
        ownershipFilter === "ALL" ||
        vehicle.ownershipType === ownershipFilter;

      return matchesSearch && matchesStatus && matchesOwnership;
    });
  }, [vehicles, search, statusFilter, ownershipFilter]);

  function resetForm() {
    setForm(defaultForm);
    setEditingVehicleId(null);
    setError("");
  }

  function handleEdit(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id);
    setMessage("");
    setError("");

    setForm({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      ownershipType: vehicle.ownershipType,
      vendorName: vehicle.vendorName ?? "",
      status: vehicle.status,
      fitnessStatus: vehicle.fitnessStatus,
      notes: vehicle.notes ?? "",
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
      if (
        form.ownershipType === "VENDOR" &&
        !form.vendorName.trim()
      ) {
        throw new Error(
          "Vendor name is required for a vendor-owned vehicle"
        );
      }

      if (form.capacity < 1) {
        throw new Error("Vehicle capacity must be at least 1");
      }

      const basePayload: CreateVehicleInput = {
        vehicleNumber: form.vehicleNumber.trim(),
        vehicleType: form.vehicleType,
        capacity: Number(form.capacity),
        ownershipType: form.ownershipType,
        fitnessStatus: form.fitnessStatus,
      };

      if (form.ownershipType === "VENDOR") {
        basePayload.vendorName = form.vendorName.trim();
      }

      if (form.notes.trim()) {
        basePayload.notes = form.notes.trim();
      }

      if (editingVehicleId) {
        const updatePayload: UpdateVehicleInput = {
          ...basePayload,
          status: form.status,
          vendorName:
            form.ownershipType === "VENDOR"
              ? form.vendorName.trim()
              : "",
          notes: form.notes.trim(),
        };

        await updateVehicle(editingVehicleId, updatePayload);

        setMessage("Vehicle updated successfully");
      } else {
        await createVehicle(basePayload);

        setMessage("Vehicle created successfully");
      }

      resetForm();
      await loadVehicles();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ?? "Failed to save vehicle"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(vehicle: Vehicle) {
    if (vehicle.status === "INACTIVE") {
      return;
    }

    const confirmed = window.confirm(
      `Deactivate vehicle ${vehicle.vehicleNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(vehicle.id);
      setMessage("");
      setError("");

      await deactivateVehicle(vehicle.id);

      setMessage(
        `Vehicle ${vehicle.vehicleNumber} deactivated successfully`
      );

      await loadVehicles();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to deactivate vehicle"
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
            Vehicle Management
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Manage owned and outsourced vehicles, capacity, fitness,
            and operating status.
          </p>
        </div>

        <Button variant="secondary" onClick={loadVehicles}>
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
              <p className="text-sm text-slate-500">Total Vehicles</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Truck size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.active}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <BusFront size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Maintenance</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.maintenance}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Wrench size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Valid Fitness</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.validFitness}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <ShieldCheck size={22} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <PlusCircle size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingVehicleId
                  ? "Edit Vehicle"
                  : "Register Vehicle"}
              </h2>

              <p className="text-sm text-slate-500">
                {editingVehicleId
                  ? "Update vehicle information."
                  : "Add a vehicle to the fleet."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vehicle Number
              </label>

              <input
                value={form.vehicleNumber}
                onChange={(event) =>
                  setForm({
                    ...form,
                    vehicleNumber: event.target.value,
                  })
                }
                placeholder="ABC-123"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Vehicle Type
                </label>

                <select
                  value={form.vehicleType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      vehicleType: event.target.value as VehicleType,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Capacity
                </label>

                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      capacity: Number(event.target.value),
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ownership Type
              </label>

              <select
                value={form.ownershipType}
                onChange={(event) => {
                  const ownershipType = event.target
                    .value as OwnershipType;

                  setForm({
                    ...form,
                    ownershipType,
                    vendorName:
                      ownershipType === "OWNED"
                        ? ""
                        : form.vendorName,
                  });
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {ownershipTypes.map((ownership) => (
                  <option key={ownership} value={ownership}>
                    {ownership}
                  </option>
                ))}
              </select>
            </div>

            {form.ownershipType === "VENDOR" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Vendor Name
                </label>

                <input
                  value={form.vendorName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      vendorName: event.target.value,
                    })
                  }
                  placeholder="Vendor company name"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Fitness Status
                </label>

                <select
                  value={form.fitnessStatus}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      fitnessStatus: event.target
                        .value as FitnessStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  {fitnessStatuses.map((fitness) => (
                    <option key={fitness} value={fitness}>
                      {fitness}
                    </option>
                  ))}
                </select>
              </div>

              {editingVehicleId && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Vehicle Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as VehicleStatus,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    {vehicleStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    notes: event.target.value,
                  })
                }
                placeholder="Vehicle notes..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingVehicleId
                    ? "Update Vehicle"
                    : "Register Vehicle"}
              </Button>

              {editingVehicleId && (
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
                Fleet Vehicles
              </h2>

              <p className="text-sm text-slate-500">
                {filteredVehicles.length} vehicles found
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
                  placeholder="Search vehicles..."
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
                <option value="ALL">All statuses</option>

                {vehicleStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={ownershipFilter}
                onChange={(event) =>
                  setOwnershipFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">All ownership</option>

                {ownershipTypes.map((ownership) => (
                  <option key={ownership} value={ownership}>
                    {ownership}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              Loading vehicles...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[880px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Capacity</th>
                    <th className="px-4 py-2">Ownership</th>
                    <th className="px-4 py-2">Fitness</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="bg-slate-50"
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {vehicle.vehicleNumber}
                        </p>

                        <p className="text-sm text-slate-500">
                          {vehicle.vehicleType}
                        </p>

                        {vehicle.notes && (
                          <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                            {vehicle.notes}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {vehicle.capacity} seats
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {vehicle.ownershipType}
                        </span>

                        {vehicle.vendorName && (
                          <p className="mt-2 max-w-40 truncate text-xs text-slate-500">
                            {vehicle.vendorName}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getFitnessBadge(
                            vehicle.fitnessStatus
                          )}`}
                        >
                          {vehicle.fitnessStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                            vehicle.status
                          )}`}
                        >
                          {vehicle.status}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleEdit(vehicle)}
                          >
                            <Edit size={15} className="mr-2" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            disabled={
                              vehicle.status === "INACTIVE" ||
                              processingId === vehicle.id
                            }
                            onClick={() =>
                              handleDeactivate(vehicle)
                            }
                          >
                            <Power size={15} className="mr-2" />

                            {processingId === vehicle.id
                              ? "Processing..."
                              : vehicle.status === "INACTIVE"
                                ? "Inactive"
                                : "Deactivate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No vehicles matched the selected filters.
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