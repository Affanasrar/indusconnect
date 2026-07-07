import bcrypt from "bcryptjs";
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
  NotificationType,
  OwnershipType,
  PayrollSyncStatus,
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
  UserStatus,
  VehicleStatus,
  VehicleType,
  VendorBillStatus,
  VendorContractType,
  VendorStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";

const DEMO_PASSWORD = "Demo@123";

async function hashPassword() {
  return bcrypt.hash(DEMO_PASSWORD, 10);
}

async function ensureRole(name: RoleName) {
  return prisma.role.upsert({
    where: {
      name,
    },
    update: {},
    create: {
      name,
    },
  });
}

async function ensureUser(data: {
  fullName: string;
  email: string;
  phone: string;
  role: RoleName;
  employeeCode: string;
  department: string;
  hrGrade: HRGrade;
}) {
  const role = await ensureRole(data.role);
  const password = await hashPassword();

  return prisma.user.upsert({
    where: {
      email: data.email,
    },
    update: {
      fullName: data.fullName,
      phone: data.phone,
      password,
      status: UserStatus.ACTIVE,
      roleId: role.id,
      employeeCode: data.employeeCode,
      department: data.department,
      hrGrade: data.hrGrade,
    },
    create: {
      fullName: data.fullName,
      email: data.email,
      password,
      phone: data.phone,
      status: UserStatus.ACTIVE,
      roleId: role.id,
      employeeCode: data.employeeCode,
      department: data.department,
      hrGrade: data.hrGrade,
    },
    include: {
      role: true,
    },
  });
}

