import Link from "next/link";
import { ShieldCheck, UserCheck, Building2, Landmark, Lock, Cpu, Database } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-600 text-white p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">HealthShield</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2.5 py-0.5 rounded-full">Zero-Knowledge</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-sky-600 transition"
            >
              Sign In
            </Link>
            <Link
              href="/home"
              className="text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
            >
              Enter Portals
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 text-sky-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-8">
          <Lock className="w-3.5 h-3.5" />
          <span>Patient-Controlled Cryptographic Privacy & Zero-Knowledge Settlement</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight">
          Sovereign Medical Records & Zero-Knowledge Insurance Claims
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl">
          HealthShield proves insurance eligibility and claim validity mathematically on Ethereum Sepolia using Groth16 zk-SNARKs—without ever revealing patient diagnoses or clinical records to insurers.
        </p>

        {/* Portal Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
          {/* Patient Portal */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-lg transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-6">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Patient Portal</h2>
              <p className="mt-2 text-sm text-slate-600">
                Hold personal medical records with envelope encryption. Generate client-side Groth16 proofs to submit zero-leakage claims.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between text-sm">
              <Link
                href="/auth/patient"
                className="font-semibold text-sky-600 hover:text-sky-700"
              >
                Sign In &rarr;
              </Link>
              <Link
                href="/auth/patient/register"
                className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-lg text-xs"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Hospital Portal */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-lg transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Hospital Portal</h2>
              <p className="mt-2 text-sm text-slate-600">
                Create cryptographically signed clinical encounters using BabyJubjub EdDSA signatures and AES-256-GCM envelope encryption.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between text-sm">
              <Link
                href="/auth/hospital"
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Sign In &rarr;
              </Link>
              <Link
                href="/auth/hospital/register"
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Insurer Portal */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-lg transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Landmark className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Insurer Portal</h2>
              <p className="mt-2 text-sm text-slate-600">
                Verify mathematically authenticated claims with zero access to private diagnosis codes. Execute instant on-chain settlement.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between text-sm">
              <Link
                href="/auth/insurer"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Sign In &rarr;
              </Link>
              <Link
                href="/auth/insurer/register"
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs"
              >
                Register
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>Groth16 Web Worker Proofs</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>MongoDB Envelope Encryption</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Ethereum Sepolia On-Chain Verification</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        HealthShield &copy; 2026. Designed with Zero-Knowledge Architecture for Confidential Healthcare.
      </footer>
    </div>
  );
}
