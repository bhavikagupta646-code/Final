import { useEffect, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

interface SSEEvent {
  event: string;
  data: any;
  timestamp: string;
}

export function useSSE(token?: string) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
    if (!authToken) return;

    const controller = new AbortController();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

    fetchEventSource(`${API_URL}/sse/stream`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      signal: controller.signal,
      async onopen(response) {
        if (response.ok) {
          setIsConnected(true);
        }
      },
      onmessage(ev) {
        if (!ev.data) return;
        try {
          const parsed = JSON.parse(ev.data);
          setEvents((prev) => [
            {
              event: ev.event || "message",
              data: parsed,
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 49),
          ]);
        } catch {
          // ignore non-json pings
        }
      },
      onclose() {
        setIsConnected(false);
      },
      onerror(err) {
        console.warn("[useSSE] Connection error:", err);
      },
    });

    return () => {
      controller.abort();
      setIsConnected(false);
    };
  }, [token]);

  return { isConnected, events };
}
