import {
  AccommodationType,
  ExpenseAnomalyStatus,
  ExpenseCategory,
  ExpenseClaimStatus,
  FitnessStatus,
  HousekeepingPriority,
  HousekeepingTaskStatus,
  HousekeepingTaskType,
  HRGrade,
  MaintenancePriority,
  MaintenanceTaskStatus,
  MaintenanceTaskType,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  OwnershipType,
  PayrollExportFormat,
  PayrollExportStatus,
  PayrollExportType,
  PayrollSyncStatus,
  PolicyDecisionStatus,
  PolicyRuleStatus,
  PolicyRuleType,
  ReservationStatus,
  RoleName,
  RoomStatus,
  RoomType,
  RouteStatus,
  ShiftType,
  ShuttleBookingStatus,
  TelemetrySource,
  TelemetryStatus,
  TravelRequestStatus,
  TravelType,
  TravelUrgency,
  TripIssueType,
  TripStatus,
  UserStatus,
  VehicleStatus,
  VehicleType,
  VendorBillStatus,
  VendorContractType,
  VendorStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  employeeCode: true,
  department: true,
  hrGrade: true,
  role: {
    select: {
      name: true,
    },
  },
};

const menuItems = [
  {
    key: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    roles: [
      "SUPER_ADMIN",
      "EMPLOYEE",
      "MANAGER",
      "TRANSPORT_ADMIN",
      "ACCOMMODATION_ADMIN",
      "DRIVER",
      "FINANCE_OFFICER",
      "SECURITY_OFFICER",
    ],
  },
  {
    key: "users",
    title: "User Management",
    path: "/users",
    roles: ["SUPER_ADMIN"],
  },
  {
    key: "vehicles",
    title: "Vehicles",
    path: "/vehicles",
    roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
  },
  {
    key: "drivers",
    title: "Drivers",
    path: "/drivers",
    roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
  },
  {
    key: "routes",
    title: "Routes & Smart Stops",
    path: "/routes",
    roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
  },
  {
    key: "shuttleBookings",
    title: "Shuttle Bookings",
    path: "/shuttle-bookings",
    roles: ["SUPER_ADMIN", "EMPLOYEE", "MANAGER", "TRANSPORT_ADMIN"],
  },
  {
    key: "driverTrips",
    title: "Driver Trips",
    path: "/driver-trips",
    roles: ["SUPER_ADMIN", "DRIVER", "TRANSPORT_ADMIN"],
  },
  {
    key: "travelRequests",
    title: "Travel Requests",
    path: "/travel-requests",
    roles: [
      "SUPER_ADMIN",
      "EMPLOYEE",
      "MANAGER",
      "TRANSPORT_ADMIN",
      "ACCOMMODATION_ADMIN",
      "FINANCE_OFFICER",
    ],
  },
  {
    key: "accommodation",
    title: "Accommodation",
    path: "/accommodation",
    roles: ["SUPER_ADMIN", "ACCOMMODATION_ADMIN", "MANAGER"],
  },
  {
    key: "expenses",
    title: "Expense Claims",
    path: "/expenses",
    roles: ["SUPER_ADMIN", "EMPLOYEE", "MANAGER", "FINANCE_OFFICER"],
  },
  {
    key: "vendors",
    title: "Vendors",
    path: "/vendors",
    roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN", "FINANCE_OFFICER"],
  },
  {
    key: "telemetry",
    title: "Live Tracking",
    path: "/telemetry",
    roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN", "SECURITY_OFFICER", "DRIVER"],
  },
  {
    key: "notifications",
    title: "Notifications",
    path: "/notifications",
    roles: [
      "SUPER_ADMIN",
      "EMPLOYEE",
      "MANAGER",
      "TRANSPORT_ADMIN",
      "ACCOMMODATION_ADMIN",
      "DRIVER",
      "FINANCE_OFFICER",
      "SECURITY_OFFICER",
    ],
  },
  {
    key: "proxyBookings",
    title: "Proxy Bookings",
    path: "/proxy-bookings",
    roles: ["SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN"],
  },
  {
    key: "policies",
    title: "Policies",
    path: "/policies",
    roles: [
      "SUPER_ADMIN",
      "MANAGER",
      "TRANSPORT_ADMIN",
      "ACCOMMODATION_ADMIN",
      "FINANCE_OFFICER",
    ],
  },
  {
    key: "maintenance",
    title: "Maintenance & Housekeeping",
    path: "/maintenance",
    roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN", "ACCOMMODATION_ADMIN", "DRIVER"],
  },
  {
    key: "erpExports",
    title: "ERP Payroll Exports",
    path: "/erp-exports",
    roles: ["SUPER_ADMIN", "FINANCE_OFFICER"],
  },
  {
    key: "reports",
    title: "Reports",
    path: "/reports",
    roles: [
      "SUPER_ADMIN",
      "MANAGER",
      "TRANSPORT_ADMIN",
      "ACCOMMODATION_ADMIN",
      "FINANCE_OFFICER",
    ],
  },
  {
    key: "auditLogs",
    title: "Audit Logs",
    path: "/audit-logs",
    roles: ["SUPER_ADMIN"],
  },
];

