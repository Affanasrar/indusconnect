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

router.post(
  "/",
  authorizeRoles("EMPLOYEE", "MANAGER", "SUPER_ADMIN"),
  receiptUpload.single("receipt"),
  createExpenseClaimController
);

router.get("/my", getMyExpenseClaimsController);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getAllExpenseClaimsController
);

router.get(
  "/pending",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getPendingExpenseClaimsController
);

router.get(
  "/flagged",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getFlaggedExpenseClaimsController
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getExpenseClaimByIdController
);

router.patch(
  "/:id/approve",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  approveExpenseClaimController
);

router.patch(
  "/:id/reject",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  rejectExpenseClaimController
);

router.patch(
  "/:id/flag",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  flagExpenseClaimController
);

router.patch(
  "/:id/export",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  exportExpenseClaimController
);

router.patch("/:id/cancel", cancelExpenseClaimController);

export default router;