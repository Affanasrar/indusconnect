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
router.use(authorizeRoles("SUPER_ADMIN"));

router.get("/", getAllUsersController);
router.get("/:id", getUserByIdController);
router.post("/", createUserController);
router.patch("/:id", updateUserController);

export default router;