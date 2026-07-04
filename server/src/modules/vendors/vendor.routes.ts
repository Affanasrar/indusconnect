import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  approveVendorBillController,
  assignVendorToRouteController,
  assignVendorToVehicleController,
  createVendorBillController,
  createVendorController,
  deactivateVendorController,
  getActiveVendorsController,
  getAllVendorBillsController,
  getAllVendorsController,
  getPendingVendorBillsController,
  getVendorBillByIdController,
  getVendorByIdController,
  payVendorBillController,
  rejectVendorBillController,
  updateVendorController,
} from "./vendor.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  createVendorController
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "FINANCE_OFFICER"),
  getAllVendorsController
);

router.get(
  "/active",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  getActiveVendorsController
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "FINANCE_OFFICER"),
  getVendorByIdController
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  updateVendorController
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  deactivateVendorController
);

router.patch(
  "/vehicles/:vehicleId/assign",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  assignVendorToVehicleController
);

router.patch(
  "/routes/:routeId/assign",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  assignVendorToRouteController
);

router.post(
  "/bills",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  createVendorBillController
);

router.get(
  "/bills/all",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "FINANCE_OFFICER"),
  getAllVendorBillsController
);

router.get(
  "/bills/pending",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getPendingVendorBillsController
);

router.get(
  "/bills/:id",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "FINANCE_OFFICER"),
  getVendorBillByIdController
);

router.patch(
  "/bills/:id/approve",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  approveVendorBillController
);

router.patch(
  "/bills/:id/reject",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  rejectVendorBillController
);

router.patch(
  "/bills/:id/pay",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  payVendorBillController
);

export default router;