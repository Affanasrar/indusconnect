import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BedDouble,
  Building2,
  CheckCircle2,
  DoorOpen,
  Edit,
  Hotel,
  LogIn,
  LogOut,
  MapPin,
  PlusCircle,
  RefreshCcw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  createAccommodationRoom,
  createRoomReservation,
  deactivateAccommodationRoom,
  getAccommodationDashboard,
  updateAccommodationRoom,
} from "../api/accommodation";
import type {
  CreateReservationInput,
  CreateRoomInput,
  UpdateRoomInput,
} from "../api/accommodation";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type {
  AccommodationRoom,
  AccommodationSource,
  ReservationStatus,
  RoomReservation,
  RoomStatus,
  RoomType,
} from "../types/accommodation";
import type { TravelRequest } from "../types/travel";

interface RoomFormState {
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  facilityName: string;
  city: string;
  location: string;
  dailyRate: number;
  status: RoomStatus;
  notes: string;
}

interface ReservationFormState {
  travelRequestId: string;
  accommodationSource: AccommodationSource;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  externalProviderName: string;
  externalAddress: string;
  externalDailyRate: number;
  notes: string;
}

const defaultRoomForm: RoomFormState = {
  roomNumber: "",
  roomType: "SINGLE",
  capacity: 1,
  facilityName: "",
  city: "",
  location: "",
  dailyRate: 0,
  status: "AVAILABLE",
  notes: "",
};

const defaultReservationForm: ReservationFormState = {
  travelRequestId: "",
  accommodationSource: "INTERNAL",
  roomId: "",
  checkInDate: "",
  checkOutDate: "",
  externalProviderName: "",
  externalAddress: "",
  externalDailyRate: 0,
  notes: "",
};

const roomTypes: RoomType[] = [
  "SINGLE",
  "DOUBLE",
  "TWIN",
  "SUITE",
  "DORMITORY",
];

const roomStatuses: RoomStatus[] = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "INACTIVE",
];

