import { Request, Response } from "express";
import { SSEService } from "../services/sse.service";

export class SSEController {
  static streamEvents(req: Request, res: Response): void {
    const user = req.user!;
    const clientId = `${user.walletAddress}-${Date.now()}`;
    SSEService.addClient(clientId, user.walletAddress, res);
  }
}
