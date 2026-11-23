import Link from "next/link";
import { Shield, Activity, FileText, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";

export default function HomeHubPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-8">
        <div>
          <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white mx-auto flex items-center justify-center shadow-sm mb-4">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">HealthShield Portal Gateways</h1>
          <p className="text-sm text-slate-500 mt-2">
            Select an isolated role gateway to access dashboards or create a new self-service account.
          </p>
        </div>

        <div className="space-y-4">
          {/* Patient Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between text-left hover:border-sky-300 transition">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Patient Gateway</h2>
                <p className="text-xs text-slate-500">Envelope encryption & Groth16 claims</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/auth/patient"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/patient/register"
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          </div>

          {/* Hospital Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between text-left hover:border-emerald-300 transition">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital Gateway</h2>
                <p className="text-xs text-slate-500">BabyJubjub EdDSA signed encounters</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/auth/hospital"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/hospital/register"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          </div>

          {/* Insurer Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between text-left hover:border-indigo-300 transition">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Insurer Gateway</h2>
                <p className="text-xs text-slate-500">Zero-leakage proof adjudication</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/auth/insurer"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/insurer/register"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600 transition">
            &larr; Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
