"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Building2, ShieldCheck, X, ArrowRight, Lock, Key } from "lucide-react";
import { portalConfig } from "../../config/portalConfig";
import { apiClient } from "../../lib/apiClient";

interface AuthModalProps {
  isOpen: boolean;
  initialRole?: "patient" | "hospital" | "insurer";
  initialMode?: "login" | "register";
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialRole = "patient",
  initialMode = "login",
  onClose,
}) => {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "hospital" | "insurer">(initialRole);
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [insurerName, setInsurerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentPortal = portalConfig.portals[role];

  const handleQuickFill = () => {
    setError(null);
    setEmail(currentPortal.demoCredentials.email);
    setPassword(currentPortal.demoCredentials.password);
    if (role === "hospital" && currentPortal.demoCredentials.hospitalId) {
      setHospitalId(currentPortal.demoCredentials.hospitalId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await apiClient.login({
          email,
          password,
          role: role.toUpperCase() as "PATIENT" | "HOSPITAL" | "INSURER",
          hospitalId: role === "hospital" ? hospitalId || "HOSP-METRO-001" : undefined,
        });
      } else {
        await apiClient.register({
          email,
          password,
          role: role.toUpperCase() as "PATIENT" | "HOSPITAL" | "INSURER",
          fullName: fullName || undefined,
          hospitalName: hospitalName || undefined,
          licenseNumber: licenseNumber || undefined,
          insurerName: insurerName || undefined,
        });
      }

      // Successful auth -> navigate to role dashboard
      router.push(currentPortal.routes.dashboard);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hs-modal-backdrop" onClick={onClose}>
      <div
        className="hs-modal-panel max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="hs-modal-close"
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Role Tabs */}
        <div className="flex border-b border-slate-200 mb-6 pb-2 gap-2">
          {(["patient", "hospital", "insurer"] as const).map((r) => {
            const isSelected = role === r;
            const p = portalConfig.portals[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {r === "patient" && <User className="w-3.5 h-3.5" />}
                {r === "hospital" && <Building2 className="w-3.5 h-3.5" />}
                {r === "insurer" && <ShieldCheck className="w-3.5 h-3.5" />}
                <span className="capitalize">{r}</span>
              </button>
            );
          })}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            {mode === "login" ? `Sign In to ${currentPortal.title}` : `Create ${currentPortal.title} Account`}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{currentPortal.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && role === "patient" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alice Walker"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                required
              />
            </div>
          )}

          {mode === "register" && role === "hospital" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="Metro General Hospital"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="HOSP-NY-99210"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  required
                />
              </div>
            </>
          )}

          {mode === "register" && role === "insurer" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Insurer Organization Name</label>
              <input
                type="text"
                value={insurerName}
                onChange={(e) => setInsurerName(e.target.value)}
                placeholder="Aegis Mutual Health"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={currentPortal.demoCredentials.email}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              required
            />
          </div>

          {mode === "login" && role === "hospital" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital ID (Optional)</label>
              <input
                type="text"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                placeholder="HOSP-METRO-001"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                "Processing Cryptographic Credentials..."
              ) : (
                <>
                  <span>{mode === "login" ? "Authenticate & Enter" : "Register Cryptographic Account"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo Quick Fill & Mode Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-xs text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 py-1.5 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Key className="w-3 h-3" />
            <span>Quick Fill {currentPortal.title} Demo Credentials</span>
          </button>

          <div className="text-center text-xs text-slate-500">
            {mode === "login" ? (
              <>
                Need a new account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-bold text-teal-700 hover:underline"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-bold text-teal-700 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
