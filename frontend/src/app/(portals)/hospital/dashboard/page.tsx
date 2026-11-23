"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, PlusCircle, FileText, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function HospitalDashboard() {
  const [user, setUser] = useState<any>(null);
  const [recordsCount, setRecordsCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    api.get("/records")
      .then((res) => setRecordsCount(res.data.data.records.length))
      .catch((err) => console.warn(err));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Building2 className="w-4 h-4" />
            <span>Hospital Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {user?.organizationName || user?.fullName || "Hospital"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Certified License: <span className="font-semibold text-slate-700">{user?.licenseNumber || "HOSP-NY-9921"}</span> | 
            Wallet: <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded ml-1">{user?.walletAddress}</span>
          </p>
        </div>

        <div className="mt-4 md:mt-0">
          <Link
            href="/hospital/records/create"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-sm inline-flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Encrypted Record</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Encounters Authored</span>
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{recordsCount}</p>
          <span className="text-xs text-slate-400 mt-4 inline-block">Envelope encrypted with AES-256-GCM</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">BabyJubjub Key Status</span>
            <CheckCircle2 className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-4">Certified on Registry</p>
          <span className="text-xs text-slate-400 mt-1 block">EdDSA curves verified on-chain</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Registry Authority</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-4">HealthShield Accredited</p>
          <span className="text-xs text-slate-400 mt-1 block">Smart contract authorized provider</span>
        </div>
      </div>
    </div>
  );
}
