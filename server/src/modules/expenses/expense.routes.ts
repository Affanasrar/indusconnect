import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import { receiptUpload } from "../../middleware/upload.middleware";
import {
  approveExpenseClaimController,
  cancelExpenseClaimController,
  createExpenseClaimController,
  exportExpenseClaimController,
  flagExpenseClaimController,
  getAllExpenseClaimsController,
  getExpenseClaimByIdController,
  getFlaggedExpenseClaimsController,
  getMyExpenseClaimsController,
  getPendingExpenseClaimsController,
  rejectExpenseClaimController,
} from "./expense.controller";

const router = Router();

router.use(authMiddleware);

const allStaffRoles = [
  "EMPLOYEE",
  "MANAGER",
  "TRANSPORT_ADMIN",
  "ACCOMMODATION_ADMIN",
  "FINANCE_OFFICER",
  "SECURITY_OFFICER",
  "SUPER_ADMIN",
];

router.post(
  "/",
  authorizeRoles(...allStaffRoles),
  receiptUpload.single("receipt"),
  createExpenseClaimController
);

router.get("/my", getMyExpenseClaimsController);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER", "MANAGER"),
  getAllExpenseClaimsController
);

router.get(
  "/pending",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER", "MANAGER"),
  getPendingExpenseClaimsController
);

router.get(
  "/flagged",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER", "MANAGER"),
  getFlaggedExpenseClaimsController
);

router.get(
  "/:id",
  authorizeRoles(...allStaffRoles),
  getExpenseClaimByIdController
);

router.patch(
  "/:id/approve",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER", "MANAGER"),
  approveExpenseClaimController
);

router.patch(
  "/:id/reject",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER", "MANAGER"),
  rejectExpenseClaimController
);

router.patch(
  "/:id/flag",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER", "MANAGER"),
  flagExpenseClaimController
);

router.patch(
  "/:id/export",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  exportExpenseClaimController
);

router.patch("/:id/cancel", cancelExpenseClaimController);

export default router;