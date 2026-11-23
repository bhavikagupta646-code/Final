import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";
import { SSEService } from "./services/sse.service";
import authRoutes from "./routes/auth.routes";
import recordRoutes from "./routes/record.routes";
import claimRoutes from "./routes/claim.routes";
import sseRoutes from "./routes/sse.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Dynamic multi-origin CORS
const allowedOrigins = ENV.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Health check endpoint
app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "HEALTHY",
    service: "HealthShield API Backend",
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
});

// Mount Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/records", recordRoutes);
app.use("/api/v1/claims", claimRoutes);
app.use("/api/v1/sse", sseRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    SSEService.initialize();
    const server = app.listen(ENV.PORT, "0.0.0.0", () => {
      console.log(`[HealthShield Backend] Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode.`);
    });
    server.on("error", (err: any) => {
      console.error("[HealthShield Backend] Server error:", err);
    });
  });
}

export default app;