async function createNotificationIfMissing(data: {
  recipientId: string;
  createdById?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      recipientId: data.recipientId,
      title: data.title,
      message: data.message,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.notification.create({
    data,
  });
}

async function createShuttleBookingIfMissing(data: {
  employeeId: string;
  routeId?: string;
  pickupStopId?: string;
  bookingDate: Date;
  shiftType: ShiftType;
  pickupArea: string;
  pickupAddress?: string;
  seatNumber?: string;
  status: ShuttleBookingStatus;
  remarks?: string;
}) {
  const existing = await prisma.shuttleBooking.findFirst({
    where: {
      employeeId: data.employeeId,
      bookingDate: data.bookingDate,
      shiftType: data.shiftType,
      pickupArea: data.pickupArea,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.shuttleBooking.create({
    data,
  });
}

async function createExpenseClaimIfMissing(data: {
  employeeId: string;
  travelRequestId?: string;
  category: ExpenseCategory;
  claimDate: Date;
  vendorName: string;
  amount: number;
  status: ExpenseClaimStatus;
  payrollSyncStatus: PayrollSyncStatus;
}) {
  const existing = await prisma.expenseClaim.findFirst({
    where: {
      employeeId: data.employeeId,
      vendorName: data.vendorName,
      amount: data.amount,
      claimDate: data.claimDate,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.expenseClaim.create({
    data: {
      employeeId: data.employeeId,
      travelRequestId: data.travelRequestId,
      category: data.category,
      claimDate: data.claimDate,
      vendorName: data.vendorName,
      amount: data.amount,
      currency: "PKR",
      description: "Demo approved expense claim for FYP-II testing",
      receiptUrl: "/uploads/receipts/demo-receipt.pdf",
      ocrVendorName: data.vendorName,
      ocrDate: data.claimDate.toISOString(),
      ocrAmount: data.amount,
      anomalyStatus:
        data.amount > 5000
          ? ExpenseAnomalyStatus.ANOMALY_REVIEW_REQUIRED
          : ExpenseAnomalyStatus.NORMAL,
      anomalyReason:
        data.amount > 5000
          ? "Demo claim amount is above normal review threshold"
          : undefined,
      status: data.status,
      financeRemarks: "Demo finance approval completed",
      payrollSyncStatus: data.payrollSyncStatus,
    },
  });
}

async function upsertPolicyRule(data: {
  ruleName: string;
  ruleCode: string;
  ruleType: PolicyRuleType;
  hrGrade?: HRGrade;
  maxAmount?: number;
  requiresManagerApproval?: boolean;
  requiresFinanceApproval?: boolean;
  requiresTransportApproval?: boolean;
  requiresAccommodationApproval?: boolean;
  allowEmergencyOverride?: boolean;
  cutoffHoursBeforeShift?: number;
  internalFirstRequired?: boolean;
  description?: string;
}) {
  return prisma.policyRule.upsert({
    where: {
      ruleCode: data.ruleCode,
    },
    update: data,
    create: data,
  });
}

export async function seedDemoData() {
  const [
    admin,
    employee,
    manager,
    transportAdmin,
    accommodationAdmin,
    financeOfficer,
    driverUser,
    securityOfficer,
  ] = await Promise.all([
    ensureUser({
      fullName: "Demo Super Admin",
      email: "admin@indusconnect.com",
      phone: "03000000001",
      role: RoleName.SUPER_ADMIN,
      employeeCode: "IC-ADMIN-001",
      department: "IT",
      hrGrade: HRGrade.EXECUTIVE,
    }),

    ensureUser({
      fullName: "Demo Employee",
      email: "employee@indusconnect.com",
      phone: "03000000002",
      role: RoleName.EMPLOYEE,
      employeeCode: "IC-EMP-001",
      department: "Operations",
      hrGrade: HRGrade.STAFF,
    }),

    ensureUser({
      fullName: "Demo Manager",
      email: "manager@indusconnect.com",
      phone: "03000000003",
      role: RoleName.MANAGER,
      employeeCode: "IC-MGR-001",
      department: "Operations",
      hrGrade: HRGrade.MANAGER,
    }),

    ensureUser({
      fullName: "Demo Transport Admin",
      email: "transport@indusconnect.com",
      phone: "03000000004",
      role: RoleName.TRANSPORT_ADMIN,
      employeeCode: "IC-TRN-001",
      department: "Transport",
      hrGrade: HRGrade.OFFICER,
    }),

    ensureUser({
      fullName: "Demo Accommodation Admin",
      email: "accommodation@indusconnect.com",
      phone: "03000000005",
      role: RoleName.ACCOMMODATION_ADMIN,
      employeeCode: "IC-ACC-001",
      department: "Accommodation",
      hrGrade: HRGrade.OFFICER,
    }),

    ensureUser({
      fullName: "Demo Finance Officer",
      email: "finance@indusconnect.com",
      phone: "03000000006",
      role: RoleName.FINANCE_OFFICER,
      employeeCode: "IC-FIN-001",
      department: "Finance",
      hrGrade: HRGrade.OFFICER,
    }),

    ensureUser({
      fullName: "Demo Driver",
      email: "driver@indusconnect.com",
      phone: "03000000007",
      role: RoleName.DRIVER,
      employeeCode: "IC-DRV-001",
      department: "Transport",
      hrGrade: HRGrade.SUPPORT_STAFF,
    }),

    ensureUser({
      fullName: "Demo Security Officer",
      email: "security@indusconnect.com",
      phone: "03000000008",
      role: RoleName.SECURITY_OFFICER,
      employeeCode: "IC-SEC-001",
      department: "Security",
      hrGrade: HRGrade.OFFICER,
    }),
  ]);

  const vendor = await prisma.vendor.upsert({
    where: {
      vendorName: "Karachi Corporate Transport Services",
    },
    update: {
      status: VendorStatus.ACTIVE,
      contractType: VendorContractType.PER_TRIP,
    },
    create: {
      vendorName: "Karachi Corporate Transport Services",
      contactPerson: "Mr. Vendor Manager",
      phone: "03001234567",
      email: "vendor@transport.com",
      address: "Shahrah-e-Faisal, Karachi",
      contractType: VendorContractType.PER_TRIP,
      status: VendorStatus.ACTIVE,
      contractStartDate: new Date("2026-07-01"),
      contractEndDate: new Date("2027-06-30"),
      notes: "Demo outsourced fleet vendor for FYP-II",
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: {
      vehicleNumber: "DEMO-VAN-001",
    },
    update: {
      status: VehicleStatus.ACTIVE,
      fitnessStatus: FitnessStatus.VALID,
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      ownershipType: OwnershipType.VENDOR,
    },
    create: {
      vehicleNumber: "DEMO-VAN-001",
      vehicleType: VehicleType.VAN,
      capacity: 12,
      ownershipType: OwnershipType.VENDOR,
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      status: VehicleStatus.ACTIVE,
      fitnessStatus: FitnessStatus.VALID,
      notes: "Demo vendor vehicle for FYP-II",
    },
  });

  const driver = await prisma.driver.upsert({
    where: {
      userId: driverUser.id,
    },
    update: {
      status: "ASSIGNED",
      vehicleId: vehicle.id,
    },
    create: {
      userId: driverUser.id,
      licenseNumber: "DEMO-LIC-001",
      cnic: "42101-0000000-1",
      address: "Karachi",
      status: "ASSIGNED",
      vehicleId: vehicle.id,
    },
  });

  const route = await prisma.transportRoute.upsert({
    where: {
      routeCode: "DEMO-GW-KOR-001",
    },
    update: {
      vehicleId: vehicle.id,
      driverId: driver.id,
      vendorId: vendor.id,
      status: RouteStatus.ACTIVE,
    },
    create: {
      routeName: "Garden West to Korangi Campus",
      routeCode: "DEMO-GW-KOR-001",
      shiftType: ShiftType.MORNING,
      routeDate: new Date("2026-07-25"),
      startTime: "08:00",
      endTime: "09:00",
      startLocation: "Garden West",
      endLocation: "Korangi Campus",
      vehicleId: vehicle.id,
      driverId: driver.id,
      vendorId: vendor.id,
      status: RouteStatus.ACTIVE,
      notes: "Demo active route with smart stops",
    },
  });

  const stop1 = await prisma.smartStop.upsert({
    where: {
      routeId_stopOrder: {
        routeId: route.id,
        stopOrder: 1,
      },
    },
    update: {
      stopName: "Garden West Stop",
      latitude: 24.8765,
      longitude: 67.0321,
      estimatedTime: "08:00",
    },
    create: {
      routeId: route.id,
      stopName: "Garden West Stop",
      stopOrder: 1,
      latitude: 24.8765,
      longitude: 67.0321,
      estimatedTime: "08:00",
    },
  });

  await prisma.smartStop.upsert({
    where: {
      routeId_stopOrder: {
        routeId: route.id,
        stopOrder: 2,
      },
    },
    update: {
      stopName: "Saddar Stop",
      latitude: 24.8607,
      longitude: 67.0104,
      estimatedTime: "08:20",
    },
    create: {
      routeId: route.id,
      stopName: "Saddar Stop",
      stopOrder: 2,
      latitude: 24.8607,
      longitude: 67.0104,
      estimatedTime: "08:20",
    },
  });

  await prisma.smartStop.upsert({
    where: {
      routeId_stopOrder: {
        routeId: route.id,
        stopOrder: 3,
      },
    },
    update: {
      stopName: "Korangi Campus Gate",
      latitude: 24.8138,
      longitude: 67.1209,
      estimatedTime: "09:00",
    },
    create: {
      routeId: route.id,
      stopName: "Korangi Campus Gate",
      stopOrder: 3,
      latitude: 24.8138,
      longitude: 67.1209,
      estimatedTime: "09:00",
    },
  });

  const shuttleBooking = await createShuttleBookingIfMissing({
    employeeId: employee.id,
    routeId: route.id,
    pickupStopId: stop1.id,
    bookingDate: new Date("2026-07-25"),
    shiftType: ShiftType.MORNING,
    pickupArea: "Garden West",
    pickupAddress: "Near Bagh-e-Halar Hall",
    seatNumber: "A-01",
    status: ShuttleBookingStatus.ASSIGNED,
    remarks: "Demo assigned shuttle booking",
  });

  const trip = await prisma.transportTrip.findFirst({
    where: {
      routeId: route.id,
      driverId: driver.id,
    },
  });

  const transportTrip =
    trip ??
    (await prisma.transportTrip.create({
      data: {
        routeId: route.id,
        driverId: driver.id,
        status: "IN_PROGRESS",
        fuelChecked: true,
        tiresChecked: true,
        brakesChecked: true,
        lightsChecked: true,
        checklistSubmittedAt: new Date(),
        startedAt: new Date(),
      },
    }));

  await prisma.vehicleTelemetryLog.create({
    data: {
      driverId: driver.id,
      vehicleId: vehicle.id,
      routeId: route.id,
      transportTripId: transportTrip.id,
      latitude: 24.8607,
      longitude: 67.0104,
      speed: 35,
      heading: 120,
      status: TelemetryStatus.MOVING,
      source: TelemetrySource.MOCK_GPS,
      batteryLevel: 85,
      accuracy: 8,
      remarks: "Demo live GPS ping",
    },
  });

  const travelRequest = await prisma.travelRequest.findFirst({
    where: {
      employeeId: employee.id,
      purpose: "Official meeting at Lahore site",
    },
  });

  const approvedTravelRequest =
    travelRequest ??
    (await prisma.travelRequest.create({
      data: {
        employeeId: employee.id,
        travelType: TravelType.INTER_CITY,
        urgency: TravelUrgency.NORMAL,
        purpose: "Official meeting at Lahore site",
        fromLocation: "Karachi",
        toLocation: "Lahore",
        departureDate: new Date("2026-07-28"),
        returnDate: new Date("2026-07-30"),
        accommodationRequired: true,
        transportRequired: true,
        estimatedBudget: 25000,
        status: TravelRequestStatus.APPROVED,
        approvedById: manager.id,
        decisionRemarks: "Approved for demo official meeting",
        decidedAt: new Date(),
        employeeRemarks: "Demo approved travel request",
      },
    }));

  const room = await prisma.room.upsert({
    where: {
      roomNumber: "GH-101",
    },
    update: {
      status: RoomStatus.AVAILABLE,
    },
    create: {
      roomNumber: "GH-101",
      roomType: RoomType.SINGLE,
      capacity: 1,
      location: "IHHN Guest House Karachi",
      floor: "1st Floor",
      status: RoomStatus.AVAILABLE,
      notes: "Demo guest house room",
    },
  });

  const reservation = await prisma.roomReservation.upsert({
    where: {
      travelRequestId: approvedTravelRequest.id,
    },
    update: {
      roomId: room.id,
      status: ReservationStatus.CONFIRMED,
    },
    create: {
      travelRequestId: approvedTravelRequest.id,
      employeeId: employee.id,
      accommodationType: AccommodationType.INTERNAL_GUEST_HOUSE,
      roomId: room.id,
      checkInDate: new Date("2026-07-28"),
      checkOutDate: new Date("2026-07-30"),
      status: ReservationStatus.CONFIRMED,
      remarks: "Demo internal-first room reservation",
    },
  });

  const expenseClaim = await createExpenseClaimIfMissing({
    employeeId: employee.id,
    travelRequestId: approvedTravelRequest.id,
    category: ExpenseCategory.MEAL,
    claimDate: new Date("2026-07-29"),
    vendorName: "Demo Restaurant Lahore",
    amount: 3500,
    status: ExpenseClaimStatus.APPROVED,
    payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
  });

  const vendorBill = await prisma.vendorBill.upsert({
    where: {
      billNumber: "VB-DEMO-001",
    },
    update: {
      status: VendorBillStatus.APPROVED,
      payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
    },
    create: {
      vendorId: vendor.id,
      routeId: route.id,
      billNumber: "VB-DEMO-001",
      billDate: new Date("2026-07-25"),
      amount: 15000,
      currency: "PKR",
      description: "Demo vendor trip billing",
      status: VendorBillStatus.APPROVED,
      financeRemarks: "Demo bill approved for ERP export",
      approvedAt: new Date(),
      payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
    },
  });

  await upsertPolicyRule({
    ruleName: "Staff Inter-City Travel Approval Policy",
    ruleCode: "DEMO-TRAVEL-STAFF-001",
    ruleType: PolicyRuleType.TRAVEL_APPROVAL,
    hrGrade: HRGrade.STAFF,
    maxAmount: 30000,
    requiresManagerApproval: true,
    requiresFinanceApproval: true,
    requiresTransportApproval: true,
    requiresAccommodationApproval: true,
    allowEmergencyOverride: true,
    description: "Demo staff travel approval policy",
  });

  await upsertPolicyRule({
    ruleName: "Meal Expense Review Limit",
    ruleCode: "DEMO-EXP-MEAL-001",
    ruleType: PolicyRuleType.EXPENSE_LIMIT,
    hrGrade: HRGrade.STAFF,
    maxAmount: 5000,
    requiresFinanceApproval: true,
    description: "Demo expense limit policy",
  });

  await upsertPolicyRule({
    ruleName: "Internal First Accommodation Policy",
    ruleCode: "DEMO-ACC-INTERNAL-001",
    ruleType: PolicyRuleType.ACCOMMODATION_FALLBACK,
    internalFirstRequired: true,
    requiresAccommodationApproval: true,
    description: "Demo internal-first accommodation policy",
  });

  await upsertPolicyRule({
    ruleName: "Shuttle Booking Cut-Off Policy",
    ruleCode: "DEMO-TRANS-CUTOFF-001",
    ruleType: PolicyRuleType.TRANSPORT_CUTOFF,
    cutoffHoursBeforeShift: 12,
    requiresTransportApproval: true,
    description: "Demo transport cut-off policy",
  });

  const maintenanceTask = await prisma.vehicleMaintenanceTask.findFirst({
    where: {
      vehicleId: vehicle.id,
      title: "Demo routine vehicle inspection",
    },
  });

  if (!maintenanceTask) {
    await prisma.vehicleMaintenanceTask.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        transportTripId: transportTrip.id,
        reportedById: transportAdmin.id,
        taskType: MaintenanceTaskType.INSPECTION,
        priority: MaintenancePriority.NORMAL,
        status: MaintenanceTaskStatus.OPEN,
        title: "Demo routine vehicle inspection",
        description: "Demo maintenance task for defence testing",
      },
    });
  }

  const housekeepingTask = await prisma.housekeepingTask.findFirst({
    where: {
      roomId: room.id,
      title: "Demo room cleaning task",
    },
  });

  if (!housekeepingTask) {
    await prisma.housekeepingTask.create({
      data: {
        roomId: room.id,
        reservationId: reservation.id,
        createdById: accommodationAdmin.id,
        taskType: HousekeepingTaskType.ROOM_CLEANING,
        priority: HousekeepingPriority.NORMAL,
        status: HousekeepingTaskStatus.PENDING,
        title: "Demo room cleaning task",
        description: "Demo housekeeping task for defence testing",
      },
    });
  }

  await createNotificationIfMissing({
    recipientId: employee.id,
    createdById: admin.id,
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.NORMAL,
    title: "Welcome to IndusConnect",
    message: "Your demo employee profile is ready for FYP-II testing.",
    entityType: "User",
    entityId: employee.id,
  });

  await createNotificationIfMissing({
    recipientId: transportAdmin.id,
    createdById: admin.id,
    type: NotificationType.SHUTTLE,
    priority: NotificationPriority.HIGH,
    title: "Demo Route Ready",
    message: "Garden West to Korangi Campus route is ready for testing.",
    entityType: "TransportRoute",
    entityId: route.id,
  });

  await createNotificationIfMissing({
    recipientId: securityOfficer.id,
    createdById: admin.id,
    type: NotificationType.SOS,
    priority: NotificationPriority.URGENT,
    title: "Demo Emergency Alert",
    message: "This is a sample SOS notification for emergency dashboard testing.",
    entityType: "TransportTrip",
    entityId: transportTrip.id,
  });

  return {
    credentials: {
      passwordForAllDemoUsers: DEMO_PASSWORD,
      users: [
        "admin@indusconnect.com",
        "employee@indusconnect.com",
        "manager@indusconnect.com",
        "transport@indusconnect.com",
        "accommodation@indusconnect.com",
        "finance@indusconnect.com",
        "driver@indusconnect.com",
        "security@indusconnect.com",
      ],
    },
    createdOrUpdated: {
      users: 8,
      vendor: vendor.vendorName,
      vehicle: vehicle.vehicleNumber,
      driver: driver.id,
      route: route.routeCode,
      shuttleBooking: shuttleBooking.id,
      travelRequest: approvedTravelRequest.id,
      room: room.roomNumber,
      reservation: reservation.id,
      expenseClaim: expenseClaim.id,
      vendorBill: vendorBill.billNumber,
      transportTrip: transportTrip.id,
    },
  };
}

export async function getDemoSummary() {
  const [
    users,
    vehicles,
    drivers,
    routes,
    shuttleBookings,
    travelRequests,
    rooms,
    reservations,
    expenseClaims,
    vendors,
    vendorBills,
    telemetryLogs,
    notifications,
    policies,
    maintenanceTasks,
    housekeepingTasks,
    payrollExports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.driver.count(),
    prisma.transportRoute.count(),
    prisma.shuttleBooking.count(),
    prisma.travelRequest.count(),
    prisma.room.count(),
    prisma.roomReservation.count(),
    prisma.expenseClaim.count(),
    prisma.vendor.count(),
    prisma.vendorBill.count(),
    prisma.vehicleTelemetryLog.count(),
    prisma.notification.count(),
    prisma.policyRule.count(),
    prisma.vehicleMaintenanceTask.count(),
    prisma.housekeepingTask.count(),
    prisma.payrollExport.count(),
  ]);

  return {
    users,
    vehicles,
    drivers,
    routes,
    shuttleBookings,
    travelRequests,
    rooms,
    reservations,
    expenseClaims,
    vendors,
    vendorBills,
    telemetryLogs,
    notifications,
    policies,
    maintenanceTasks,
    housekeepingTasks,
    payrollExports,
  };
}

export async function getDemoChecklist() {
  return {
    loginUsers: [
      {
        role: "SUPER_ADMIN",
        email: "admin@indusconnect.com",
        password: DEMO_PASSWORD,
      },
      {
        role: "EMPLOYEE",
        email: "employee@indusconnect.com",
        password: DEMO_PASSWORD,
      },
      {
        role: "MANAGER",
        email: "manager@indusconnect.com",
        password: DEMO_PASSWORD,
      },
      {
        role: "TRANSPORT_ADMIN",
        email: "transport@indusconnect.com",
        password: DEMO_PASSWORD,
      },
      {
        role: "ACCOMMODATION_ADMIN",
        email: "accommodation@indusconnect.com",
        password: DEMO_PASSWORD,
      },
      {
        role: "FINANCE_OFFICER",
        email: "finance@indusconnect.com",
        password: DEMO_PASSWORD,
      },
      {
        role: "DRIVER",
        email: "driver@indusconnect.com",
        password: DEMO_PASSWORD,
      },
      {
        role: "SECURITY_OFFICER",
        email: "security@indusconnect.com",
        password: DEMO_PASSWORD,
      },
    ],
    recommendedDemoFlow: [
      "Login as admin",
      "Call POST /api/demo/seed",
      "Open /api/frontend/bootstrap",
      "Open /api/reports/dashboard",
      "Open /api/telemetry/live",
      "Open /api/maintenance/vehicle-tasks/open",
      "Open /api/maintenance/housekeeping-tasks/pending",
      "Login as employee and open /api/notifications/my",
      "Login as finance and test /api/erp-exports/expense-claims",
    ],
  };
}