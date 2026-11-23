"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Landmark, ShieldCheck, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";

export default function InsuranceDashboard() {
  const [user, setUser] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const { isConnected } = useSSE();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    api.get("/claims")
      .then((res) => setClaims(res.data.data.claims))
      .catch((err) => console.warn(err));
  }, []);

  const totalSettledCents = claims
    .filter((c) => c.status === "SETTLED")
    .reduce((acc, c) => acc + (c.claimedPayoutCents || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Landmark className="w-4 h-4" />
            <span>Insurer Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {user?.organizationName || user?.fullName || "Insurance Underwriter"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            License: <span className="font-semibold text-slate-700">{user?.licenseNumber || "INS-US-4029"}</span> | 
            Wallet: <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded ml-1">{user?.walletAddress}</span>
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span>{isConnected ? "Real-time Live (SSE)" : "Connecting SSE"}</span>
          </div>
          <Link
            href="/insurance/claims"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm inline-flex items-center space-x-2"
          >
            <span>Review ZK Claims</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">ZK Claims Received</span>
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{claims.length}</p>
          <span className="text-xs text-slate-400 mt-4 inline-block">Zero clinical leakage</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Total Settled Payouts</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">
            ${(totalSettledCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 mt-4 inline-block">Ethereum Sepolia Verified</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Privacy Compliance</span>
            <Landmark className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-4">Zero-Leakage Active</p>
          <span className="text-xs text-slate-400 mt-1 block">No patient diagnoses exposed</span>
        </div>
      </div>
    </div>
  );
}
