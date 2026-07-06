import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createPolicyRuleController,
  deactivatePolicyRuleController,
  evaluateAccommodationPolicyController,
  evaluateExpenseClaimPolicyController,
  evaluateShuttleBookingPolicyController,
  evaluateTravelRequestPolicyController,
  getActivePolicyRulesController,
  getAllPolicyRulesController,
  getPolicyDecisionLogsController,
  getPolicyRuleByIdController,
  updatePolicyRuleController,
} from "./policy.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN"),
  createPolicyRuleController
);

router.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "MANAGER",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "FINANCE_OFFICER"
  ),
  getAllPolicyRulesController
);

router.get(
  "/active",
  authorizeRoles(
    "SUPER_ADMIN",
    "MANAGER",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "FINANCE_OFFICER"
  ),
  getActivePolicyRulesController
);

router.get(
  "/decision-logs",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getPolicyDecisionLogsController
);

router.get(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "MANAGER",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "FINANCE_OFFICER"
  ),
  getPolicyRuleByIdController
);

router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN"),
  updatePolicyRuleController
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("SUPER_ADMIN"),
  deactivatePolicyRuleController
);

router.post(
  "/evaluate/travel-requests/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  evaluateTravelRequestPolicyController
);

router.post(
  "/evaluate/expense-claims/:id",
  authorizeRoles("SUPER_ADMIN", "FINANCE_OFFICER"),
  evaluateExpenseClaimPolicyController
);

router.post(
  "/evaluate/shuttle-bookings/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN"),
  evaluateShuttleBookingPolicyController
);

router.post(
  "/evaluate/accommodation/:travelRequestId",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "ACCOMMODATION_ADMIN"),
  evaluateAccommodationPolicyController
);

export default router;