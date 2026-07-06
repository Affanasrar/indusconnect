import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  getAccommodationDropdownsController,
  getCurrentProfileController,
  getDashboardCardsController,
  getFinanceDropdownsController,
  getFormOptionsController,
  getFrontendBootstrapController,
  getRoleMenuController,
  getRolePermissionsController,
  getTransportDropdownsController,
  getUserDropdownsController,
} from "./frontendSupport.controller";

const router = Router();

router.use(authMiddleware);

router.get("/bootstrap", getFrontendBootstrapController);
router.get("/me", getCurrentProfileController);
router.get("/menu", getRoleMenuController);
router.get("/permissions", getRolePermissionsController);
router.get("/form-options", getFormOptionsController);
router.get("/dashboard-cards", getDashboardCardsController);

router.get(
  "/dropdowns/users",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getUserDropdownsController
);

router.get(
  "/dropdowns/transport",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "MANAGER"),
  getTransportDropdownsController
);

router.get(
  "/dropdowns/accommodation",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN", "MANAGER"),
  getAccommodationDropdownsController
);

router.get(
  "/dropdowns/finance",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  getFinanceDropdownsController
);

export default router;