import { Router } from "express";
import { ClaimController } from "../controllers/claim.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { UserRole } from "../constants/roles";

const router = Router();

router.use(authenticate);

// Patient submits claim
router.post("/", requireRole(UserRole.PATIENT, UserRole.ADMIN), ClaimController.submitClaim);

// View claims (sanitized by role)
router.get("/", ClaimController.getClaims);

// Insurer settles claim
router.put("/:claimId/settle", requireRole(UserRole.INSURER, UserRole.ADMIN), ClaimController.settleClaim);

export default router;
