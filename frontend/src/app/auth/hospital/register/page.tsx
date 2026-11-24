"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Lock, Mail, ShieldCheck, FileBadge, User, KeyRound, AlertCircle, Loader2, Check, Wallet, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

export default function HospitalRegisterPage() {
  const router = useRouter();

  const [hospitalName, setHospitalName] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [registrationLicenseNo, setRegistrationLicenseNo] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Password Strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = ["bg-rose-400", "bg-amber-400", "bg-yellow-400", "bg-emerald-500", "bg-emerald-600"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPass = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPass !== trimmedConfirm) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (trimmedPass.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    const trimmedWallet = walletAddress.trim();
    if (trimmedWallet && !/^0x[a-fA-F0-9]{40}$/.test(trimmedWallet)) {
      setError("Leave empty to auto-generate a wallet, or enter a valid 0x... Ethereum address");
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        role: "HOSPITAL",
        hospitalName: hospitalName.trim(),
        hospitalId: hospitalId.trim(),
        registrationLicenseNo: registrationLicenseNo.trim(),
        staffName: staffName.trim(),
        staffId: staffId.trim(),
        email: email.trim().toLowerCase(),
        password: trimmedPass,
      };

      if (trimmedWallet) {
        payload.walletAddress = trimmedWallet;
      }

      const { data } = await api.post("/auth/register", payload);
      const user = data.data.user;
      const accessToken = data.data.accessToken;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

      router.push("/hospital/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please check entries.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex bg-emerald-600 text-white p-3 rounded-2xl mb-4 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Accredited Hospital Registration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative clinical encounter authoring & automated cryptographic key generation
          </p>
        </div>

        {/* Highlight Badge */}
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs">
          <KeyRound className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">Auto-provisions BabyJubjub EdDSA Signing Keys & On-Chain Registry Verification</span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hospital Name *
              </label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="City General Hospital"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hospital ID (Entity Code) *
              </label>
              <input
                type="text"
                required
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                placeholder="e.g., HOSP-2026-01"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Medical License No. *
              </label>
              <div className="relative">
                <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={registrationLicenseNo}
                  onChange={(e) => setRegistrationLicenseNo(e.target.value)}
                  placeholder="LIC-MED-9921"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Staff / Doctor Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Dr. Alexander Wright"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Staff / Physician ID *
              </label>
              <input
                type="text"
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="STAFF-4091"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Institutional Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hospital.org"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hospital Ethereum Wallet (Optional)
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Leave empty to auto-generate a wallet, or enter a valid 0x... Ethereum address"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono transition"
                />
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Leave empty to auto-generate a wallet, or enter a valid 0x... Ethereum address
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
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
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Strength:</span>
                    <span className="font-semibold text-slate-700">{strengthLabels[strength]}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthColors[strength]} transition-all duration-300`}
                      style={{ width: `${(strength / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password.trim() === confirmPassword.trim() && (
                <span className="text-xs text-emerald-600 mt-1 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl text-sm transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Register Hospital & Provision Keys</span>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-between">
          <span>Already registered your Hospital?</span>
          <Link href="/auth/hospital" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign In Here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
