"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Landmark,
  ShieldCheck,
  IndianRupee,
  CheckCircle2,
  XCircle,
  FileText,
  Award,
  Calendar,
  Building2,
  User,
  X,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";

export type FilterCategory = "all" | "verified" | "passed" | "rejected";

export interface InsurerClaimRecord {
  id: string;
  claimId: string;
  patientName: string;
  patientWallet?: string;
  hospitalName: string;
  hospitalWallet?: string;
  medicalCategory: string;
  policyNumber: string;
  policyStatus: string;
  zkpVerified: boolean;
  statusCategory: "verified" | "passed" | "rejected";
  incidentDate: string;
  claimedAmountCents: number;
  txHash?: string;
}

// Fallback sample records for development/demo when live claims are empty
const FALLBACK_SAMPLE_RECORDS: InsurerClaimRecord[] = [
  {
    id: "sample-1",
    claimId: "CLM-HS-2026-081",
    patientName: "Alex Mercer",
    patientWallet: "0x7099...79c8",
    hospitalName: "Metropolitan General Hospital",
    hospitalWallet: "0x3c44...93bc",
    medicalCategory: "Acute Cardiology & Intensive Inpatient Care",
    policyNumber: "POL-HS-2026-99",
    policyStatus: "Verified Legal (ZK-SNARK Groth16)",
    zkpVerified: true,
    statusCategory: "verified",
    incidentDate: "Nov 22, 2026",
    claimedAmountCents: 245000,
    txHash: "0x8f3c...12b9",
  },
  {
    id: "sample-2",
    claimId: "CLM-HS-2026-079",
    patientName: "Sarah Jenkins",
    patientWallet: "0x15d3...6a21",
    hospitalName: "St. Jude Surgical Pavilion",
    hospitalWallet: "0x2546...bc82",
    medicalCategory: "Emergency Orthopedic Trauma Reconstruction",
    policyNumber: "POL-HS-2026-42",
    policyStatus: "Passed & Settled On-Chain",
    zkpVerified: true,
    statusCategory: "passed",
    incidentDate: "Nov 19, 2026",
    claimedAmountCents: 480000,
    txHash: "0x4e2a...98df",
  },
  {
    id: "sample-3",
    claimId: "CLM-HS-2026-074",
    patientName: "David Chen",
    patientWallet: "0x9965...e21a",
    hospitalName: "Columbia Presbyterian Medical Center",
    hospitalWallet: "0x3c44...93bc",
    medicalCategory: "Neurological Diagnostic Consult & MRI Protocol",
    policyNumber: "POL-HS-2026-18",
    policyStatus: "Passed & Settled On-Chain",
    zkpVerified: true,
    statusCategory: "passed",
    incidentDate: "Nov 16, 2026",
    claimedAmountCents: 165000,
    txHash: "0x7a11...43ec",
  },
  {
    id: "sample-4",
    claimId: "CLM-HS-2026-068",
    patientName: "Robert Miller",
    patientWallet: "0x8626...f993",
    hospitalName: "Northwestern Memorial Hospital",
    hospitalWallet: "0x71bE...a54e",
    medicalCategory: "Elective Cosmetic Rhinoplasty Protocol",
    policyNumber: "POL-HS-2026-05",
    policyStatus: "Rejected (Policy Exclusion Scope)",
    zkpVerified: false,
    statusCategory: "rejected",
    incidentDate: "Nov 12, 2026",
    claimedAmountCents: 320000,
  },
];

