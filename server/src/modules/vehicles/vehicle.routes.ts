import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createVehicleController,
  deactivateVehicleController,
  getAllVehiclesController,
  getVehicleByIdController,
  updateVehicleController,
} from "./vehicle.controller";

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
  "DRIVER",
];

router.get("/", authorizeRoles(...allStaffRoles), getAllVehiclesController);
router.get("/:id", authorizeRoles(...allStaffRoles), getVehicleByIdController);
router.post("/", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"), createVehicleController);
router.patch("/:id", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"), updateVehicleController);
router.patch("/:id/deactivate", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"), deactivateVehicleController);

export default router;