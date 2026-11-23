const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000/api/v1";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken")
  );
}

async function safeParseJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<any> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include", // Required for HttpOnly refresh token cookies
    headers,
  });

  // Automatically attempt silent token refresh once on 401 Unauthorized
  if (
    response.status === 401 &&
    retryOn401 &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/refresh")
  ) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (refreshRes.ok) {
        const refreshData = await safeParseJson(refreshRes);
        if (refreshData.accessToken && typeof window !== "undefined") {
          localStorage.setItem("accessToken", refreshData.accessToken);
        }
        return apiRequest(endpoint, options, false);
      }
    } catch {
      // Refresh failed; fall through to standard error handling
    }
  }

  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
}