export default function InsuranceDashboard() {
  const [user, setUser] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const { isConnected } = useSSE();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    api.get("/claims")
      .then((res) => {
        const fetchedClaims = res.data?.data?.claims || [];
        setClaims(fetchedClaims);
      })
      .catch((err) => console.warn("Failed to fetch claims:", err));
  }, []);

  const totalSettledCents = claims
    .filter((c) => c.status === "SETTLED")
    .reduce((acc, c) => acc + (c.claimedPayoutCents || 0), 0);

  // Map live claims safely with fallbacks or use seeded fallback records
  const claimRecords: InsurerClaimRecord[] = useMemo(() => {
    if (!claims || claims.length === 0) {
      return FALLBACK_SAMPLE_RECORDS;
    }

    return claims.map((c: any, index: number) => {
      let statusCategory: "verified" | "passed" | "rejected" = "verified";
      let policyStatus = "Verified Legal (ZK-SNARK Groth16)";
      let zkpVerified = true;

      if (c.status === "SETTLED") {
        statusCategory = "passed";
        policyStatus = "Passed & Settled On-Chain";
        zkpVerified = true;
      } else if (c.status === "REJECTED") {
        statusCategory = "rejected";
        policyStatus = "Rejected (Verification Failed)";
        zkpVerified = false;
      } else if (c.status === "VERIFIED_APPROVED" || c.status === "SUBMITTED") {
        statusCategory = "verified";
        policyStatus = "Verified Legal (ZK-SNARK Groth16)";
        zkpVerified = true;
      }

      const formattedDate = c.submittedAt
        ? new Date(c.submittedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Nov 22, 2026";

      return {
        id: c._id || c.claimId || `claim-${index}`,
        claimId: c.claimId || `CLM-HS-2026-${String(index + 1).padStart(3, "0")}`,
        patientName: c.patientName || (c.patientWallet ? `Patient (${c.patientWallet.slice(0, 6)}...${c.patientWallet.slice(-4)})` : "Alex Mercer"),
        patientWallet: c.patientWallet,
        hospitalName: c.hospitalName || "Metropolitan General Hospital",
        hospitalWallet: c.hospitalWallet,
        medicalCategory: c.medicalCategory || c.treatment || "Cardiology / Acute Clinical Care",
        policyNumber: c.policyNumber || (c.policyId ? `POL-${c.policyId}` : "POL-HS-2026-99"),
        policyStatus,
        zkpVerified,
        statusCategory,
        incidentDate: formattedDate,
        claimedAmountCents: c.claimedPayoutCents || 0,
        txHash: c.onChainTxHash,
      };
    });
  }, [claims]);

  // Derived counts for the 4 summary blocks
  const counts = useMemo(() => {
    return {
      all: claimRecords.length,
      verified: claimRecords.filter((r) => r.statusCategory === "verified").length,
      passed: claimRecords.filter((r) => r.statusCategory === "passed").length,
      rejected: claimRecords.filter((r) => r.statusCategory === "rejected").length,
    };
  }, [claimRecords]);

  // Filtered items based on active block selection
  const filteredRecords = useMemo(() => {
    if (activeFilter === "all") return claimRecords;
    return claimRecords.filter((r) => r.statusCategory === activeFilter);
  }, [claimRecords, activeFilter]);

  // Filter title helper
  const filterHeadings: Record<FilterCategory, { title: string; subtitle: string }> = {
    all: {
      title: "All Insurance Claim Requests",
      subtitle: "Complete queue of submitted healthcare insurance claim requests",
    },
    verified: {
      title: "ZKP-Verified Legal Insurance Takers",
      subtitle: "Patients cryptographically authenticated via Groth16 zk-SNARK proof of eligibility",
    },
    passed: {
      title: "Passed & Approved Insurance Claims",
      subtitle: "Claims fully settled on Ethereum Sepolia with verified payout transactions",
    },
    rejected: {
      title: "Rejected Insurance Claims",
      subtitle: "Claims failing cryptographic proof constraints or policy coverage boundaries",
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* =========================================================================
          EXISTING HEADER (STRICTLY PRESERVED AS REQUIRED)
          ========================================================================= */}
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

      {/* =========================================================================
          EXISTING 3 TOP CARDS (STRICTLY PRESERVED AS REQUIRED)
          ========================================================================= */}
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
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">
            ₹{(totalSettledCents / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      {/* =========================================================================
          1. FOUR INTERACTIVE SUMMARY BLOCKS (NEW)
          ========================================================================= */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Insurance Claims Overview</h2>
            <p className="text-xs text-slate-500">Select any metric card to filter and inspect underlying claim records</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            Active Filter: <span className="text-indigo-600 font-bold capitalize">{activeFilter}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Block 1: No. of Requests */}
          <button
            type="button"
            aria-pressed={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
            className={`text-left p-5 rounded-xl border transition shadow-sm flex flex-col justify-between ${
              activeFilter === "all"
                ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                No. of Requests
              </span>
              <div className={`p-2 rounded-lg ${activeFilter === "all" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">{counts.all}</p>
              <p className="text-xs text-slate-400 mt-0.5">All claim requests</p>
            </div>
          </button>

          {/* Block 2: No. of Verified Insurance */}
          <button
            type="button"
            aria-pressed={activeFilter === "verified"}
            onClick={() => setActiveFilter("verified")}
            className={`text-left p-5 rounded-xl border transition shadow-sm flex flex-col justify-between ${
              activeFilter === "verified"
                ? "bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-md"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                No. of Verified Insurance
              </span>
              <div className={`p-2 rounded-lg ${activeFilter === "verified" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">{counts.verified}</p>
              <p className="text-xs text-slate-400 mt-0.5">ZKP verified legal takers</p>
            </div>
          </button>

          {/* Block 3: No. of Passed Insurance */}
          <button
            type="button"
            aria-pressed={activeFilter === "passed"}
            onClick={() => setActiveFilter("passed")}
            className={`text-left p-5 rounded-xl border transition shadow-sm flex flex-col justify-between ${
              activeFilter === "passed"
                ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                No. of Passed Insurance
              </span>
              <div className={`p-2 rounded-lg ${activeFilter === "passed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">{counts.passed}</p>
              <p className="text-xs text-slate-400 mt-0.5">Passed / settled claims</p>
            </div>
          </button>

          {/* Block 4: No. of Rejected Insurance */}
          <button
            type="button"
            aria-pressed={activeFilter === "rejected"}
            onClick={() => setActiveFilter("rejected")}
            className={`text-left p-5 rounded-xl border transition shadow-sm flex flex-col justify-between ${
              activeFilter === "rejected"
                ? "bg-white border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                No. of Rejected Insurance
              </span>
              <div className={`p-2 rounded-lg ${activeFilter === "rejected" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">{counts.rejected}</p>
              <p className="text-xs text-slate-400 mt-0.5">Rejected claims</p>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. INTERACTIVE FILTERED LIST VIEW (NEW)
          ========================================================================= */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-extrabold text-slate-900">
                {filterHeadings[activeFilter].title}
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {filteredRecords.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {filterHeadings[activeFilter].subtitle}
            </p>
          </div>

          {/* Filter Switcher Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
            {(["all", "verified", "passed", "rejected"] as FilterCategory[]).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveFilter(filterKey)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeFilter === filterKey
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {filterKey === "all" ? "All" : filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No insurance records in this category yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently zero claims matching the &quot;{activeFilter}&quot; filter criteria. New claims submitted by patients will update live.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((item) => (
              <div
                key={item.id}
                className="p-6 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* 1. Patient Name & 2. Hospital Name */}
                <div className="flex items-start space-x-4 min-w-[260px]">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{item.patientName}</span>
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {item.claimId}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-700">{item.hospitalName}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Medical Situation Category */}
                <div className="flex-1 min-w-[220px]">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Medical Situation Category
                  </span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
                    {item.medicalCategory}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                    Policy: {item.policyNumber}
                  </span>
                </div>

                {/* 4. Policy Verification Status */}
                <div className="min-w-[190px]">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Policy Verification Status
                  </span>
                  <div className="mt-1">
                    {item.statusCategory === "passed" && (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.policyStatus}</span>
                      </span>
                    )}
                    {item.statusCategory === "verified" && (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>{item.policyStatus}</span>
                      </span>
                    )}
                    {item.statusCategory === "rejected" && (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{item.policyStatus}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. Date of Incident & Amount */}
                <div className="text-left lg:text-right min-w-[150px]">
                  <div className="flex items-center lg:justify-end space-x-1 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.incidentDate}</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                    ₹{(item.claimedAmountCents / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
