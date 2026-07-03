import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createDriverController,
  deactivateDriverController,
  getAllDriversController,
  getDriverByIdController,
  updateDriverController,
} from "./driver.controller";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"));

router.get("/", getAllDriversController);
router.get("/:id", getDriverByIdController);
router.post("/", createDriverController);
router.patch("/:id", updateDriverController);
router.patch("/:id/deactivate", deactivateDriverController);

export default router;