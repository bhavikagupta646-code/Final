"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function BackendTest() {
  const [message, setMessage] = useState("Connecting...");
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  async function testConnection() {
    setLoading(true);
    setIsError(false);
    setMessage("Connecting...");

    try {
      const data = await apiRequest("/health");
      setMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Backend connection failed"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <main style={{ padding: "30px", fontFamily: "sans-serif" }}>
      <h1>HealthShield Backend Test</h1>
      <p>
        Target Endpoint:{" "}
        <code>
          {(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1") + "/health"}
        </code>
      </p>

      <h3 style={{ color: loading ? "#0f5c5c" : isError ? "#dc2626" : "#059669" }}>
        Status: {loading ? "Connecting..." : isError ? "Failed" : "Connected"}
      </h3>

      <pre
        style={{
          background: "#f1f5f9",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
        }}
      >
        {message}
      </pre>

      <button
        type="button"
        onClick={testConnection}
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          background: "#0f5c5c",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Retry Connection
      </button>
    </main>
  );
}