const reservationStatuses: ReservationStatus[] = [
  "RESERVED",
  "CHECKED_IN",
  "CHECKED_OUT",
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
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
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

function calculateNights(
  checkInDate: string,
  checkOutDate: string
) {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  const difference =
    end.getTime() - start.getTime();

  return Math.max(
    0,
    Math.ceil(difference / (1000 * 60 * 60 * 24))
  );
}

function getRoomStatusBadge(status: RoomStatus) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";

    case "OCCUPIED":
      return "bg-blue-50 text-blue-700";

    case "MAINTENANCE":
      return "bg-amber-50 text-amber-700";

    case "INACTIVE":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getReservationStatusBadge(
  status: ReservationStatus
) {
  switch (status) {
    case "RESERVED":
      return "bg-blue-50 text-blue-700";

    case "CHECKED_IN":
      return "bg-violet-50 text-violet-700";

    case "CHECKED_OUT":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AccommodationPage() {
  const [rooms, setRooms] = useState<AccommodationRoom[]>(
    []
  );

  const [reservations, setReservations] = useState<
    RoomReservation[]
  >([]);

  const [travelRequests, setTravelRequests] = useState<
    TravelRequest[]
  >([]);

  const [roomForm, setRoomForm] =
    useState<RoomFormState>(defaultRoomForm);

  const [reservationForm, setReservationForm] =
    useState<ReservationFormState>(
      defaultReservationForm
    );

  const [editingRoomId, setEditingRoomId] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "ASSIGNMENTS" | "ROOMS" | "RESERVATIONS"
  >("ASSIGNMENTS");

  const [roomSearch, setRoomSearch] = useState("");
  const [roomStatusFilter, setRoomStatusFilter] =
    useState("ALL");

  const [reservationSearch, setReservationSearch] =
    useState("");

  const [reservationStatusFilter, setReservationStatusFilter] =
    useState("ALL");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoom, setIsSavingRoom] =
    useState(false);

  const [isSavingReservation, setIsSavingReservation] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const data =
        await getAccommodationDashboard();

      setRooms(data.rooms);
      setReservations(data.reservations);
      setTravelRequests(
        data.approvedTravelRequests
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to fetch accommodation information"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const availableRooms = useMemo(() => {
    return rooms.filter(
      (room) => room.status === "AVAILABLE"
    );
  }, [rooms]);

  const selectedTravelRequest = useMemo(() => {
    return (
      travelRequests.find(
        (request) =>
          request.id ===
          reservationForm.travelRequestId
      ) ?? null
    );
  }, [
    travelRequests,
    reservationForm.travelRequestId,
  ]);

  const selectedRoom = useMemo(() => {
    return (
      rooms.find(
        (room) =>
          room.id === reservationForm.roomId
      ) ?? null
    );
  }, [rooms, reservationForm.roomId]);

  const numberOfNights = useMemo(() => {
    return calculateNights(
      reservationForm.checkInDate,
      reservationForm.checkOutDate
    );
  }, [
    reservationForm.checkInDate,
    reservationForm.checkOutDate,
  ]);

  const estimatedCost = useMemo(() => {
    const rate =
      reservationForm.accommodationSource ===
      "INTERNAL"
        ? selectedRoom?.dailyRate ?? 0
        : reservationForm.externalDailyRate;

    return numberOfNights * rate;
  }, [
    reservationForm.accommodationSource,
    reservationForm.externalDailyRate,
    selectedRoom,
    numberOfNights,
  ]);

  const summary = useMemo(() => {
    return {
      totalRooms: rooms.length,

      availableRooms: rooms.filter(
        (room) => room.status === "AVAILABLE"
      ).length,

      occupiedRooms: rooms.filter(
        (room) => room.status === "OCCUPIED"
      ).length,

      pendingAssignments: travelRequests.length,
    };
  }, [rooms, travelRequests]);

  const filteredRooms = useMemo(() => {
    const keyword = roomSearch
      .toLowerCase()
      .trim();

    return rooms.filter((room) => {
      const matchesSearch =
        !keyword ||
        (room.roomNumber ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (room.facilityName ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (room.city ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (room.location ?? "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        roomStatusFilter === "ALL" ||
        room.status === roomStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rooms, roomSearch, roomStatusFilter]);

  const filteredReservations = useMemo(() => {
    const keyword = reservationSearch
      .toLowerCase()
      .trim();

    return reservations.filter((reservation) => {
      const matchesSearch =
        !keyword ||
        (reservation.employee?.fullName ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (reservation.room?.roomNumber ?? "")
          .toLowerCase()
          .includes(keyword) ||
        (
          reservation.externalProviderName ?? ""
        )
          .toLowerCase()
          .includes(keyword) ||
        (
          reservation.travelRequest?.toLocation ??
          ""
        )
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        reservationStatusFilter === "ALL" ||
        reservation.status ===
          reservationStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    reservations,
    reservationSearch,
    reservationStatusFilter,
  ]);

  function resetRoomForm() {
    setRoomForm(defaultRoomForm);
    setEditingRoomId(null);
    setError("");
  }

  function resetReservationForm() {
    setReservationForm(
      defaultReservationForm
    );
    setError("");
  }

  function handleEditRoom(
    room: AccommodationRoom
  ) {
    setEditingRoomId(room.id);

    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      facilityName: room.facilityName,
      city: room.city,
      location: room.location ?? "",
      dailyRate: room.dailyRate,
      status: room.status,
      notes: room.notes ?? "",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selectTravelRequest(
    request: TravelRequest
  ) {
    setReservationForm({
      ...defaultReservationForm,
      travelRequestId: request.id,
      checkInDate: request.departureDate
        ? request.departureDate.slice(0, 10)
        : "",
      checkOutDate: request.returnDate
        ? request.returnDate.slice(0, 10)
        : "",
      accommodationSource:
        availableRooms.length > 0
          ? "INTERNAL"
          : "EXTERNAL",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleRoomSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSavingRoom(true);

    try {
      if (!roomForm.roomNumber.trim()) {
        throw new Error(
          "Room number is required"
        );
      }

      if (!roomForm.facilityName.trim()) {
        throw new Error(
          "Facility name is required"
        );
      }

      if (!roomForm.city.trim()) {
        throw new Error("City is required");
      }

      if (roomForm.capacity < 1) {
        throw new Error(
          "Room capacity must be at least 1"
        );
      }

      if (roomForm.dailyRate < 0) {
        throw new Error(
          "Daily rate cannot be negative"
        );
      }

      const basePayload: CreateRoomInput = {
        roomNumber: roomForm.roomNumber.trim(),
        roomType: roomForm.roomType,
        capacity: Number(roomForm.capacity),
        facilityName:
          roomForm.facilityName.trim(),
        city: roomForm.city.trim(),
        dailyRate: Number(
          roomForm.dailyRate
        ),
      };

      if (roomForm.location.trim()) {
        basePayload.location =
          roomForm.location.trim();
      }

      if (roomForm.notes.trim()) {
        basePayload.notes =
          roomForm.notes.trim();
      }

      if (editingRoomId) {
        const updatePayload: UpdateRoomInput = {
          ...basePayload,
          status: roomForm.status,
          location: roomForm.location.trim(),
          notes: roomForm.notes.trim(),
        };

        await updateAccommodationRoom(
          editingRoomId,
          updatePayload
        );

        setMessage(
          "Room updated successfully"
        );
      } else {
        await createAccommodationRoom(
          basePayload
        );

        setMessage(
          "Room registered successfully"
        );
      }

      resetRoomForm();
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to save room"
      );
    } finally {
      setIsSavingRoom(false);
    }
  }

  async function handleReservationSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSavingReservation(true);

    try {
      if (
        !reservationForm.travelRequestId
      ) {
        throw new Error(
          "Select an approved travel request"
        );
      }

      if (
        !reservationForm.checkInDate ||
        !reservationForm.checkOutDate
      ) {
        throw new Error(
          "Check-in and check-out dates are required"
        );
      }

      if (numberOfNights < 1) {
        throw new Error(
          "Check-out date must be after check-in date"
        );
      }

      if (
        reservationForm.accommodationSource ===
          "INTERNAL" &&
        !reservationForm.roomId
      ) {
        throw new Error(
          "Select an internal room"
        );
      }

      if (
        reservationForm.accommodationSource ===
          "EXTERNAL" &&
        !reservationForm.externalProviderName.trim()
      ) {
        throw new Error(
          "External provider name is required"
        );
      }

      const payload: CreateReservationInput = {
        travelRequestId:
          reservationForm.travelRequestId,

        accommodationSource:
          reservationForm.accommodationSource,

        checkInDate:
          reservationForm.checkInDate,

        checkOutDate:
          reservationForm.checkOutDate,
      };

      if (
        reservationForm.accommodationSource ===
        "INTERNAL"
      ) {
        payload.roomId =
          reservationForm.roomId;
      } else {
        payload.externalProviderName =
          reservationForm.externalProviderName.trim();

        if (
          reservationForm.externalAddress.trim()
        ) {
          payload.externalAddress =
            reservationForm.externalAddress.trim();
        }

        payload.externalDailyRate = Number(
          reservationForm.externalDailyRate
        );
      }

      if (reservationForm.notes.trim()) {
        payload.notes =
          reservationForm.notes.trim();
      }

      await createRoomReservation(payload);

      setMessage(
        reservationForm.accommodationSource ===
          "INTERNAL"
          ? "Internal room assigned successfully"
          : "External accommodation recorded successfully"
      );

      resetReservationForm();
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to assign accommodation"
      );
    } finally {
      setIsSavingReservation(false);
    }
  }

  async function handleDeactivateRoom(
    room: AccommodationRoom
  ) {
    const confirmed = window.confirm(
      `Deactivate room ${room.roomNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(room.id);
      setError("");
      setMessage("");

      await deactivateAccommodationRoom(
        room.id
      );

      setMessage(
        `Room ${room.roomNumber} deactivated successfully`
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to deactivate room"
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCheckIn(
    reservation: RoomReservation
  ) {
    const confirmed = window.confirm(
      `Check in ${
        reservation.employee?.fullName ??
        "this guest"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(reservation.id);
      setError("");
      setMessage("");

      await checkInReservation(
        reservation.id
      );

      setMessage(
        "Guest checked in successfully"
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to check in guest"
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCheckOut(
    reservation: RoomReservation
  ) {
    const confirmed = window.confirm(
      `Check out ${
        reservation.employee?.fullName ??
        "this guest"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(reservation.id);
      setError("");
      setMessage("");

      await checkOutReservation(
        reservation.id
      );

      setMessage(
        "Guest checked out successfully"
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to check out guest"
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCancelReservation(
    reservation: RoomReservation
  ) {
    const confirmed = window.confirm(
      "Cancel this accommodation reservation?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(reservation.id);
      setError("");
      setMessage("");

      await cancelReservation(
        reservation.id
      );

      setMessage(
        "Reservation cancelled successfully"
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) ??
          "Failed to cancel reservation"
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
            Accommodation Administration
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Accommodation Management
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
            Manage internal guest-house inventory and
            assign rooms to approved travel requests
            before using external accommodation.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
        >
          <RefreshCcw
            size={16}
            className="mr-2"
          />
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
                Total Rooms
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.totalRooms}
              </p>
            </div>

            <Hotel
              size={24}
              className="text-blue-700"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Available Rooms
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {summary.availableRooms}
              </p>
            </div>

            <DoorOpen
              size={24}
              className="text-emerald-700"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Occupied Rooms
              </p>

              <p className="mt-2 text-2xl font-bold text-violet-700">
                {summary.occupiedRooms}
              </p>
            </div>

            <BedDouble
              size={24}
              className="text-violet-700"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Awaiting Assignment
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-700">
                {summary.pendingAssignments}
              </p>
            </div>

            <Building2
              size={24}
              className="text-amber-700"
            />
          </div>
        </Card>
      </div>

      <div className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
        {[
          {
            key: "ASSIGNMENTS",
            label: "Room Assignment",
          },
          {
            key: "ROOMS",
            label: "Room Inventory",
          },
          {
            key: "RESERVATIONS",
            label: "Reservations",
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() =>
              setActiveTab(
                tab.key as typeof activeTab
              )
            }
            className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <div className="py-12 text-center text-sm text-slate-500">
            Loading accommodation data...
          </div>
        </Card>
      ) : null}

      {!isLoading &&
        activeTab === "ASSIGNMENTS" && (
          <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
            <Card>
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
                  Internal-First Assignment
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-900">
                  Assign Accommodation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Internal rooms should be selected
                  whenever availability exists.
                </p>
              </div>

              <form
                onSubmit={
                  handleReservationSubmit
                }
                className="space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Approved Travel Request
                  </label>

                  <select
                    value={
                      reservationForm.travelRequestId
                    }
                    onChange={(event) => {
                      const request =
                        travelRequests.find(
                          (item) =>
                            item.id ===
                            event.target.value
                        );

                      if (request) {
                        selectTravelRequest(
                          request
                        );
                      } else {
                        resetReservationForm();
                      }
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">
                      Select request
                    </option>

                    {travelRequests.map(
                      (request) => (
                        <option
                          key={request.id}
                          value={request.id}
                        >
                          {request.employee
                            ?.fullName ??
                            "Employee"}{" "}
                          —{" "}
                          {
                            request.toLocation
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {selectedTravelRequest && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <UserRound
                        size={20}
                        className="mt-0.5 text-blue-700"
                      />

                      <div>
                        <p className="font-bold text-slate-900">
                          {selectedTravelRequest
                            .employee?.fullName ??
                            "Employee"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {
                            selectedTravelRequest.toLocation
                          }
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {formatDate(
                            selectedTravelRequest.departureDate
                          )}{" "}
                          –{" "}
                          {formatDate(
                            selectedTravelRequest.returnDate
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Accommodation Source
                  </label>

                  <select
                    value={
                      reservationForm.accommodationSource
                    }
                    onChange={(event) => {
                      const source =
                        event.target
                          .value as AccommodationSource;

                      setReservationForm({
                        ...reservationForm,
                        accommodationSource:
                          source,
                        roomId:
                          source === "EXTERNAL"
                            ? ""
                            : reservationForm.roomId,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="INTERNAL">
                      Internal Guest House
                    </option>

                    <option value="EXTERNAL">
                      External Accommodation
                    </option>
                  </select>

                  {availableRooms.length >
                    0 &&
                    reservationForm.accommodationSource ===
                      "EXTERNAL" && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Internal rooms are currently
                        available. External accommodation
                        should only be used with a valid
                        reason.
                      </p>
                    )}
                </div>

                {reservationForm.accommodationSource ===
                "INTERNAL" ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Internal Room
                    </label>

                    <select
                      value={
                        reservationForm.roomId
                      }
                      onChange={(event) =>
                        setReservationForm({
                          ...reservationForm,
                          roomId:
                            event.target.value,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">
                        Select available room
                      </option>

                      {availableRooms.map(
                        (room) => (
                          <option
                            key={room.id}
                            value={room.id}
                          >
                            {
                              room.facilityName
                            }{" "}
                            — Room{" "}
                            {
                              room.roomNumber
                            }{" "}
                            —{" "}
                            {formatLabel(
                              room.roomType
                            )}
                          </option>
                        )
                      )}
                    </select>

                    {availableRooms.length ===
                      0 && (
                      <p className="mt-2 text-xs font-medium text-red-700">
                        No internal room is available.
                        Select external accommodation.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        External Provider
                      </label>

                      <input
                        value={
                          reservationForm.externalProviderName
                        }
                        onChange={(event) =>
                          setReservationForm({
                            ...reservationForm,
                            externalProviderName:
                              event.target.value,
                          })
                        }
                        placeholder="Hotel or guest-house name"
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        External Address
                      </label>

                      <textarea
                        rows={3}
                        value={
                          reservationForm.externalAddress
                        }
                        onChange={(event) =>
                          setReservationForm({
                            ...reservationForm,
                            externalAddress:
                              event.target.value,
                          })
                        }
                        className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Daily Rate
                      </label>

                      <input
                        type="number"
                        min={0}
                        value={
                          reservationForm.externalDailyRate
                        }
                        onChange={(event) =>
                          setReservationForm({
                            ...reservationForm,
                            externalDailyRate:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        }
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Check In
                    </label>

                    <input
                      type="date"
                      value={
                        reservationForm.checkInDate
                      }
                      onChange={(event) =>
                        setReservationForm({
                          ...reservationForm,
                          checkInDate:
                            event.target.value,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Check Out
                    </label>

                    <input
                      type="date"
                      min={
                        reservationForm.checkInDate
                      }
                      value={
                        reservationForm.checkOutDate
                      }
                      onChange={(event) =>
                        setReservationForm({
                          ...reservationForm,
                          checkOutDate:
                            event.target.value,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">
                      Number of nights
                    </span>

                    <span className="font-bold text-blue-900">
                      {numberOfNights}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-blue-700">
                      Estimated cost
                    </span>

                    <span className="font-bold text-blue-900">
                      PKR{" "}
                      {estimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Notes
                  </label>

                  <textarea
                    rows={3}
                    value={
                      reservationForm.notes
                    }
                    onChange={(event) =>
                      setReservationForm({
                        ...reservationForm,
                        notes:
                          event.target.value,
                      })
                    }
                    placeholder="Assignment instructions or external accommodation justification"
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={
                    isSavingReservation ||
                    !reservationForm.travelRequestId
                  }
                >
                  <CheckCircle2
                    size={16}
                    className="mr-2"
                  />

                  {isSavingReservation
                    ? "Assigning..."
                    : "Assign Accommodation"}
                </Button>
              </form>
            </Card>

            <Card className="min-w-0">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Approved Requests Requiring Stay
                </h2>

                <p className="text-sm text-slate-500">
                  {
                    travelRequests.length
                  }{" "}
                  requests awaiting assignment
                </p>
              </div>

              <div className="w-full min-w-0 overflow-x-auto">
                <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2">
                        Employee
                      </th>
                      <th className="px-4 py-2">
                        Destination
                      </th>
                      <th className="px-4 py-2">
                        Dates
                      </th>
                      <th className="px-4 py-2">
                        Nights
                      </th>
                      <th className="px-4 py-2">
                        Travel Type
                      </th>
                      <th className="px-4 py-2 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {travelRequests.map(
                      (request) => (
                        <tr
                          key={request.id}
                          className="bg-slate-50"
                        >
                          <td className="rounded-l-2xl px-4 py-4">
                            <p className="font-semibold text-slate-900">
                              {request.employee
                                ?.fullName ??
                                "Employee"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {request.employee
                                ?.department ??
                                "-"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-start gap-2">
                              <MapPin
                                size={16}
                                className="mt-0.5 text-red-500"
                              />

                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {
                                    request.toLocation
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  from{" "}
                                  {
                                    request.fromLocation
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-700">
                            {formatDate(
                              request.departureDate
                            )}{" "}
                            –{" "}
                            {formatDate(
                              request.returnDate
                            )}
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-700">
                            {calculateNights(
                              request.departureDate,
                              request.returnDate
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {formatLabel(
                              request.travelType
                            )}
                          </td>

                          <td className="rounded-r-2xl px-4 py-4 text-right">
                            <Button
                              type="button"
                              onClick={() =>
                                selectTravelRequest(
                                  request
                                )
                              }
                            >
                              Assign Room
                            </Button>
                          </td>
                        </tr>
                      )
                    )}

                    {travelRequests.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                        >
                          No approved travel
                          requests currently require
                          accommodation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

      {!isLoading && activeTab === "ROOMS" && (
        <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(330px,410px)_minmax(0,1fr)]">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <PlusCircle size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingRoomId
                    ? "Edit Room"
                    : "Register Room"}
                </h2>

                <p className="text-sm text-slate-500">
                  Maintain internal guest-house
                  inventory.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleRoomSubmit}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Facility Name
                </label>

                <input
                  value={
                    roomForm.facilityName
                  }
                  onChange={(event) =>
                    setRoomForm({
                      ...roomForm,
                      facilityName:
                        event.target.value,
                    })
                  }
                  placeholder="Indus Guest House Karachi"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Room Number
                  </label>

                  <input
                    value={
                      roomForm.roomNumber
                    }
                    onChange={(event) =>
                      setRoomForm({
                        ...roomForm,
                        roomNumber:
                          event.target.value,
                      })
                    }
                    placeholder="101"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Room Type
                  </label>

                  <select
                    value={roomForm.roomType}
                    onChange={(event) =>
                      setRoomForm({
                        ...roomForm,
                        roomType:
                          event.target
                            .value as RoomType,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    {roomTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {formatLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Capacity
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={
                      roomForm.capacity
                    }
                    onChange={(event) =>
                      setRoomForm({
                        ...roomForm,
                        capacity: Number(
                          event.target.value
                        ),
                      })
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Daily Rate
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={
                      roomForm.dailyRate
                    }
                    onChange={(event) =>
                      setRoomForm({
                        ...roomForm,
                        dailyRate: Number(
                          event.target.value
                        ),
                      })
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  City
                </label>

                <input
                  value={roomForm.city}
                  onChange={(event) =>
                    setRoomForm({
                      ...roomForm,
                      city:
                        event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Location
                </label>

                <textarea
                  rows={3}
                  value={
                    roomForm.location
                  }
                  onChange={(event) =>
                    setRoomForm({
                      ...roomForm,
                      location:
                        event.target.value,
                    })
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {editingRoomId && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Room Status
                  </label>

                  <select
                    value={roomForm.status}
                    onChange={(event) =>
                      setRoomForm({
                        ...roomForm,
                        status:
                          event.target
                            .value as RoomStatus,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    {roomStatuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatLabel(
                            status
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes
                </label>

                <textarea
                  rows={3}
                  value={roomForm.notes}
                  onChange={(event) =>
                    setRoomForm({
                      ...roomForm,
                      notes:
                        event.target.value,
                    })
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  disabled={isSavingRoom}
                >
                  {isSavingRoom
                    ? "Saving..."
                    : editingRoomId
                      ? "Update Room"
                      : "Register Room"}
                </Button>

                {editingRoomId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={
                      resetRoomForm
                    }
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
                  Internal Room Inventory
                </h2>

                <p className="text-sm text-slate-500">
                  {filteredRooms.length} rooms
                  found
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={roomSearch}
                    onChange={(event) =>
                      setRoomSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search rooms..."
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 xl:w-60"
                  />
                </div>

                <select
                  value={
                    roomStatusFilter
                  }
                  onChange={(event) =>
                    setRoomStatusFilter(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="ALL">
                    All statuses
                  </option>

                  {roomStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatLabel(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">
                      Room
                    </th>
                    <th className="px-4 py-2">
                      Facility
                    </th>
                    <th className="px-4 py-2">
                      Capacity
                    </th>
                    <th className="px-4 py-2">
                      Daily Rate
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
                  {filteredRooms.map(
                    (room) => (
                      <tr
                        key={room.id}
                        className="bg-slate-50"
                      >
                        <td className="rounded-l-2xl px-4 py-4">
                          <p className="font-bold text-slate-900">
                            Room{" "}
                            {
                              room.roomNumber
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatLabel(
                              room.roomType
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {
                              room.facilityName
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            {room.city}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {room.capacity}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          PKR{" "}
                          {Number(
                            room.dailyRate
                          ).toLocaleString()}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getRoomStatusBadge(
                              room.status
                            )}`}
                          >
                            {formatLabel(
                              room.status
                            )}
                          </span>
                        </td>

                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() =>
                                handleEditRoom(
                                  room
                                )
                              }
                            >
                              <Edit
                                size={15}
                                className="mr-2"
                              />
                              Edit
                            </Button>

                            <Button
                              type="button"
                              variant="danger"
                              disabled={
                                room.status ===
                                  "INACTIVE" ||
                                processingId ===
                                  room.id
                              }
                              onClick={() =>
                                handleDeactivateRoom(
                                  room
                                )
                              }
                            >
                              <XCircle
                                size={15}
                                className="mr-2"
                              />

                              {processingId ===
                              room.id
                                ? "Processing..."
                                : room.status ===
                                    "INACTIVE"
                                  ? "Inactive"
                                  : "Deactivate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredRooms.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No rooms matched the
                        selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {!isLoading &&
        activeTab === "RESERVATIONS" && (
          <Card className="min-w-0">
            <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Accommodation Reservations
                </h2>

                <p className="text-sm text-slate-500">
                  {
                    filteredReservations.length
                  }{" "}
                  reservations found
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={
                      reservationSearch
                    }
                    onChange={(event) =>
                      setReservationSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search reservations..."
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 xl:w-64"
                  />
                </div>

                <select
                  value={
                    reservationStatusFilter
                  }
                  onChange={(event) =>
                    setReservationStatusFilter(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="ALL">
                    All statuses
                  </option>

                  {reservationStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatLabel(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1150px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">
                      Guest
                    </th>
                    <th className="px-4 py-2">
                      Accommodation
                    </th>
                    <th className="px-4 py-2">
                      Stay
                    </th>
                    <th className="px-4 py-2">
                      Cost
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
                  {filteredReservations.map(
                    (reservation) => (
                      <tr
                        key={reservation.id}
                        className="bg-slate-50"
                      >
                        <td className="rounded-l-2xl px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {reservation.employee
                              ?.fullName ??
                              reservation.travelRequest
                                ?.employee
                                ?.fullName ??
                              "Employee"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {reservation.travelRequest
                              ?.toLocation ??
                              "-"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          {reservation.accommodationSource ===
                          "INTERNAL" ? (
                            <div>
                              <p className="text-sm font-semibold text-slate-700">
                                {reservation.room
                                  ?.facilityName ??
                                  "Internal Facility"}
                              </p>

                              <p className="text-xs text-slate-500">
                                Room{" "}
                                {reservation.room
                                  ?.roomNumber ??
                                  "-"}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-slate-700">
                                {reservation.externalProviderName ??
                                  "External Provider"}
                              </p>

                              <p className="text-xs text-slate-500">
                                External
                                accommodation
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm text-slate-700">
                            {formatDate(
                              reservation.checkInDate
                            )}{" "}
                            –{" "}
                            {formatDate(
                              reservation.checkOutDate
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            {reservation.numberOfNights ??
                              calculateNights(
                                reservation.checkInDate,
                                reservation.checkOutDate
                              )}{" "}
                            nights
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          PKR{" "}
                          {Number(
                            reservation.estimatedCost ??
                              0
                          ).toLocaleString()}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getReservationStatusBadge(
                              reservation.status
                            )}`}
                          >
                            {formatLabel(
                              reservation.status
                            )}
                          </span>
                        </td>

                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {reservation.status ===
                              "RESERVED" && (
                              <Button
                                type="button"
                                disabled={
                                  processingId ===
                                  reservation.id
                                }
                                onClick={() =>
                                  handleCheckIn(
                                    reservation
                                  )
                                }
                              >
                                <LogIn
                                  size={15}
                                  className="mr-2"
                                />
                                Check In
                              </Button>
                            )}

                            {reservation.status ===
                              "CHECKED_IN" && (
                              <Button
                                type="button"
                                disabled={
                                  processingId ===
                                  reservation.id
                                }
                                onClick={() =>
                                  handleCheckOut(
                                    reservation
                                  )
                                }
                              >
                                <LogOut
                                  size={15}
                                  className="mr-2"
                                />
                                Check Out
                              </Button>
                            )}

                            {reservation.status ===
                              "RESERVED" && (
                              <Button
                                type="button"
                                variant="danger"
                                disabled={
                                  processingId ===
                                  reservation.id
                                }
                                onClick={() =>
                                  handleCancelReservation(
                                    reservation
                                  )
                                }
                              >
                                <XCircle
                                  size={15}
                                  className="mr-2"
                                />
                                Cancel
                              </Button>
                            )}

                            {(reservation.status ===
                              "CHECKED_OUT" ||
                              reservation.status ===
                                "CANCELLED") && (
                              <span className="text-xs text-slate-400">
                                No action
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredReservations.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No accommodation
                        reservations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
    </div>
  );
}