function canAccess(role: string, roles: string[]) {
  return role === "SUPER_ADMIN" || roles.includes(role);
}

export async function getCurrentProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: userSelect,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export function getRoleMenu(role: string) {
  return menuItems
    .filter((item) => canAccess(role, item.roles))
    .map(({ roles, ...item }) => item);
}

export function getRolePermissions(role: string) {
  return {
    canManageUsers: role === "SUPER_ADMIN",

    canManageTransport:
      role === "SUPER_ADMIN" || role === "TRANSPORT_ADMIN",

    canManageAccommodation:
      role === "SUPER_ADMIN" || role === "ACCOMMODATION_ADMIN",

    canReviewFinance:
      role === "SUPER_ADMIN" || role === "FINANCE_OFFICER",

    canApproveTravel:
      role === "SUPER_ADMIN" || role === "MANAGER",

    canViewReports:
      role === "SUPER_ADMIN" ||
      role === "MANAGER" ||
      role === "TRANSPORT_ADMIN" ||
      role === "ACCOMMODATION_ADMIN" ||
      role === "FINANCE_OFFICER",

    canViewAuditLogs: role === "SUPER_ADMIN",

    canUseDriverApp: role === "DRIVER",

    canViewEmergencyTracking:
      role === "SUPER_ADMIN" ||
      role === "TRANSPORT_ADMIN" ||
      role === "SECURITY_OFFICER",

    canCreateProxyBookings:
      role === "SUPER_ADMIN" ||
      role === "MANAGER" ||
      role === "TRANSPORT_ADMIN",

    canExportPayroll:
      role === "SUPER_ADMIN" || role === "FINANCE_OFFICER",
  };
}

export function getFormOptions() {
  return {
    roles: Object.values(RoleName),
    userStatuses: Object.values(UserStatus),
    hrGrades: Object.values(HRGrade),

    vehicleTypes: Object.values(VehicleType),
    vehicleStatuses: Object.values(VehicleStatus),
    ownershipTypes: Object.values(OwnershipType),
    fitnessStatuses: Object.values(FitnessStatus),

    routeStatuses: Object.values(RouteStatus),
    shiftTypes: Object.values(ShiftType),
    shuttleBookingStatuses: Object.values(ShuttleBookingStatus),

    tripStatuses: Object.values(TripStatus),
    tripIssueTypes: Object.values(TripIssueType),

    travelTypes: Object.values(TravelType),
    travelUrgencies: Object.values(TravelUrgency),
    travelRequestStatuses: Object.values(TravelRequestStatus),

    roomTypes: Object.values(RoomType),
    roomStatuses: Object.values(RoomStatus),
    accommodationTypes: Object.values(AccommodationType),
    reservationStatuses: Object.values(ReservationStatus),

    expenseCategories: Object.values(ExpenseCategory),
    expenseClaimStatuses: Object.values(ExpenseClaimStatus),
    expenseAnomalyStatuses: Object.values(ExpenseAnomalyStatus),
    payrollSyncStatuses: Object.values(PayrollSyncStatus),

    vendorStatuses: Object.values(VendorStatus),
    vendorContractTypes: Object.values(VendorContractType),
    vendorBillStatuses: Object.values(VendorBillStatus),

    telemetryStatuses: Object.values(TelemetryStatus),
    telemetrySources: Object.values(TelemetrySource),

    notificationTypes: Object.values(NotificationType),
    notificationPriorities: Object.values(NotificationPriority),
    notificationStatuses: Object.values(NotificationStatus),

    policyRuleTypes: Object.values(PolicyRuleType),
    policyRuleStatuses: Object.values(PolicyRuleStatus),
    policyDecisionStatuses: Object.values(PolicyDecisionStatus),

    maintenanceTaskTypes: Object.values(MaintenanceTaskType),
    maintenanceTaskStatuses: Object.values(MaintenanceTaskStatus),
    maintenancePriorities: Object.values(MaintenancePriority),

    housekeepingTaskTypes: Object.values(HousekeepingTaskType),
    housekeepingTaskStatuses: Object.values(HousekeepingTaskStatus),
    housekeepingPriorities: Object.values(HousekeepingPriority),

    payrollExportTypes: Object.values(PayrollExportType),
    payrollExportFormats: Object.values(PayrollExportFormat),
    payrollExportStatuses: Object.values(PayrollExportStatus),
  };
}

