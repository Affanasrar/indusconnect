import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Wrench,
  Brush,
  PlusCircle,
  RefreshCcw,
  Search,
  CheckCircle,
  XCircle,
  Play,
  Check,
  X,
  Truck,
  Home,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  createVehicleMaintenanceTask,
  getAllVehicleMaintenanceTasks,
  startVehicleMaintenanceTask,
  resolveVehicleMaintenanceTask,
  cancelVehicleMaintenanceTask,
  createHousekeepingTask,
  getAllHousekeepingTasks,
  startHousekeepingTask,
  completeHousekeepingTask,
  cancelHousekeepingTask,
} from "../api/maintenance";
import { getVehicles } from "../api/vehicles";
import { getAccommodationRooms } from "../api/accommodation";
import { getUsers } from "../api/users";
import type {
  VehicleMaintenanceTask,
  HousekeepingTask,
  MaintenanceTaskType,
  MaintenancePriority,
  HousekeepingTaskType,
  HousekeepingPriority,
} from "../types/maintenance";
import type { Vehicle } from "../types/transport";
import type { AccommodationRoom } from "../types/accommodation";
import type { UserProfile } from "../types/frontend";

interface VehicleTaskFormState {
  vehicleId: string;
  taskType: MaintenanceTaskType;
  priority: MaintenancePriority;
  title: string;
  description: string;
  assignedToId: string;
}

interface HousekeepingTaskFormState {
  roomId: string;
  taskType: HousekeepingTaskType;
  priority: HousekeepingPriority;
  title: string;
  description: string;
  assignedToId: string;
  dueDate: string;
}

const defaultVehicleForm: VehicleTaskFormState = {
  vehicleId: "",
  taskType: "ROUTINE_SERVICE",
  priority: "NORMAL",
  title: "",
  description: "",
  assignedToId: "",
};

const defaultHousekeepingForm: HousekeepingTaskFormState = {
  roomId: "",
  taskType: "ROOM_CLEANING",
  priority: "NORMAL",
  title: "",
  description: "",
  assignedToId: "",
  dueDate: "",
};

