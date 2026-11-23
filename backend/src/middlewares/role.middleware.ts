import { Request, Response, NextFunction } from "express";
import { UserRole } from "../constants/roles";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        type: "https://healthshield.io/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "User is not authenticated.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        type: "https://healthshield.io/errors/forbidden",
        title: "Forbidden",
        status: 403,
        detail: `Access denied. Endpoint requires one of roles: [${allowedRoles.join(", ")}]. Current role: '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}
