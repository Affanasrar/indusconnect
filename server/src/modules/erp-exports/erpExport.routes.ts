import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createCombinedPayrollExportController,
  createExpenseClaimsExportController,
  createTravelAllowancesExportController,
  createVendorBillsExportController,
  downloadPayrollExportCsvController,
  getAllPayrollExportsController,
  getPayrollExportByIdController,
  markPayrollExportAsFailedController,
  markPayrollExportAsSyncedController,
} from "./erpExport.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/expense-claims",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  createExpenseClaimsExportController
);

router.post(
  "/vendor-bills",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  createVendorBillsExportController
);

router.post(
  "/travel-allowances",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  createTravelAllowancesExportController
);

router.post(
  "/combined",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  createCombinedPayrollExportController
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getAllPayrollExportsController
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getPayrollExportByIdController
);

router.get(
  "/:id/download-csv",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  downloadPayrollExportCsvController
);

router.patch(
  "/:id/synced",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  markPayrollExportAsSyncedController
);

router.patch(
  "/:id/failed",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  markPayrollExportAsFailedController
);

export default router;