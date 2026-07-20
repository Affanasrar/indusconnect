import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Clock3,
  Flag,
  MapPin,
  Navigation,
  PlayCircle,
  RefreshCcw,
  Route as RouteIcon,
  ShieldAlert,
  SquareCheckBig,
  UserCheck,
  UserX,
  UsersRound,
} from "lucide-react";
import {
  endDriverTrip,
  getDriverRouteManifest,
  getMyAssignedDriverRoutes,
  markPassengerBoarded,
  markPassengerNoShow,
  reportDriverTripIssue,
  startDriverTrip,
  submitDriverSafetyChecklist,
} from "../api/driverTrips";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  AssignedDriverRoute,
  DriverRouteManifest,
  ReportTripIssueInput,
  SafetyChecklistInput,
  TripIssueType,
  TripStatus,
} from "../types/driverTrip";
import type { ShuttleBooking } from "../types/shuttle";

interface ChecklistFormState {
  fuelChecked: boolean;
  tiresChecked: boolean;
  brakesChecked: boolean;
  lightsChecked: boolean;
}

interface IssueFormState {
  issueType: TripIssueType;
  issueDescription: string;
  issueLatitude: string;
  issueLongitude: string;
}

const defaultChecklist: ChecklistFormState = {
  fuelChecked: false,
  tiresChecked: false,
  brakesChecked: false,
  lightsChecked: false,
};

