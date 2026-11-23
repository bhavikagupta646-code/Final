import { Response } from "express";

interface SSEClient {
  id: string;
  walletAddress: string;
  res: Response;
}

export class SSEService {
  private static clients: SSEClient[] = [];
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  static initialize(): void {
    if (!this.heartbeatInterval) {
      // 20-second heartbeat to keep HTTP connections alive through proxies & Render/Vercel
      this.heartbeatInterval = setInterval(() => {
        this.broadcastPing();
      }, 20000);
      this.heartbeatInterval.unref();
    }
  }

  static addClient(id: string, walletAddress: string, res: Response): void {
    // Set proper SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    res.write(`data: ${JSON.stringify({ type: "CONNECTED", walletAddress })}\n\n`);

    const client: SSEClient = { id, walletAddress: walletAddress.toLowerCase(), res };
    this.clients.push(client);

    res.on("close", () => {
      this.removeClient(id);
    });
  }

  static removeClient(id: string): void {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  static sendToUser(walletAddress: string, event: string, payload: any): void {
    const target = walletAddress.toLowerCase();
    const matching = this.clients.filter((c) => c.walletAddress === target);
    for (const client of matching) {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  static broadcast(event: string, payload: any): void {
    for (const client of this.clients) {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  private static broadcastPing(): void {
    for (const client of this.clients) {
      client.res.write(`:ping ${Date.now()}\n\n`);
    }
  }
}
