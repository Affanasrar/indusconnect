const fs = require("fs");

const fixes = [
  {
    file: "src/modules/accommodation/accommodation.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/audit-logs/auditLog.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/drivers/driver.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/erp-exports/erpExport.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/expenses/expense.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/maintenance/maintenance.controller.ts",
    replace: [
      [/String\(req\.params\.\)/g, "String(req.params.id)"],
      [/createHousekeepingTaskAfterCheckout\(\s*String\(req\.params\.id\)/g, "createHousekeepingTaskAfterCheckout(\n      String(req.params.reservationId)"],
    ],
  },
  {
    file: "src/modules/notifications/notification.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/policies/policy.controller.ts",
    replace: [
      [/String\(req\.params\.\)/g, "String(req.params.id)"],
      [/evaluateAccommodationPolicy\(String\(req\.params\.id\)\)/g, "evaluateAccommodationPolicy(String(req.params.travelRequestId))"],
    ],
  },
  {
    file: "src/modules/routes/route.controller.ts",
    replace: [
      [/getRouteById\(String\(req\.params\.\)\)/g, "getRouteById(String(req.params.id))"],
      [/updateRoute\(String\(req\.params\.\),/g, "updateRoute(String(req.params.id),"],
      [/cancelRoute\(String\(req\.params\.\)\)/g, "cancelRoute(String(req.params.id))"],
      [/addSmartStop\(String\(req\.params\.\),/g, "addSmartStop(String(req.params.routeId),"],
      [/updateSmartStop\(String\(req\.params\.\),/g, "updateSmartStop(String(req.params.stopId),"],
      [/deleteSmartStop\(String\(req\.params\.\)\)/g, "deleteSmartStop(String(req.params.stopId))"],
    ],
  },
  {
    file: "src/modules/shuttle-bookings/shuttleBooking.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/telemetry/telemetry.controller.ts",
    replace: [
      [/getTelemetryByRoute\(String\(req\.params\.\)\)/g, "getTelemetryByRoute(String(req.params.routeId))"],
      [/getTelemetryByDriver\(String\(req\.params\.\)\)/g, "getTelemetryByDriver(String(req.params.driverId))"],
    ],
  },
  {
    file: "src/modules/travel-requests/travelRequest.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/users/user.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/vehicles/vehicle.controller.ts",
    replace: [[/String\(req\.params\.\)/g, "String(req.params.id)"]],
  },
  {
    file: "src/modules/vendors/vendor.controller.ts",
    replace: [
      [/getVendorById\(String\(req\.params\.\)\)/g, "getVendorById(String(req.params.id))"],
      [/updateVendor\(String\(req\.params\.\),/g, "updateVendor(String(req.params.id),"],
      [/deactivateVendor\(String\(req\.params\.\)\)/g, "deactivateVendor(String(req.params.id))"],
      [/assignVendorToVehicle\(\s*String\(req\.params\.\),/g, "assignVendorToVehicle(\n      String(req.params.vehicleId),"],
      [/assignVendorToRoute\(String\(req\.params\.\),/g, "assignVendorToRoute(String(req.params.routeId),"],
      [/getVendorBillById\(String\(req\.params\.\)\)/g, "getVendorBillById(String(req.params.id))"],
      [/approveVendorBill\(String\(req\.params\.\),/g, "approveVendorBill(String(req.params.id),"],
      [/rejectVendorBill\(String\(req\.params\.\),/g, "rejectVendorBill(String(req.params.id),"],
      [/markVendorBillAsPaid\(String\(req\.params\.\)\)/g, "markVendorBillAsPaid(String(req.params.id))"],
    ],
  },
];

for (const item of fixes) {
  if (!fs.existsSync(item.file)) {
    console.log("Missing:", item.file);
    continue;
  }

  let content = fs.readFileSync(item.file, "utf8");

  for (const [pattern, replacement] of item.replace) {
    content = content.replace(pattern, replacement);
  }

  fs.writeFileSync(item.file, content);
  console.log("Fixed:", item.file);
}