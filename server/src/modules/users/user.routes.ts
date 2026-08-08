import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
} from "./user.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", authorizeRoles("SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN", "ACCOMMODATION_ADMIN", "FINANCE_OFFICER"), getAllUsersController);
router.get("/:id", authorizeRoles("SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN", "ACCOMMODATION_ADMIN", "FINANCE_OFFICER"), getUserByIdController);
router.post("/", authorizeRoles("SUPER_ADMIN"), createUserController);
router.patch("/:id", authorizeRoles("SUPER_ADMIN"), updateUserController);

export default router;