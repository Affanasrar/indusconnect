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

router.get("/", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "DRIVER"), getAllVehiclesController);
router.get("/:id", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "DRIVER"), getVehicleByIdController);
router.post("/", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"), createVehicleController);
router.patch("/:id", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"), updateVehicleController);
router.patch("/:id/deactivate", authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"), deactivateVehicleController);

export default router;