import {
  ExpenseAnomalyStatus,
  ExpenseClaimStatus,
  ReservationStatus,
  RoomStatus,
  ShuttleBookingStatus,
  TravelRequestStatus,
  TripStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";

export async function getDashboardSummary() {
  const [
    totalUsers,
    totalVehicles,
    totalDrivers,
    totalRoutes,
    totalShuttleBookings,
    totalTravelRequests,
    totalRooms,
    totalReservations,
    totalExpenseClaims,

    pendingTravelRequests,
    approvedTravelRequests,
    rejectedTravelRequests,

    pendingExpenseClaims,
    approvedExpenseClaims,
    rejectedExpenseClaims,
    flaggedExpenseClaims,

    availableRooms,
    occupiedRooms,
    confirmedReservations,

    activeTrips,
    completedTrips,

    totalVendors,
    totalVendorBills,

    totalTelemetryLogs,
    emergencyTelemetryEvents,

    totalNotifications,
    unreadNotifications,
    urgentNotifications,

    totalProxyTravelRequests,
    totalProxyShuttleBookings,

    totalPolicyRules,
    totalPolicyDecisionLogs,

    totalVehicleMaintenanceTasks,
    openVehicleMaintenanceTasks,
    totalHousekeepingTasks,
    pendingHousekeepingTasks,

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
    prisma.vehicleTelemetryLog.count({
      where: {
        status: {
          in: ["SOS", "BREAKDOWN"],
        },
      },
    }),

    prisma.travelRequest.count({
      where: {
        isProxyRequest: true,
      },
    }),
    prisma.shuttleBooking.count({
      where: {
        isProxyBooking: true,
      },
    }),

    prisma.travelRequest.count({
      where: {
        status: TravelRequestStatus.PENDING,
      },
    }),
    prisma.travelRequest.count({
      where: {
        status: TravelRequestStatus.APPROVED,
      },
    }),
    prisma.travelRequest.count({
      where: {
        status: TravelRequestStatus.REJECTED,
      },
    }),
    
    prisma.expenseClaim.count({
      where: {
        status: ExpenseClaimStatus.PENDING,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        status: ExpenseClaimStatus.APPROVED,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        status: ExpenseClaimStatus.REJECTED,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        OR: [
          {
            status: ExpenseClaimStatus.FLAGGED,
          },
          {
            anomalyStatus: ExpenseAnomalyStatus.ANOMALY_REVIEW_REQUIRED,
          },
        ],
      },
    }),
    prisma.vehicleMaintenanceTask.count(),
prisma.vehicleMaintenanceTask.count({
  where: {
    status: {
      in: ["OPEN", "IN_PROGRESS"],
    },
  },
}),
prisma.housekeepingTask.count(),
prisma.housekeepingTask.count({
  where: {
    status: {
      in: ["PENDING", "IN_PROGRESS"],
    },
  },
}),

    prisma.room.count({
      where: {
        status: RoomStatus.AVAILABLE,
      },
    }),
    prisma.room.count({
      where: {
        status: RoomStatus.OCCUPIED,
      },
    }),
    prisma.policyRule.count(),
    prisma.policyDecisionLog.count(),
    prisma.roomReservation.count({
      where: {
        status: ReservationStatus.CONFIRMED,
      },
    }),
    

    prisma.transportTrip.count({
      where: {
        status: TripStatus.IN_PROGRESS,
      },
    }),
    prisma.transportTrip.count({
      where: {
        status: TripStatus.COMPLETED,
      },
    }),
    prisma.notification.count(),
    prisma.notification.count({
  where: {
    status: "UNREAD",
  },
}),
prisma.notification.count({
  where: {
    status: "UNREAD",
    priority: "URGENT",
  },
}),
  ]);

  return {
    totals: {
      users: totalUsers,
      vehicles: totalVehicles,
      drivers: totalDrivers,
      routes: totalRoutes,
      shuttleBookings: totalShuttleBookings,
      travelRequests: totalTravelRequests,
      rooms: totalRooms,
      reservations: totalReservations,
      expenseClaims: totalExpenseClaims,
      vendors: totalVendors,
      endorBills: totalVendorBills,
      telemetryLogs: totalTelemetryLogs,
      notifications: totalNotifications,
      policyRules: totalPolicyRules,
      policyDecisionLogs: totalPolicyDecisionLogs,
    },
    travel: {
      pending: pendingTravelRequests,
      approved: approvedTravelRequests,
      rejected: rejectedTravelRequests,
    },
    expenses: {
      pending: pendingExpenseClaims,
      approved: approvedExpenseClaims,
      rejected: rejectedExpenseClaims,
      flagged: flaggedExpenseClaims,
    },
    accommodation: {
      availableRooms,
      occupiedRooms,
      confirmedReservations,
    },
    telemetry: {
      emergencyEvents: emergencyTelemetryEvents,
    },
    trips: {
      active: activeTrips,
      completed: completedTrips,
    },
    notifications: {
      unread: unreadNotifications,
      urgent: urgentNotifications,
    },
    proxyBookings: {
      travelRequests: totalProxyTravelRequests,
      shuttleBookings: totalProxyShuttleBookings,
      total: totalProxyTravelRequests + totalProxyShuttleBookings,
    },
    maintenance: {
      vehicleTasks: totalVehicleMaintenanceTasks,
      openVehicleTasks: openVehicleMaintenanceTasks,
      housekeepingTasks: totalHousekeepingTasks,
      pendingHousekeepingTasks,
    },
  };
}

