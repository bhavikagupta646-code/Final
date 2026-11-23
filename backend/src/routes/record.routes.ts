import { Router } from "express";
import { RecordController } from "../controllers/record.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { UserRole } from "../constants/roles";

const router = Router();

router.use(authenticate);

// Hospital only creates records
router.post("/", requireRole(UserRole.HOSPITAL, UserRole.ADMIN), RecordController.createRecord);

// Patient, Hospital, Admin view records (Insurer strictly excluded)
router.get("/", requireRole(UserRole.PATIENT, UserRole.HOSPITAL, UserRole.ADMIN), RecordController.getRecords);

// Authorized decrypt
router.get("/:recordId/decrypt", requireRole(UserRole.PATIENT, UserRole.HOSPITAL, UserRole.ADMIN), RecordController.decryptRecord);

export default router;
