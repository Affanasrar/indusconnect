import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  getAllAuditLogsController,
  getAuditLogByIdController,
  getMyAuditLogsController,
} from "./auditLog.controller";

const router = Router();

router.use(authMiddleware);

router.get("/my", getMyAuditLogsController);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN"),
  getAllAuditLogsController
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN"),
  getAuditLogByIdController
);

export default router;