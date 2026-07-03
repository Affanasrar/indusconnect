import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";

const router = Router();

router.get(
  "/admin-only",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  (_req, res) => {
    res.json({
      success: true,
      message: "You are allowed to access SUPER_ADMIN route.",
    });
  }
);

router.get(
  "/transport-only",
  authMiddleware,
  authorizeRoles("TRANSPORT_ADMIN"),
  (_req, res) => {
    res.json({
      success: true,
      message: "You are allowed to access TRANSPORT_ADMIN route.",
    });
  }
);

router.get(
  "/employee-only",
  authMiddleware,
  authorizeRoles("EMPLOYEE"),
  (_req, res) => {
    res.json({
      success: true,
      message: "You are allowed to access EMPLOYEE route.",
    });
  }
);

export default router;