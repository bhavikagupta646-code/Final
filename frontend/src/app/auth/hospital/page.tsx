"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Lock, Mail, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

export default function HospitalAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("hospital@healthshield.dev");
  const [password, setPassword] = useState("HealthShield2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", {
        role: "hospital",
        email: email.trim().toLowerCase(),
        password,
      });
      const user = data.data.user;
      const accessToken = data.data.accessToken;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

      router.push("/hospital/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div>
          <Link href="/home" className="text-slate-400 hover:text-slate-700 text-xs inline-flex items-center space-x-1 mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Hospital Portal Gateway</h2>
          <p className="text-xs text-slate-500 mt-1">Accredited Clinical Encounter Authoring</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Hospital Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Hospital Portal</span>}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">New Hospital Entity?</span>
          <Link href="/auth/hospital/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Register Hospital &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
