import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  getAccommodationSummaryController,
  getDashboardSummaryController,
  getExpenseSummaryController,
  getMyDashboardSummaryController,
  getPendingApprovalsSummaryController,
  getTransportSummaryController,
  getTravelSummaryController,
} from "./report.controller";

const router = Router();

router.use(authMiddleware);

router.get("/my", getMyDashboardSummaryController);

router.get(
  "/dashboard",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getDashboardSummaryController
);

router.get(
  "/pending-approvals",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "FINANCE_OFFICER"),
  getPendingApprovalsSummaryController
);

router.get(
  "/transport",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN"),
  getTransportSummaryController
);

router.get(
  "/travel",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN", "ACCOMMODATION_ADMIN"),
  getTravelSummaryController
);

router.get(
  "/accommodation",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "ACCOMMODATION_ADMIN"),
  getAccommodationSummaryController
);

router.get(
  "/expenses",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "FINANCE_OFFICER"),
  getExpenseSummaryController
);

export default router;