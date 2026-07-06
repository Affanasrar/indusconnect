import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import testRoutes from "./modules/test/test.routes";
import userRoutes from "./modules/users/user.routes";
import vehicleRoutes from "./modules/vehicles/vehicle.routes";
import driverRoutes from "./modules/drivers/driver.routes";
import routeRoutes from "./modules/routes/route.routes";
import shuttleBookingRoutes from "./modules/shuttle-bookings/shuttleBooking.routes";
import driverTripRoutes from "./modules/driver-trips/driverTrip.routes";
import travelRequestRoutes from "./modules/travel-requests/travelRequest.routes";
import accommodationRoutes from "./modules/accommodation/accommodation.routes";
import path from "path";
import expenseRoutes from "./modules/expenses/expense.routes";
import reportRoutes from "./modules/reports/report.routes";
import { auditMiddleware } from "./middleware/audit.middleware";
import auditLogRoutes from "./modules/audit-logs/auditLog.routes";
import vendorRoutes from "./modules/vendors/vendor.routes";
import telemetryRoutes from "./modules/telemetry/telemetry.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import proxyBookingRoutes from "./modules/proxy-bookings/proxyBooking.routes";
import policyRoutes from "./modules/policies/policy.routes";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes";
import erpExportRoutes from "./modules/erp-exports/erpExport.routes";
import frontendSupportRoutes from "./modules/frontend-support/frontendSupport.routes";
import demoDataRoutes from "./modules/demo/demoData.routes";
import healthRoutes from "./modules/health/health.routes";
import {
  globalErrorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware";
import apiDocsRoutes from "./modules/api-docs/apiDocs.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(auditMiddleware);
app.use("/api/health", healthRoutes);
app.use("/api/docs", apiDocsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/shuttle-bookings", shuttleBookingRoutes);
app.use("/api/driver-trips", driverTripRoutes);
app.use("/api/travel-requests", travelRequestRoutes);
app.use("/api/accommodation", accommodationRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/proxy-bookings", proxyBookingRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/erp-exports", erpExportRoutes);
app.use("/api/frontend", frontendSupportRoutes);
app.use("/api/demo", demoDataRoutes);
app.use(notFoundMiddleware);
app.use(globalErrorMiddleware);


app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "IndusConnect API is running successfully",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "IndusConnect Backend",
  });
});

export default app;