import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "HOSPITAL" | "INSURER" | "ADMIN";
  walletAddress: string;
  policyNumber?: string;
  hospitalId?: string;
  insurerId?: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("healthshield_user");
    const token = localStorage.getItem("healthshield_access_token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      localStorage.removeItem("healthshield_access_token");
      localStorage.removeItem("healthshield_user");
      setUser(null);
      router.push("/login");
    }
  };

  return {
    user,
    role: user?.role,
    isAuthenticated: !!user,
    loading,
    logout,
  };
}