const defaultIssueForm: IssueFormState = {
  issueType: "DELAY",
  issueDescription: "",
  issueLatitude: "",
  issueLongitude: "",
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

function formatDateTime(date?: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString();
}

function getTripStatusBadge(status?: TripStatus) {
  switch (status) {
    case "CHECKLIST_PENDING":
      return "bg-amber-50 text-amber-700";

    case "READY":
      return "bg-blue-50 text-blue-700";

    case "IN_PROGRESS":
      return "bg-violet-50 text-violet-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPassengerStatusBadge(status: string) {
  switch (status) {
    case "ASSIGNED":
      return "bg-blue-50 text-blue-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "NO_SHOW":
      return "bg-slate-200 text-slate-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function normalizeManifest(
  manifest: DriverRouteManifest,
  fallbackRoute: AssignedDriverRoute
): DriverRouteManifest {
  return {
    route: manifest.route ?? fallbackRoute,
    vehicle:
      manifest.vehicle ??
      manifest.route?.vehicle ??
      fallbackRoute.vehicle ??
      null,
    driver:
      manifest.driver ??
      manifest.route?.driver ??
      fallbackRoute.driver ??
      null,
    smartStops:
      manifest.smartStops ??
      manifest.route?.smartStops ??
      fallbackRoute.smartStops ??
      [],
    bookings: manifest.bookings ?? [],
    trip:
      manifest.trip ??
      fallbackRoute.trips?.[0] ??
      null,
  };
}

export default function DriverTripsPage() {
  const [routes, setRoutes] = useState<AssignedDriverRoute[]>([]);
  const [manifest, setManifest] =
    useState<DriverRouteManifest | null>(null);

  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const [checklist, setChecklist] =
    useState<ChecklistFormState>(defaultChecklist);

  const [issueForm, setIssueForm] =
    useState<IssueFormState>(defaultIssueForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);
  const [isSubmittingChecklist, setIsSubmittingChecklist] =
    useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] =
    useState(false);
  const [processingAction, setProcessingAction] =
    useState<string | null>(null);

  const selectedRoute = useMemo(() => {
    return (
      routes.find((route) => route.id === selectedRouteId) ??
      null
    );
  }, [routes, selectedRouteId]);

  const trip = manifest?.trip ?? null;

  const passengers = useMemo(() => {
    return manifest?.bookings ?? [];
  }, [manifest]);

  const passengerSummary = useMemo(() => {
    return {
      total: passengers.length,

      awaiting: passengers.filter(
        (booking) => booking.status === "ASSIGNED"
      ).length,

      boarded: passengers.filter(
        (booking) => booking.status === "COMPLETED"
      ).length,

      noShow: passengers.filter(
        (booking) => booking.status === "NO_SHOW"
      ).length,
    };
  }, [passengers]);

  const checklistComplete =
    checklist.fuelChecked &&
    checklist.tiresChecked &&
    checklist.brakesChecked &&
    checklist.lightsChecked;

  async function loadRoutes() {
    try {
      setIsLoadingRoutes(true);
      setError("");

      const data = await getMyAssignedDriverRoutes();
      setRoutes(data);

      if (!selectedRouteId && data.length > 0) {
        await selectRoute(data[0]);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch assigned routes"
      );
    } finally {
      setIsLoadingRoutes(false);
    }
  }

  async function selectRoute(route: AssignedDriverRoute) {
    try {
      setSelectedRouteId(route.id);
      setIsLoadingManifest(true);
      setMessage("");
      setError("");

      const data = await getDriverRouteManifest(route.id);
      const normalized = normalizeManifest(data, route);

      setManifest(normalized);

      if (normalized.trip) {
        setChecklist({
          fuelChecked: normalized.trip.fuelChecked,
          tiresChecked: normalized.trip.tiresChecked,
          brakesChecked: normalized.trip.brakesChecked,
          lightsChecked: normalized.trip.lightsChecked,
        });
      } else {
        setChecklist(defaultChecklist);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch route manifest"
      );
    } finally {
      setIsLoadingManifest(false);
    }
  }

  async function refreshCurrentRoute() {
    if (!selectedRoute) {
      return;
    }

    await selectRoute(selectedRoute);
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  async function handleChecklistSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedRouteId) {
      setError("Select an assigned route first");
      return;
    }

    if (!checklistComplete) {
      setError(
        "All safety checks must be completed before submission"
      );
      return;
    }

    setMessage("");
    setError("");
    setIsSubmittingChecklist(true);

    try {
      const payload: SafetyChecklistInput = {
        fuelChecked: checklist.fuelChecked,
        tiresChecked: checklist.tiresChecked,
        brakesChecked: checklist.brakesChecked,
        lightsChecked: checklist.lightsChecked,
      };

      await submitDriverSafetyChecklist(
        selectedRouteId,
        payload
      );

      setMessage("Safety checklist submitted successfully");

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to submit safety checklist"
      );
    } finally {
      setIsSubmittingChecklist(false);
    }
  }

  async function handleStartTrip() {
    if (!selectedRouteId) {
      return;
    }

    const confirmed = window.confirm(
      "Start this trip now?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction("start");
      setMessage("");
      setError("");

      await startDriverTrip(selectedRouteId);

      setMessage("Trip started successfully");

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to start trip"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handlePassengerBoarded(
    booking: ShuttleBooking
  ) {
    if (!selectedRouteId) {
      return;
    }

    try {
      setProcessingAction(`board-${booking.id}`);
      setMessage("");
      setError("");

      await markPassengerBoarded(
        selectedRouteId,
        booking.id
      );

      setMessage(
        `${booking.employee?.fullName ?? "Passenger"} marked as boarded`
      );

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to mark passenger as boarded"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handlePassengerNoShow(
    booking: ShuttleBooking
  ) {
    if (!selectedRouteId) {
      return;
    }

    const confirmed = window.confirm(
      `Mark ${
        booking.employee?.fullName ?? "this passenger"
      } as no-show?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction(`no-show-${booking.id}`);
      setMessage("");
      setError("");

      await markPassengerNoShow(
        selectedRouteId,
        booking.id
      );

      setMessage(
        `${booking.employee?.fullName ?? "Passenger"} marked as no-show`
      );

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to mark passenger as no-show"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser"
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIssueForm((current) => ({
          ...current,
          issueLatitude: String(position.coords.latitude),
          issueLongitude: String(position.coords.longitude),
        }));

        setMessage("Current location added to issue report");
      },
      () => {
        setError(
          "Location permission was denied or unavailable"
        );
      }
    );
  }

  async function handleIssueSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedRouteId) {
      setError("Select a route first");
      return;
    }

    setMessage("");
    setError("");
    setIsSubmittingIssue(true);

    try {
      if (
        issueForm.issueType !== "SOS" &&
        !issueForm.issueDescription.trim()
      ) {
        throw new Error(
          "Issue description is required"
        );
      }

      const payload: ReportTripIssueInput = {
        issueType: issueForm.issueType,
      };

      if (issueForm.issueDescription.trim()) {
        payload.issueDescription =
          issueForm.issueDescription.trim();
      }

      if (issueForm.issueLatitude.trim()) {
        payload.issueLatitude = Number(
          issueForm.issueLatitude
        );
      }

      if (issueForm.issueLongitude.trim()) {
        payload.issueLongitude = Number(
          issueForm.issueLongitude
        );
      }

      await reportDriverTripIssue(
        selectedRouteId,
        payload
      );

      setMessage(
        issueForm.issueType === "SOS"
          ? "Emergency SOS reported successfully"
          : "Trip issue reported successfully"
      );

      setIssueForm(defaultIssueForm);

      await refreshCurrentRoute();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to report trip issue"
      );
    } finally {
      setIsSubmittingIssue(false);
    }
  }

  async function handleEndTrip() {
    if (!selectedRouteId) {
      return;
    }

    const awaitingPassengers = passengers.filter(
      (booking) => booking.status === "ASSIGNED"
    ).length;

    const confirmationMessage =
      awaitingPassengers > 0
        ? `${awaitingPassengers} passengers are still awaiting boarding status. End the trip anyway?`
        : "Complete and end this trip?";

    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction("end");
      setMessage("");
      setError("");

      await endDriverTrip(selectedRouteId);

      setMessage("Trip completed successfully");

      await refreshCurrentRoute();
      await loadRoutes();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to complete trip"
      );
    } finally {
      setProcessingAction(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Driver Operations
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Assigned Trips
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Complete the safety checklist, manage passenger
            boarding, report issues, and complete the trip.
          </p>
        </div>

        <Button variant="secondary" onClick={loadRoutes}>
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

      <div className="grid min-w-0 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Assigned Routes
            </h2>

            <p className="text-sm text-slate-500">
              {routes.length} routes available
            </p>
          </div>

          {isLoadingRoutes ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Loading assigned routes...
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((route) => {
                const currentTrip =
                  route.trips?.[0] ?? null;

                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => selectRoute(route)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedRouteId === route.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {route.routeName}
                        </p>

                        <p className="text-sm text-slate-500">
                          {route.routeCode}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${getTripStatusBadge(
                          currentTrip?.status
                        )}`}
                      >
                        {currentTrip?.status ??
                          "NOT STARTED"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p>
                        {route.startLocation ?? "-"} →{" "}
                        {route.endLocation ?? "-"}
                      </p>

                      <p>
                        {route.startTime ?? "-"} –{" "}
                        {route.endTime ?? "-"}
                      </p>

                      <p>
                        Vehicle:{" "}
                        {route.vehicle?.vehicleNumber ??
                          "Not assigned"}
                      </p>
                    </div>
                  </button>
                );
              })}

              {routes.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
                  <RouteIcon
                    size={38}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    No routes are assigned to you.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          {!selectedRoute || !manifest ? (
            <Card>
              <div className="py-14 text-center">
                <Navigation
                  size={44}
                  className="mx-auto text-slate-300"
                />

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  Select an assigned route
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Choose a route to open the passenger manifest
                  and trip controls.
                </p>
              </div>
            </Card>
          ) : isLoadingManifest ? (
            <Card>
              <div className="py-14 text-center text-sm text-slate-500">
                Loading route manifest...
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                        <RouteIcon size={22} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold text-slate-900">
                          {manifest.route.routeName}
                        </h2>

                        <p className="text-sm text-slate-500">
                          {manifest.route.routeCode}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(
                            manifest.route.routeDate
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Schedule
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {manifest.route.startTime ?? "-"} –{" "}
                          {manifest.route.endTime ?? "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Vehicle
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {manifest.vehicle?.vehicleNumber ??
                            "Not assigned"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Trip Status
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getTripStatusBadge(
                            trip?.status
                          )}`}
                        >
                          {trip?.status ?? "NOT STARTED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {trip?.status === "READY" && (
                      <Button
                        onClick={handleStartTrip}
                        disabled={
                          processingAction === "start"
                        }
                      >
                        <PlayCircle
                          size={16}
                          className="mr-2"
                        />

                        {processingAction === "start"
                          ? "Starting..."
                          : "Start Trip"}
                      </Button>
                    )}

                    {trip?.status === "IN_PROGRESS" && (
                      <Button
                        onClick={handleEndTrip}
                        disabled={
                          processingAction === "end"
                        }
                      >
                        <Flag size={16} className="mr-2" />

                        {processingAction === "end"
                          ? "Completing..."
                          : "End Trip"}
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      onClick={refreshCurrentRoute}
                    >
                      <RefreshCcw
                        size={16}
                        className="mr-2"
                      />
                      Refresh Manifest
                    </Button>
                  </div>
                </div>

                {trip?.issueType && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={20}
                        className="mt-0.5 shrink-0 text-amber-700"
                      />

                      <div>
                        <p className="font-bold text-amber-800">
                          Latest reported issue:{" "}
                          {trip.issueType}
                        </p>

                        <p className="mt-1 text-sm text-amber-700">
                          {trip.issueDescription ??
                            "No description provided"}
                        </p>

                        <p className="mt-1 text-xs text-amber-600">
                          {formatDateTime(
                            trip.issueReportedAt
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <div className="grid min-w-0 gap-6 2xl:grid-cols-2">
                <Card>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                      <ClipboardCheck size={22} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Safety Checklist
                      </h2>

                      <p className="text-sm text-slate-500">
                        Required before starting the trip.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleChecklistSubmit}
                    className="space-y-3"
                  >
                    {[
                      {
                        key: "fuelChecked",
                        label: "Fuel level checked",
                      },
                      {
                        key: "tiresChecked",
                        label: "Tyres checked",
                      },
                      {
                        key: "brakesChecked",
                        label: "Brakes checked",
                      },
                      {
                        key: "lightsChecked",
                        label: "Lights checked",
                      },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={
                            checklist[
                              item.key as keyof ChecklistFormState
                            ]
                          }
                          disabled={
                            trip?.status === "IN_PROGRESS" ||
                            trip?.status === "COMPLETED"
                          }
                          onChange={(event) =>
                            setChecklist({
                              ...checklist,
                              [item.key]:
                                event.target.checked,
                            })
                          }
                          className="h-5 w-5 rounded border-slate-300"
                        />

                        <span className="text-sm font-semibold text-slate-700">
                          {item.label}
                        </span>
                      </label>
                    ))}

                    <Button
                      className="mt-3 w-full"
                      disabled={
                        !checklistComplete ||
                        isSubmittingChecklist ||
                        trip?.status === "IN_PROGRESS" ||
                        trip?.status === "COMPLETED"
                      }
                    >
                      <SquareCheckBig
                        size={16}
                        className="mr-2"
                      />

                      {isSubmittingChecklist
                        ? "Submitting..."
                        : trip?.status === "READY"
                          ? "Checklist Completed"
                          : "Submit Safety Checklist"}
                    </Button>
                  </form>
                </Card>

                <Card>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-2xl bg-red-50 p-3 text-red-700">
                      <ShieldAlert size={22} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Report Trip Issue
                      </h2>

                      <p className="text-sm text-slate-500">
                        Report delay, breakdown, emergency,
                        or another problem.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleIssueSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Issue Type
                      </label>

                      <select
                        value={issueForm.issueType}
                        onChange={(event) =>
                          setIssueForm({
                            ...issueForm,
                            issueType: event.target
                              .value as TripIssueType,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="DELAY">DELAY</option>
                        <option value="BREAKDOWN">
                          BREAKDOWN
                        </option>
                        <option value="SOS">SOS</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Description
                      </label>

                      <textarea
                        rows={3}
                        value={issueForm.issueDescription}
                        onChange={(event) =>
                          setIssueForm({
                            ...issueForm,
                            issueDescription:
                              event.target.value,
                          })
                        }
                        placeholder="Describe the issue"
                        className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        value={issueForm.issueLatitude}
                        onChange={(event) =>
                          setIssueForm({
                            ...issueForm,
                            issueLatitude:
                              event.target.value,
                          })
                        }
                        placeholder="Latitude"
                        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />

                      <input
                        type="number"
                        step="any"
                        value={issueForm.issueLongitude}
                        onChange={(event) =>
                          setIssueForm({
                            ...issueForm,
                            issueLongitude:
                              event.target.value,
                          })
                        }
                        placeholder="Longitude"
                        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={useCurrentLocation}
                    >
                      <MapPin size={16} className="mr-2" />
                      Use Current Location
                    </Button>

                    <Button
                      className="w-full"
                      variant={
                        issueForm.issueType === "SOS"
                          ? "danger"
                          : "primary"
                      }
                      disabled={isSubmittingIssue}
                    >
                      <AlertTriangle
                        size={16}
                        className="mr-2"
                      />

                      {isSubmittingIssue
                        ? "Reporting..."
                        : issueForm.issueType === "SOS"
                          ? "Send Emergency SOS"
                          : "Report Issue"}
                    </Button>
                  </form>
                </Card>
              </div>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <p className="text-sm text-slate-500">
                    Total Passengers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {passengerSummary.total}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">
                    Awaiting
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {passengerSummary.awaiting}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">
                    Boarded
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {passengerSummary.boarded}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">
                    No Show
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-700">
                    {passengerSummary.noShow}
                  </p>
                </Card>
              </div>

              <Card className="min-w-0">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Passenger Manifest
                  </h2>

                  <p className="text-sm text-slate-500">
                    Mark passenger boarding status during the
                    active trip.
                  </p>
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                  <table className="w-full min-w-[980px] border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-2">
                          Passenger
                        </th>
                        <th className="px-4 py-2">
                          Pickup Stop
                        </th>
                        <th className="px-4 py-2">
                          Seat
                        </th>
                        <th className="px-4 py-2">
                          Contact
                        </th>
                        <th className="px-4 py-2">
                          Status
                        </th>
                        <th className="px-4 py-2 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {passengers.map((booking) => (
                        <tr
                          key={booking.id}
                          className="bg-slate-50"
                        >
                          <td className="rounded-l-2xl px-4 py-4">
                            <p className="font-semibold text-slate-900">
                              {booking.employee?.fullName ??
                                "Employee"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {booking.employee?.employeeCode ??
                                "-"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {booking.pickupStop?.stopName ??
                                booking.pickupArea}
                            </p>

                            <p className="text-xs text-slate-500">
                              {booking.pickupAddress ?? "-"}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-sm font-bold text-slate-700">
                            {booking.seatNumber ?? "-"}
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-sm text-slate-600">
                              {booking.employee?.phone ?? "-"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getPassengerStatusBadge(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </td>

                          <td className="rounded-r-2xl px-4 py-4">
                            <div className="flex justify-end gap-2">
                              {booking.status ===
                                "ASSIGNED" && (
                                <>
                                  <Button
                                    type="button"
                                    disabled={
                                      trip?.status !==
                                        "IN_PROGRESS" ||
                                      processingAction ===
                                        `board-${booking.id}`
                                    }
                                    onClick={() =>
                                      handlePassengerBoarded(
                                        booking
                                      )
                                    }
                                  >
                                    <UserCheck
                                      size={15}
                                      className="mr-2"
                                    />

                                    {processingAction ===
                                    `board-${booking.id}`
                                      ? "Saving..."
                                      : "Boarded"}
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={
                                      trip?.status !==
                                        "IN_PROGRESS" ||
                                      processingAction ===
                                        `no-show-${booking.id}`
                                    }
                                    onClick={() =>
                                      handlePassengerNoShow(
                                        booking
                                      )
                                    }
                                  >
                                    <UserX
                                      size={15}
                                      className="mr-2"
                                    />

                                    {processingAction ===
                                    `no-show-${booking.id}`
                                      ? "Saving..."
                                      : "No Show"}
                                  </Button>
                                </>
                              )}

                              {booking.status !==
                                "ASSIGNED" && (
                                <span className="text-xs text-slate-400">
                                  Status recorded
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {passengers.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                          >
                            No passengers are assigned to this
                            route.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-3">
                  <UsersRound
                    size={22}
                    className="text-violet-700"
                  />

                  <h2 className="text-lg font-bold text-slate-900">
                    Route Stops
                  </h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[...(manifest.smartStops ?? [])]
                    .sort(
                      (first, second) =>
                        first.stopOrder - second.stopOrder
                    )
                    .map((stop) => (
                      <div
                        key={stop.id}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                            {stop.stopOrder}
                          </span>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {stop.stopName}
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <Clock3 size={13} />
                              {stop.estimatedTime ?? "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}