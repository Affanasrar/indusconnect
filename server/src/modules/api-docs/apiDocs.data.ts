export const apiDocs = {
  project: "IndusConnect",
  title: "IndusConnect Backend API Documentation",
  version: "1.0.0",
  baseUrl: "http://localhost:5000/api",

  authentication: {
    type: "Bearer Token",
    header: "Authorization: Bearer YOUR_TOKEN_HERE",
    loginEndpoint: "POST /api/auth/login",
  },

  demoCredentials: {
    password: "Demo@123",
    users: [
      {
        role: "SUPER_ADMIN",
        email: "admin@indusconnect.com",
      },
      {
        role: "EMPLOYEE",
        email: "employee@indusconnect.com",
      },
      {
        role: "MANAGER",
        email: "manager@indusconnect.com",
      },
      {
        role: "TRANSPORT_ADMIN",
        email: "transport@indusconnect.com",
      },
      {
        role: "ACCOMMODATION_ADMIN",
        email: "accommodation@indusconnect.com",
      },
      {
        role: "FINANCE_OFFICER",
        email: "finance@indusconnect.com",
      },
      {
        role: "DRIVER",
        email: "driver@indusconnect.com",
      },
      {
        role: "SECURITY_OFFICER",
        email: "security@indusconnect.com",
      },
    ],
  },

  modules: [
    {
      name: "Health",
      endpoints: [
        {
          method: "GET",
          path: "/api/health",
          roles: ["PUBLIC"],
          description: "Check backend and database health.",
        },
      ],
    },
    {
      name: "Auth",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/login",
          roles: ["PUBLIC"],
          description: "Login and receive JWT token.",
        },
        {
          method: "GET",
          path: "/api/auth/me",
          roles: ["AUTHENTICATED"],
          description: "Get logged-in user profile.",
        },
      ],
    },
    {
      name: "Frontend Support",
      endpoints: [
        {
          method: "GET",
          path: "/api/frontend/bootstrap",
          roles: ["AUTHENTICATED"],
          description: "Get role-based frontend bootstrap data.",
        },
        {
          method: "GET",
          path: "/api/frontend/me",
          roles: ["AUTHENTICATED"],
          description: "Get current profile.",
        },
        {
          method: "GET",
          path: "/api/frontend/menu",
          roles: ["AUTHENTICATED"],
          description: "Get role-based menu.",
        },
        {
          method: "GET",
          path: "/api/frontend/permissions",
          roles: ["AUTHENTICATED"],
          description: "Get role permissions.",
        },
        {
          method: "GET",
          path: "/api/frontend/form-options",
          roles: ["AUTHENTICATED"],
          description: "Get enums and form options.",
        },
        {
          method: "GET",
          path: "/api/frontend/dashboard-cards",
          roles: ["AUTHENTICATED"],
          description: "Get dashboard card metadata.",
        },
      ],
    },
    {
      name: "Users",
      endpoints: [
        {
          method: "GET",
          path: "/api/users",
          roles: ["SUPER_ADMIN"],
          description: "List users.",
        },
        {
          method: "POST",
          path: "/api/users",
          roles: ["SUPER_ADMIN"],
          description: "Create user.",
        },
        {
          method: "GET",
          path: "/api/users/:id",
          roles: ["SUPER_ADMIN"],
          description: "Get user by ID.",
        },
        {
          method: "PATCH",
          path: "/api/users/:id",
          roles: ["SUPER_ADMIN"],
          description: "Update user.",
        },
      ],
    },
    {
      name: "Transport",
      endpoints: [
        {
          method: "GET",
          path: "/api/vehicles",
          roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
          description: "List vehicles.",
        },
        {
          method: "GET",
          path: "/api/drivers",
          roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
          description: "List drivers.",
        },
        {
          method: "GET",
          path: "/api/routes",
          roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
          description: "List transport routes.",
        },
        {
          method: "POST",
          path: "/api/routes/:routeId/stops",
          roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
          description: "Add smart stop to route.",
        },
      ],
    },
    {
      name: "Shuttle Booking",
      endpoints: [
        {
          method: "POST",
          path: "/api/shuttle-bookings",
          roles: ["EMPLOYEE"],
          description: "Create shuttle booking.",
        },
        {
          method: "GET",
          path: "/api/shuttle-bookings/my",
          roles: ["EMPLOYEE"],
          description: "Get my shuttle bookings.",
        },
        {
          method: "PATCH",
          path: "/api/shuttle-bookings/:id/assign",
          roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN"],
          description: "Assign route, smart stop, and seat.",
        },
      ],
    },
    {
      name: "Driver Trips",
      endpoints: [
        {
          method: "GET",
          path: "/api/driver-trips/routes",
          roles: ["DRIVER"],
          description: "Get assigned driver routes.",
        },
        {
          method: "GET",
          path: "/api/driver-trips/manifest/:routeId",
          roles: ["DRIVER"],
          description: "Get route passenger manifest.",
        },
        {
          method: "POST",
          path: "/api/driver-trips/:routeId/checklist",
          roles: ["DRIVER"],
          description: "Submit pre-trip checklist.",
        },
        {
          method: "POST",
          path: "/api/driver-trips/:routeId/start",
          roles: ["DRIVER"],
          description: "Start trip.",
        },
        {
          method: "POST",
          path: "/api/driver-trips/:routeId/end",
          roles: ["DRIVER"],
          description: "End trip.",
        },
      ],
    },
    {
      name: "Travel Requests",
      endpoints: [
        {
          method: "POST",
          path: "/api/travel-requests",
          roles: ["EMPLOYEE", "MANAGER", "SUPER_ADMIN"],
          description: "Create travel request.",
        },
        {
          method: "GET",
          path: "/api/travel-requests/my",
          roles: ["EMPLOYEE"],
          description: "Get my travel requests.",
        },
        {
          method: "PATCH",
          path: "/api/travel-requests/:id/approve",
          roles: ["SUPER_ADMIN", "MANAGER"],
          description: "Approve travel request.",
        },
        {
          method: "PATCH",
          path: "/api/travel-requests/:id/reject",
          roles: ["SUPER_ADMIN", "MANAGER"],
          description: "Reject travel request.",
        },
      ],
    },
    {
      name: "Accommodation",
      endpoints: [
        {
          method: "GET",
          path: "/api/accommodation/rooms",
          roles: ["SUPER_ADMIN", "ACCOMMODATION_ADMIN"],
          description: "List rooms.",
        },
        {
          method: "POST",
          path: "/api/accommodation/reservations/internal-first",
          roles: ["SUPER_ADMIN", "ACCOMMODATION_ADMIN"],
          description: "Create internal room reservation.",
        },
        {
          method: "POST",
          path: "/api/accommodation/reservations/external-hotel",
          roles: ["SUPER_ADMIN", "ACCOMMODATION_ADMIN"],
          description: "Create external hotel reservation.",
        },
      ],
    },
    {
      name: "Expenses",
      endpoints: [
        {
          method: "POST",
          path: "/api/expenses",
          roles: ["EMPLOYEE"],
          description: "Create expense claim.",
        },
        {
          method: "GET",
          path: "/api/expenses/my",
          roles: ["EMPLOYEE"],
          description: "Get my expense claims.",
        },
        {
          method: "PATCH",
          path: "/api/expenses/:id/approve",
          roles: ["SUPER_ADMIN", "FINANCE_OFFICER"],
          description: "Approve expense claim.",
        },
        {
          method: "PATCH",
          path: "/api/expenses/:id/reject",
          roles: ["SUPER_ADMIN", "FINANCE_OFFICER"],
          description: "Reject expense claim.",
        },
      ],
    },
    {
      name: "Telemetry",
      endpoints: [
        {
          method: "POST",
          path: "/api/telemetry/update",
          roles: ["DRIVER"],
          description: "Send driver GPS location.",
        },
        {
          method: "GET",
          path: "/api/telemetry/live",
          roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN", "SECURITY_OFFICER"],
          description: "View latest live vehicle locations.",
        },
        {
          method: "GET",
          path: "/api/telemetry/emergency",
          roles: ["SUPER_ADMIN", "TRANSPORT_ADMIN", "SECURITY_OFFICER"],
          description: "View SOS and breakdown events.",
        },
      ],
    },
    {
      name: "ERP Exports",
      endpoints: [
        {
          method: "POST",
          path: "/api/erp-exports/expense-claims",
          roles: ["SUPER_ADMIN", "FINANCE_OFFICER"],
          description: "Generate expense claims export.",
        },
        {
          method: "POST",
          path: "/api/erp-exports/vendor-bills",
          roles: ["SUPER_ADMIN", "FINANCE_OFFICER"],
          description: "Generate vendor bills export.",
        },
        {
          method: "POST",
          path: "/api/erp-exports/combined",
          roles: ["SUPER_ADMIN", "FINANCE_OFFICER"],
          description: "Generate combined payroll export.",
        },
      ],
    },
    {
      name: "Demo",
      endpoints: [
        {
          method: "POST",
          path: "/api/demo/seed",
          roles: ["SUPER_ADMIN"],
          description: "Generate defence-ready demo data.",
        },
        {
          method: "GET",
          path: "/api/demo/summary",
          roles: ["SUPER_ADMIN", "MANAGER"],
          description: "View demo data summary.",
        },
      ],
    },
  ],

  recommendedTestingFlow: [
    "GET /api/health",
    "POST /api/auth/login",
    "POST /api/demo/seed",
    "GET /api/frontend/bootstrap",
    "GET /api/reports/dashboard",
    "GET /api/telemetry/live",
    "GET /api/maintenance/vehicle-tasks/open",
    "GET /api/maintenance/housekeeping-tasks/pending",
    "GET /api/frontend/form-options",
  ],
};