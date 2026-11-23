import { Router } from "express";
import { SSEController } from "../controllers/sse.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stream", authenticate, SSEController.streamEvents);

export default router;
