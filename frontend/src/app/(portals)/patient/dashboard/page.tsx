"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, FileText, Send, ShieldCheck, Activity, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [recordsCount, setRecordsCount] = useState(0);
  const [claimsCount, setClaimsCount] = useState(0);
  const { isConnected, events } = useSSE();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchData = async () => {
      try {
        const [recRes, clmRes] = await Promise.all([
          api.get("/records"),
          api.get("/claims"),
        ]);
        setRecordsCount(recRes.data.data.records.length);
        setClaimsCount(clmRes.data.data.claims.length);
      } catch (err) {
        console.warn("Could not fetch dashboard counters:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-sky-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Patient Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Welcome back, {user?.fullName || "Patient"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Wallet: <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{user?.walletAddress || "Connecting..."}</span>
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
            href="/patient/claims/new"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition shadow-sm inline-flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>New ZK Claim</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Encrypted Records</span>
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{recordsCount}</p>
          <Link href="/patient/records" className="text-xs font-semibold text-sky-600 hover:text-sky-700 mt-4 inline-block">
            View All Records &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">ZK Claims Submitted</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{claimsCount}</p>
          <span className="text-xs text-slate-400 mt-4 inline-block">Proved via Groth16 zk-SNARKs</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Active Policy</span>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-4">POL-HS-2026-99</p>
          <p className="text-xs text-slate-500 mt-1">Coverage Limit: $50,000 | Co-pay: 20%</p>
        </div>
      </div>

      {/* Live SSE Notifications */}
      {events.length > 0 && (
        <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-sky-600" />
            <span>Recent Real-Time Events</span>
          </h2>
          <div className="divide-y divide-slate-100">
            {events.slice(0, 5).map((ev, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{ev.event}</span>
                <span className="font-mono text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
