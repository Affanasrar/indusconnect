import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  addSmartStopController,
  cancelRouteController,
  createRouteController,
  deleteSmartStopController,
  getAllRoutesController,
  getRouteByIdController,
  updateRouteController,
  updateSmartStopController,
} from "./route.controller";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"));

router.get("/", getAllRoutesController);
router.get("/:id", getRouteByIdController);
router.post("/", createRouteController);
router.patch("/:id", updateRouteController);
router.patch("/:id/cancel", cancelRouteController);

router.post("/:routeId/stops", addSmartStopController);
router.patch("/stops/:stopId", updateSmartStopController);
router.delete("/stops/:stopId", deleteSmartStopController);

export default router;