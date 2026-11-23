import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const status = err.status || 500;
  const title = err.title || err.name || "Internal Server Error";
  const detail = err.detail || err.message || "An unexpected system error occurred.";
  const type = err.type || "https://healthshield.io/errors/internal-error";

  console.error(`[Error] ${req.method} ${req.originalUrl} - Status: ${status}:`, err);

  res.status(status).json({
    type,
    title,
    status,
    detail,
    instance: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
