import type { TravelRequest } from "./travel";
import type { ExpenseClaim } from "./expense";
import type { ShuttleBooking } from "./shuttle";

export interface ReportDashboardSummary {
  totals: {
    users: number;
    vehicles: number;
    drivers: number;
    routes: number;
    shuttleBookings: number;
    travelRequests: number;
    rooms: number;
    reservations: number;
    expenseClaims: number;
    vendors: number;
    endorBills: number;
    telemetryLogs: number;
    notifications: number;
    policyRules: number;
    policyDecisionLogs: number;
  };
  travel: {
    pending: number;
    approved: number;
    rejected: number;
  };
  expenses: {
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
  };
  accommodation: {
    availableRooms: number;
    occupiedRooms: number;
    confirmedReservations: number;
  };
  telemetry: {
    emergencyEvents: number;
  };
  trips: {
    active: number;
    completed: number;
  };
  notifications: {
    unread: number;
    urgent: number;
  };
  proxyBookings: {
    travelRequests: number;
    shuttleBookings: number;
    total: number;
  };
  maintenance: {
    vehicleTasks: number;
    openVehicleTasks: number;
    housekeepingTasks: number;
    pendingHousekeepingTasks: number;
  };
  erpExports: {
    total: number;
    synced: number;
    failed: number;
  };
}

export interface ReportPendingApprovalsSummary {
  counts: {
    pendingTravelRequests: number;
    pendingExpenseClaims: number;
    flaggedExpenseClaims: number;
    pendingShuttleBookings: number;
  };
  pendingTravelRequests: TravelRequest[];
  pendingExpenseClaims: ExpenseClaim[];
  flaggedExpenseClaims: ExpenseClaim[];
  pendingShuttleBookings: ShuttleBooking[];
}

export interface ReportTransportSummary {
  vehicles: number;
  drivers: number;
  routes: number;
  bookings: {
    total: number;
    pending: number;
    assigned: number;
    completed: number;
    noShow: number;
  };
  trips: {
    active: number;
    completed: number;
  };
}

export interface ReportTravelSummary {
  travelRequests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  byType: {
    INTER_CAMPUS: number;
    WITHIN_CITY: number;
    INTER_CITY: number;
    INTERNATIONAL: number;
  };
  budgets: {
    estimatedTotal: number;
    averagePerTrip: number;
  };
}

export interface ReportAccommodationSummary {
  rooms: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    inactive: number;
  };
  byType: {
    SINGLE: number;
    DOUBLE: number;
    TWIN: number;
    SUITE: number;
    DORMITORY: number;
  };
  reservations: {
    total: number;
    confirmed: number;
    checkedIn: number;
    checkedOut: number;
    cancelled: number;
  };
}

export interface ReportExpenseSummary {
  claims: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    paid: number;
  };
  byCategory: {
    TRAVEL: number;
    ACCOMMODATION: number;
    MEAL: number;
    FUEL: number;
    TOLL: number;
    LOCAL_TRANSPORT: number;
    MEDICAL: number;
    OTHER: number;
  };
  amounts: {
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
  };
}
