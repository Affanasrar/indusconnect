import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  getDemoChecklistController,
  getDemoSummaryController,
  seedDemoDataController,
} from "./demoData.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/seed",
  authorizeRoles("SUPER_ADMIN"),
  seedDemoDataController
);

router.get(
  "/summary",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getDemoSummaryController
);

router.get(
  "/checklist",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getDemoChecklistController
);

export default router;