export function getDashboardCards(role: string) {
  const commonCards = [
    {
      key: "notifications",
      title: "Notifications",
      api: "/api/notifications/my/summary",
    },
  ];

  const cardsByRole: Record<string, any[]> = {
    SUPER_ADMIN: [
      {
        key: "overview",
        title: "System Overview",
        api: "/api/reports/dashboard",
      },
      {
        key: "pendingApprovals",
        title: "Pending Approvals",
        api: "/api/reports/pending-approvals",
      },
      {
        key: "liveTracking",
        title: "Live Tracking",
        api: "/api/telemetry/live",
      },
      {
        key: "auditLogs",
        title: "Audit Logs",
        api: "/api/audit-logs",
      },
    ],

    EMPLOYEE: [
      {
        key: "myDashboard",
        title: "My Dashboard",
        api: "/api/reports/my",
      },
      {
        key: "myTravelRequests",
        title: "My Travel Requests",
        api: "/api/travel-requests/my",
      },
      {
        key: "myExpenseClaims",
        title: "My Expense Claims",
        api: "/api/expenses/my",
      },
    ],

    DRIVER: [
      {
        key: "assignedRoutes",
        title: "Assigned Routes",
        api: "/api/driver-trips/routes",
      },
      {
        key: "myTelemetry",
        title: "My Telemetry Logs",
        api: "/api/telemetry/my",
      },
    ],

    TRANSPORT_ADMIN: [
      {
        key: "transportSummary",
        title: "Transport Summary",
        api: "/api/reports/transport",
      },
      {
        key: "liveTracking",
        title: "Live Tracking",
        api: "/api/telemetry/live",
      },
      {
        key: "maintenance",
        title: "Vehicle Maintenance",
        api: "/api/maintenance/vehicle-tasks/open",
      },
    ],

    ACCOMMODATION_ADMIN: [
      {
        key: "accommodationSummary",
        title: "Accommodation Summary",
        api: "/api/reports/accommodation",
      },
      {
        key: "housekeeping",
        title: "Housekeeping Tasks",
        api: "/api/maintenance/housekeeping-tasks/pending",
      },
    ],

    FINANCE_OFFICER: [
      {
        key: "expenseSummary",
        title: "Expense Summary",
        api: "/api/reports/expenses",
      },
      {
        key: "pendingVendorBills",
        title: "Pending Vendor Bills",
        api: "/api/vendors/bills/pending",
      },
      {
        key: "erpExports",
        title: "ERP Exports",
        api: "/api/erp-exports",
      },
    ],

    MANAGER: [
      {
        key: "travelSummary",
        title: "Travel Summary",
        api: "/api/reports/travel",
      },
      {
        key: "pendingApprovals",
        title: "Pending Approvals",
        api: "/api/reports/pending-approvals",
      },
      {
        key: "proxyBookings",
        title: "Proxy Bookings",
        api: "/api/proxy-bookings/my-created",
      },
    ],

    SECURITY_OFFICER: [
      {
        key: "emergencyEvents",
        title: "Emergency Events",
        api: "/api/telemetry/emergency",
      },
    ],
  };

  return [...commonCards, ...(cardsByRole[role] ?? [])];
}

