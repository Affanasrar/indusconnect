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
router.use(authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"));

router.get("/", getAllVehiclesController);
router.get("/:id", getVehicleByIdController);
router.post("/", createVehicleController);
router.patch("/:id", updateVehicleController);
router.patch("/:id/deactivate", deactivateVehicleController);

export default router;