export async function getPendingApprovalsSummary() {
  const [
    pendingTravelRequests,
    pendingExpenseClaims,
    flaggedExpenseClaims,
    pendingShuttleBookings,
  ] = await Promise.all([
    prisma.travelRequest.findMany({
      where: {
        status: TravelRequestStatus.PENDING,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.expenseClaim.findMany({
      where: {
        status: ExpenseClaimStatus.PENDING,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        travelRequest: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.expenseClaim.findMany({
      where: {
        OR: [
          {
            status: ExpenseClaimStatus.FLAGGED,
          },
          {
            anomalyStatus: ExpenseAnomalyStatus.ANOMALY_REVIEW_REQUIRED,
          },
        ],
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        travelRequest: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.shuttleBooking.findMany({
      where: {
        status: ShuttleBookingStatus.PENDING,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        route: true,
        pickupStop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    counts: {
      pendingTravelRequests: pendingTravelRequests.length,
      pendingExpenseClaims: pendingExpenseClaims.length,
      flaggedExpenseClaims: flaggedExpenseClaims.length,
      pendingShuttleBookings: pendingShuttleBookings.length,
    },
    pendingTravelRequests,
    pendingExpenseClaims,
    flaggedExpenseClaims,
    pendingShuttleBookings,
  };
}

export async function getTransportSummary() {
  const [
    totalVehicles,
    totalDrivers,
    totalRoutes,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    noShowBookings,
    activeTrips,
    completedTrips,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.driver.count(),
    prisma.transportRoute.count(),
    prisma.shuttleBooking.count(),

    prisma.shuttleBooking.count({
      where: {
        status: ShuttleBookingStatus.PENDING,
      },
    }),
    prisma.shuttleBooking.count({
      where: {
        status: ShuttleBookingStatus.CONFIRMED,
      },
    }),
    prisma.shuttleBooking.count({
      where: {
        status: ShuttleBookingStatus.COMPLETED,
      },
    }),
    prisma.shuttleBooking.count({
      where: {
        status: ShuttleBookingStatus.NO_SHOW,
      },
    }),

    prisma.transportTrip.count({
      where: {
        status: TripStatus.IN_PROGRESS,
      },
    }),
    prisma.transportTrip.count({
      where: {
        status: TripStatus.COMPLETED,
      },
    }),
  ]);

  return {
    vehicles: totalVehicles,
    drivers: totalDrivers,
    routes: totalRoutes,
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      noShow: noShowBookings,
    },
    trips: {
      active: activeTrips,
      completed: completedTrips,
    },
  };
}

export async function getTravelSummary() {
  const [
    total,
    pending,
    approved,
    rejected,
    cancelled,
    recentRequests,
  ] = await Promise.all([
    prisma.travelRequest.count(),
    prisma.travelRequest.count({
      where: {
        status: TravelRequestStatus.PENDING,
      },
    }),
    prisma.travelRequest.count({
      where: {
        status: TravelRequestStatus.APPROVED,
      },
    }),
    prisma.travelRequest.count({
      where: {
        status: TravelRequestStatus.REJECTED,
      },
    }),
    prisma.travelRequest.count({
      where: {
        status: TravelRequestStatus.CANCELLED,
      },
    }),
    prisma.travelRequest.findMany({
      take: 10,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    counts: {
      total,
      pending,
      approved,
      rejected,
      cancelled,
    },
    recentRequests,
  };
}

export async function getAccommodationSummary() {
  const [
    totalRooms,
    availableRooms,
    occupiedRooms,
    maintenanceRooms,
    totalReservations,
    confirmedReservations,
    checkedInReservations,
    checkedOutReservations,
    cancelledReservations,
    recentReservations,
  ] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({
      where: {
        status: RoomStatus.AVAILABLE,
      },
    }),
    prisma.room.count({
      where: {
        status: RoomStatus.OCCUPIED,
      },
    }),
    prisma.room.count({
      where: {
        status: RoomStatus.MAINTENANCE,
      },
    }),

    prisma.roomReservation.count(),
    prisma.roomReservation.count({
      where: {
        status: ReservationStatus.CONFIRMED,
      },
    }),
    prisma.roomReservation.count({
      where: {
        status: ReservationStatus.CHECKED_IN,
      },
    }),
    prisma.roomReservation.count({
      where: {
        status: ReservationStatus.CHECKED_OUT,
      },
    }),
    prisma.roomReservation.count({
      where: {
        status: ReservationStatus.CANCELLED,
      },
    }),

    prisma.roomReservation.findMany({
      take: 10,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        travelRequest: true,
        room: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    rooms: {
      total: totalRooms,
      available: availableRooms,
      occupied: occupiedRooms,
      maintenance: maintenanceRooms,
    },
    reservations: {
      total: totalReservations,
      confirmed: confirmedReservations,
      checkedIn: checkedInReservations,
      checkedOut: checkedOutReservations,
      cancelled: cancelledReservations,
    },
    recentReservations,
  };
}

export async function getExpenseSummary() {
  const [
    total,
    pending,
    approved,
    rejected,
    flagged,
    cancelled,
    approvedAmount,
    pendingAmount,
    recentClaims,
  ] = await Promise.all([
    prisma.expenseClaim.count(),
    prisma.expenseClaim.count({
      where: {
        status: ExpenseClaimStatus.PENDING,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        status: ExpenseClaimStatus.APPROVED,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        status: ExpenseClaimStatus.REJECTED,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        OR: [
          {
            status: ExpenseClaimStatus.FLAGGED,
          },
          {
            anomalyStatus: ExpenseAnomalyStatus.ANOMALY_REVIEW_REQUIRED,
          },
        ],
      },
    }),
    prisma.expenseClaim.count({
      where: {
        status: ExpenseClaimStatus.CANCELLED,
      },
    }),

    prisma.expenseClaim.aggregate({
      where: {
        status: ExpenseClaimStatus.APPROVED,
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.expenseClaim.aggregate({
      where: {
        status: ExpenseClaimStatus.PENDING,
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.expenseClaim.findMany({
      take: 10,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        travelRequest: true,
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    counts: {
      total,
      pending,
      approved,
      rejected,
      flagged,
      cancelled,
    },
    amounts: {
      approvedAmount: approvedAmount._sum.amount ?? 0,
      pendingAmount: pendingAmount._sum.amount ?? 0,
    },
    recentClaims,
  };
}

export async function getMyDashboardSummary(userId: string) {
  const [
    myShuttleBookings,
    myTravelRequests,
    myRoomReservations,
    myExpenseClaims,
    myPendingTravelRequests,
    myApprovedTravelRequests,
    myPendingExpenseClaims,
    myApprovedExpenseClaims,
    recentTravelRequests,
    recentExpenseClaims,
  ] = await Promise.all([
    prisma.shuttleBooking.count({
      where: {
        employeeId: userId,
      },
    }),
    prisma.travelRequest.count({
      where: {
        employeeId: userId,
      },
    }),
    prisma.roomReservation.count({
      where: {
        employeeId: userId,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        employeeId: userId,
      },
    }),

    prisma.travelRequest.count({
      where: {
        employeeId: userId,
        status: TravelRequestStatus.PENDING,
      },
    }),
    prisma.travelRequest.count({
      where: {
        employeeId: userId,
        status: TravelRequestStatus.APPROVED,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        employeeId: userId,
        status: ExpenseClaimStatus.PENDING,
      },
    }),
    prisma.expenseClaim.count({
      where: {
        employeeId: userId,
        status: ExpenseClaimStatus.APPROVED,
      },
    }),

    prisma.travelRequest.findMany({
      where: {
        employeeId: userId,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.expenseClaim.findMany({
      where: {
        employeeId: userId,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    counts: {
      shuttleBookings: myShuttleBookings,
      travelRequests: myTravelRequests,
      roomReservations: myRoomReservations,
      expenseClaims: myExpenseClaims,
    },
    travel: {
      pending: myPendingTravelRequests,
      approved: myApprovedTravelRequests,
    },
    expenses: {
      pending: myPendingExpenseClaims,
      approved: myApprovedExpenseClaims,
    },
    recentTravelRequests,
    recentExpenseClaims,
  };
}