export async function getUserDropdowns() {
  const users = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
    },
    select: userSelect,
    orderBy: {
      fullName: "asc",
    },
  });

  const employees = users.filter(
    (user) => user.role.name === RoleName.EMPLOYEE
  );

  const managers = users.filter((user) => user.role.name === RoleName.MANAGER);

  const drivers = users.filter((user) => user.role.name === RoleName.DRIVER);

  return {
    users,
    employees,
    managers,
    drivers,
  };
}

export async function getTransportDropdowns() {
  const [driverUsers, vehicles, drivers, routes, vendors] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        role: {
          name: RoleName.DRIVER,
        },
      },
      select: userSelect,
      orderBy: {
        fullName: "asc",
      },
    }),

    prisma.vehicle.findMany({
      where: {
        status: VehicleStatus.ACTIVE,
      },
      orderBy: {
        vehicleNumber: "asc",
      },
    }),

    prisma.driver.findMany({
      where: {
        status: {
          in: ["AVAILABLE", "ASSIGNED"],
        },
      },
      include: {
        user: {
          select: userSelect,
        },
        vehicle: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.transportRoute.findMany({
      where: {
        status: {
          in: [RouteStatus.DRAFT, RouteStatus.ACTIVE],
        },
      },
      include: {
        vehicle: true,
        driver: {
          include: {
            user: {
              select: userSelect,
            },
          },
        },
        vendor: true,
        smartStops: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.vendor.findMany({
      where: {
        status: VendorStatus.ACTIVE,
      },
      orderBy: {
        vendorName: "asc",
      },
    }),
  ]);

  return {
    driverUsers,
    vehicles,
    drivers,
    routes,
    vendors,
  };
}

export async function getAccommodationDropdowns() {
  const [rooms, availableRooms, approvedTravelRequests] = await Promise.all([
    prisma.room.findMany({
      orderBy: {
        roomNumber: "asc",
      },
    }),

    prisma.room.findMany({
      where: {
        status: RoomStatus.AVAILABLE,
      },
      orderBy: {
        roomNumber: "asc",
      },
    }),

    prisma.travelRequest.findMany({
      where: {
        status: TravelRequestStatus.APPROVED,
        accommodationRequired: true,
      },
      include: {
        employee: {
          select: userSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    rooms,
    availableRooms,
    approvedTravelRequests,
  };
}

export async function getFinanceDropdowns() {
  const [expenseClaims, vendorBills, travelAllowances, payrollExports] =
    await Promise.all([
      prisma.expenseClaim.findMany({
        where: {
          status: ExpenseClaimStatus.APPROVED,
          payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
        },
        include: {
          employee: {
            select: userSelect,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.vendorBill.findMany({
        where: {
          status: VendorBillStatus.APPROVED,
          payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
        },
        include: {
          vendor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.travelRequest.findMany({
        where: {
          status: TravelRequestStatus.APPROVED,
          estimatedBudget: {
            not: null,
          },
          allowancePayrollSyncStatus: {
            not: PayrollSyncStatus.EXPORTED,
          },
        },
        include: {
          employee: {
            select: userSelect,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.payrollExport.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),
    ]);

  return {
    expenseClaimsReadyForExport: expenseClaims,
    vendorBillsReadyForExport: vendorBills,
    travelAllowancesReadyForExport: travelAllowances,
    recentPayrollExports: payrollExports,
  };
}

export async function getFrontendBootstrap(currentUser: AuthUser) {
  const [profile, notificationSummary] = await Promise.all([
    getCurrentProfile(currentUser.userId),

    prisma.notification
      .count({
        where: {
          recipientId: currentUser.userId,
          status: NotificationStatus.UNREAD,
        },
      })
      .then((unread) => ({ unread })),
  ]);

  return {
    profile,
    role: currentUser.role,
    menu: getRoleMenu(currentUser.role),
    permissions: getRolePermissions(currentUser.role),
    dashboardCards: getDashboardCards(currentUser.role),
    formOptions: getFormOptions(),
    notificationSummary,
  };
}