export default function MaintenancePage() {
  const { bootstrap } = useAuth();

  // Roles
  const isSuperAdmin = bootstrap?.role === "SUPER_ADMIN";
  const isTransportAdmin = bootstrap?.role === "TRANSPORT_ADMIN" || isSuperAdmin;
  const isAccommodationAdmin = bootstrap?.role === "ACCOMMODATION_ADMIN" || isSuperAdmin;
  const isDriver = bootstrap?.role === "DRIVER";

  // Data States
  const [vehicleTasks, setVehicleTasks] = useState<VehicleMaintenanceTask[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rooms, setRooms] = useState<AccommodationRoom[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"VEHICLES" | "HOUSEKEEPING">("VEHICLES");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "LOW" | "NORMAL" | "HIGH" | "URGENT">("ALL");

  // Modals state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showHousekeepingModal, setShowHousekeepingModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Selected tasks for actions
  const [selectedVehicleTaskId, setSelectedVehicleTaskId] = useState<string | null>(null);
  const [selectedHousekeepingTaskId, setSelectedHousekeepingTaskId] = useState<string | null>(null);
  
  // Action text inputs
  const [actionNotes, setActionNotes] = useState("");

  // Forms states
  const [vehicleForm, setVehicleForm] = useState<VehicleTaskFormState>(defaultVehicleForm);
  const [housekeepingForm, setHousekeepingForm] = useState<HousekeepingTaskFormState>(defaultHousekeepingForm);

  // Messages Alerts
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load feeds
  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const promises: Promise<any>[] = [];
      if (isTransportAdmin || isDriver) {
        promises.push(getAllVehicleMaintenanceTasks());
        promises.push(getVehicles());
      } else {
        promises.push(Promise.resolve([]));
        promises.push(Promise.resolve([]));
      }

      if (isAccommodationAdmin) {
        promises.push(getAllHousekeepingTasks());
        promises.push(getAccommodationRooms());
      } else {
        promises.push(Promise.resolve([]));
        promises.push(Promise.resolve([]));
      }

      promises.push(getUsers());

      const [vTasks, vList, hTasks, rList, uList] = await Promise.all(promises);

      setVehicleTasks(vTasks || []);
      setVehicles(vList || []);
      setHousekeepingTasks(hTasks || []);
      setRooms(rList || []);
      setUsers(uList || []);

      // If activeTab is VEHICLES but user is only accommodation admin, switch tab
      if (activeTab === "VEHICLES" && !isTransportAdmin && !isDriver && isAccommodationAdmin) {
        setActiveTab("HOUSEKEEPING");
      }
    } catch (err) {
      setError("Failed to sync maintenance tasks list");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter calculations
  const filteredVehicleTasks = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return vehicleTasks.filter((task) => {
      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        (task.description && task.description.toLowerCase().includes(keyword)) ||
        (task.vehicle && task.vehicle.vehicleNumber.toLowerCase().includes(keyword));

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [vehicleTasks, searchQuery, priorityFilter]);

  const filteredHousekeepingTasks = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return housekeepingTasks.filter((task) => {
      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        (task.description && task.description.toLowerCase().includes(keyword)) ||
        (task.room && task.room.roomNumber.toLowerCase().includes(keyword));

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [housekeepingTasks, searchQuery, priorityFilter]);

  const metrics = useMemo(() => {
    const openV = vehicleTasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
    const pendingH = housekeepingTasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
    const urgentIssues =
      vehicleTasks.filter((t) => t.priority === "URGENT" && t.status !== "RESOLVED" && t.status !== "CANCELLED").length +
      housekeepingTasks.filter((t) => t.priority === "URGENT" && t.status !== "COMPLETED" && t.status !== "CANCELLED").length;

    return {
      openVehicleTasks: openV,
      pendingHousekeeping: pendingH,
      urgentCount: urgentIssues,
    };
  }, [vehicleTasks, housekeepingTasks]);

  // Submit Vehicle Maintenance Task
  async function handleVehicleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!vehicleForm.vehicleId) {
        throw new Error("Vehicle selection is required");
      }
      if (!vehicleForm.title.trim()) {
        throw new Error("Title is required");
      }

      await createVehicleMaintenanceTask({
        vehicleId: vehicleForm.vehicleId,
        taskType: vehicleForm.taskType,
        priority: vehicleForm.priority,
        title: vehicleForm.title.trim(),
        description: vehicleForm.description.trim() || undefined,
        assignedToId: vehicleForm.assignedToId || undefined,
      });

      setMessage("Vehicle maintenance task registered successfully");
      setVehicleForm(defaultVehicleForm);
      setShowVehicleModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register maintenance task");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit Housekeeping Task
  async function handleHousekeepingSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!housekeepingForm.roomId) {
        throw new Error("Room selection is required");
      }
      if (!housekeepingForm.title.trim()) {
        throw new Error("Title is required");
      }

      await createHousekeepingTask({
        roomId: housekeepingForm.roomId,
        taskType: housekeepingForm.taskType,
        priority: housekeepingForm.priority,
        title: housekeepingForm.title.trim(),
        description: housekeepingForm.description.trim() || undefined,
        assignedToId: housekeepingForm.assignedToId || undefined,
        dueDate: housekeepingForm.dueDate || undefined,
      });

      setMessage("Housekeeping task registered successfully");
      setHousekeepingForm(defaultHousekeepingForm);
      setShowHousekeepingModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register housekeeping task");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Action Handlers for Vehicle Tasks
  async function handleStartVehicleTask(id: string) {
    setError("");
    setMessage("");
    try {
      await startVehicleMaintenanceTask(id);
      setMessage("Maintenance task started successfully");
      await loadData();
    } catch (err) {
      setError("Failed to mark task as in progress");
    }
  }

  async function handleResolveVehicleTask(e: FormEvent) {
    e.preventDefault();
    if (!selectedVehicleTaskId) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await resolveVehicleMaintenanceTask(selectedVehicleTaskId, actionNotes.trim() || undefined);
      setMessage("Maintenance task resolved successfully");
      setShowResolveModal(false);
      setActionNotes("");
      setSelectedVehicleTaskId(null);
      await loadData();
    } catch (err) {
      setError("Failed to resolve maintenance task");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelVehicleTask(id: string) {
    setError("");
    setMessage("");
    try {
      await cancelVehicleMaintenanceTask(id);
      setMessage("Maintenance task cancelled");
      await loadData();
    } catch (err) {
      setError("Failed to cancel maintenance task");
    }
  }

  // Action Handlers for Housekeeping Tasks
  async function handleStartHousekeeping(id: string) {
    setError("");
    setMessage("");
    try {
      await startHousekeepingTask(id);
      setMessage("Housekeeping task started successfully");
      await loadData();
    } catch (err) {
      setError("Failed to mark task as in progress");
    }
  }

  async function handleCompleteHousekeeping(e: FormEvent) {
    e.preventDefault();
    if (!selectedHousekeepingTaskId) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await completeHousekeepingTask(selectedHousekeepingTaskId, actionNotes.trim() || undefined);
      setMessage("Housekeeping task completed successfully");
      setShowCompleteModal(false);
      setActionNotes("");
      setSelectedHousekeepingTaskId(null);
      await loadData();
    } catch (err) {
      setError("Failed to complete housekeeping task");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelHousekeeping(id: string) {
    setError("");
    setMessage("");
    try {
      await cancelHousekeepingTask(id);
      setMessage("Housekeeping task cancelled");
      await loadData();
    } catch (err) {
      setError("Failed to cancel housekeeping task");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Maintenance & Housekeeping
          </h1>
          <p className="text-sm text-slate-500">
            Track and dispatch routine servicing, vehicle repairs, and room housekeeping schedules.
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
            Refresh
          </Button>

          {activeTab === "VEHICLES" && (isTransportAdmin || isDriver) && (
            <Button
              onClick={() => {
                setVehicleForm(defaultVehicleForm);
                setShowVehicleModal(true);
              }}
              className="rounded-xl text-xs py-2"
            >
              <PlusCircle size={15} className="mr-1.5" />
              Report Vehicle Issue
            </Button>
          )}

          {activeTab === "HOUSEKEEPING" && isAccommodationAdmin && (
            <Button
              onClick={() => {
                setHousekeepingForm(defaultHousekeepingForm);
                setShowHousekeepingModal(true);
              }}
              className="rounded-xl text-xs py-2"
            >
              <PlusCircle size={15} className="mr-1.5" />
              Schedule Cleaning
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
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
      <div className="grid gap-5 md:grid-cols-3">
        {(isTransportAdmin || isDriver) && (
          <Card className="bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Vehicle Tasks</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.openVehicleTasks}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-700">
                <Truck size={24} />
              </div>
            </div>
          </Card>
        )}

        {isAccommodationAdmin && (
          <Card className="bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Cleaning Jobs</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.pendingHousekeeping}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3.5 text-amber-700">
                <Home size={24} />
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Urgent Issues Flagged</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.urgentCount}</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-3.5 text-red-700">
              <AlertTriangle size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Tabs bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200">
        <div className="flex">
          {(isTransportAdmin || isDriver) && (
            <button
              onClick={() => setActiveTab("VEHICLES")}
              className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
                activeTab === "VEHICLES"
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Vehicle Maintenance
            </button>
          )}

          {isAccommodationAdmin && (
            <button
              onClick={() => setActiveTab("HOUSEKEEPING")}
              className={`px-5 py-3 text-sm font-bold transition border-b-2 ${
                activeTab === "HOUSEKEEPING"
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Room Housekeeping
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pb-2 sm:pb-0">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 py-1.5 px-2.5 text-xs outline-none focus:border-blue-600 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder={activeTab === "VEHICLES" ? "Search vehicle tasks..." : "Search room cleaning..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-600 transition bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCcw size={40} className="animate-spin text-blue-700" />
          <p className="mt-4 text-sm font-medium">Syncing maintenance records...</p>
        </div>
      ) : activeTab === "VEHICLES" ? (
        /* VEHICLE MAINTENANCE TASK LIST */
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Priority / Status</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Reported By</th>
                {isTransportAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicleTasks.map((task) => {
                const statusColors = {
                  OPEN: "bg-amber-50 text-amber-700 border-amber-100",
                  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
                  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
                };

                const priorityColors = {
                  LOW: "bg-slate-50 text-slate-600 border-slate-200",
                  NORMAL: "bg-blue-50/20 text-blue-700 border-blue-100/50",
                  HIGH: "bg-amber-50 text-amber-700 border-amber-100",
                  URGENT: "bg-red-50 text-red-700 border-red-100 font-extrabold animate-pulse",
                };

                return (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{task.description}</div>
                      )}
                      {task.resolutionNotes && (
                        <div className="text-xs text-emerald-600 italic mt-1">Resolution: {task.resolutionNotes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{task.vehicle?.vehicleNumber || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{task.vehicle?.vehicleType}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      {task.taskType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-block rounded border px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-block rounded border px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${statusColors[task.status]}`}>
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                      {task.assignedTo?.fullName || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                      {task.reportedBy?.fullName || "System"}
                    </td>
                    {isTransportAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {task.status === "OPEN" && (
                            <button
                              onClick={() => handleStartVehicleTask(task.id)}
                              className="rounded p-1.5 text-blue-600 hover:bg-blue-50 transition"
                              title="Start Maintenance Task"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          {(task.status === "OPEN" || task.status === "IN_PROGRESS") && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedVehicleTaskId(task.id);
                                  setActionNotes("");
                                  setShowResolveModal(true);
                                }}
                                className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                                title="Resolve Task"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleCancelVehicleTask(task.id)}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50 transition"
                                title="Cancel Task"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredVehicleTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Wrench className="mx-auto text-slate-300" size={32} />
                    <h4 className="mt-3 font-bold text-slate-800 text-sm">No vehicle maintenance tasks</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Use the "Report Vehicle Issue" button to log service tasks.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* HOUSEKEEPING TASKS LIST */
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Priority / Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Assigned To</th>
                {isAccommodationAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHousekeepingTasks.map((task) => {
                const statusColors = {
                  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
                  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
                  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
                };

                const priorityColors = {
                  LOW: "bg-slate-50 text-slate-600 border-slate-200",
                  NORMAL: "bg-blue-50/20 text-blue-700 border-blue-100/50",
                  HIGH: "bg-amber-50 text-amber-700 border-amber-100",
                  URGENT: "bg-red-50 text-red-700 border-red-100 font-extrabold animate-pulse",
                };

                return (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{task.description}</div>
                      )}
                      {task.completionNotes && (
                        <div className="text-xs text-emerald-600 italic mt-1">Completion notes: {task.completionNotes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">Room {task.room?.roomNumber || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{task.room?.roomType}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      {task.taskType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-block rounded border px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-block rounded border px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${statusColors[task.status]}`}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                      {task.assignedTo?.fullName || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    {isAccommodationAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {task.status === "PENDING" && (
                            <button
                              onClick={() => handleStartHousekeeping(task.id)}
                              className="rounded p-1.5 text-blue-600 hover:bg-blue-50 transition"
                              title="Start Cleaning Task"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedHousekeepingTaskId(task.id);
                                  setActionNotes("");
                                  setShowCompleteModal(true);
                                }}
                                className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                                title="Complete Task"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleCancelHousekeeping(task.id)}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50 transition"
                                title="Cancel Task"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredHousekeepingTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Brush className="mx-auto text-slate-300" size={32} />
                    <h4 className="mt-3 font-bold text-slate-800 text-sm">No housekeeping tasks scheduled</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Use the "Schedule Cleaning" button to assign room cleaning jobs.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORT VEHICLE ISSUE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Report Vehicle Maintenance Issue
            </h3>

            <form onSubmit={handleVehicleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Vehicle *
                </label>
                <select
                  required
                  value={vehicleForm.vehicleId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                >
                  <option value="">Choose Vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Task Type *
                  </label>
                  <select
                    value={vehicleForm.taskType}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, taskType: e.target.value as MaintenanceTaskType })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="ROUTINE_SERVICE">Routine Service</option>
                    <option value="REPAIR">Repair</option>
                    <option value="BREAKDOWN">Breakdown</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="FITNESS_RENEWAL">Fitness Renewal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Priority Rating *
                  </label>
                  <select
                    value={vehicleForm.priority}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, priority: e.target.value as MaintenancePriority })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Immediate Service)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleForm.title}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="e.g. Brake pads squeaking"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Detailed Issue Description
                </label>
                <textarea
                  value={vehicleForm.description}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Provide mechanical details..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assign To Mechanic/Staff
                </label>
                <select
                  value={vehicleForm.assignedToId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, assignedToId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                >
                  <option value="">Select Mechanic...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role?.name.replace(/_/g, " ")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVehicleModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Logging task..." : "Log Maintenance Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE CLEANING MODAL */}
      {showHousekeepingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Schedule Room Housekeeping
            </h3>

            <form onSubmit={handleHousekeepingSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Room *
                </label>
                <select
                  required
                  value={housekeepingForm.roomId}
                  onChange={(e) => setHousekeepingForm({ ...housekeepingForm, roomId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                >
                  <option value="">Select Room...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.facilityName} - {r.roomType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cleaning Type *
                  </label>
                  <select
                    value={housekeepingForm.taskType}
                    onChange={(e) =>
                      setHousekeepingForm({ ...housekeepingForm, taskType: e.target.value as HousekeepingTaskType })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="ROOM_CLEANING">Room Cleaning</option>
                    <option value="LINEN_CHANGE">Linen Change</option>
                    <option value="SANITIZATION">Sanitization</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="MAINTENANCE_REQUIRED">Maintenance Required</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Priority Rating *
                  </label>
                  <select
                    value={housekeepingForm.priority}
                    onChange={(e) =>
                      setHousekeepingForm({ ...housekeepingForm, priority: e.target.value as HousekeepingPriority })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Immediate Service)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={housekeepingForm.title}
                  onChange={(e) => setHousekeepingForm({ ...housekeepingForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="e.g. Standard routine checkout cleaning"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  value={housekeepingForm.description}
                  onChange={(e) => setHousekeepingForm({ ...housekeepingForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="e.g. Clean room bathrooms, replace towels..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={housekeepingForm.dueDate}
                    onChange={(e) => setHousekeepingForm({ ...housekeepingForm, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Assign To Housekeeper
                  </label>
                  <select
                    value={housekeepingForm.assignedToId}
                    onChange={(e) => setHousekeepingForm({ ...housekeepingForm, assignedToId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="">Select Staff...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role?.name.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowHousekeepingModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Submitting task..." : "Log Housekeeping Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE VEHICLE TASK RESOLUTION MODAL */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Resolve Maintenance Task
            </h3>

            <form onSubmit={handleResolveVehicleTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Resolution Notes *
                </label>
                <textarea
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Describe repair or maintenance actions completed..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedVehicleTaskId(null);
                  }}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Submitting resolution..." : "Resolve Maintenance"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE HOUSEKEEPING MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Complete Housekeeping Task
            </h3>

            <form onSubmit={handleCompleteHousekeeping} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Completion Notes
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Add details about cleaning completed (optional)..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedHousekeepingTaskId(null);
                  }}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Completing task..." : "Complete Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
