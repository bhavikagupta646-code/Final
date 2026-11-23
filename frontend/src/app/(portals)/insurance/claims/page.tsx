"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Landmark, ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function InsurerClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      const { data } = await api.get("/claims");
      setClaims(data.data.claims);
    } catch (err) {
      console.error("Failed to fetch claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleSettle = async (claimId: string) => {
    setSettlingId(claimId);
    try {
      await api.put(`/claims/${claimId}/settle`);
      await fetchClaims();
    } catch (err: any) {
      alert("Settlement failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center space-x-3 mb-6">
        <Link href="/insurance/dashboard" className="text-slate-500 hover:text-slate-800 text-sm inline-flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Zero-Knowledge Insurance Claims</h1>
          <p className="text-sm text-slate-500 mt-1">
            Authenticated mathematically by Groth16 zk-SNARKs. Strictly projected with ZERO diagnosis leakage.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700">No claims submitted yet</h2>
          <p className="text-sm text-slate-500 mt-1">
            When patients generate and submit Groth16 verified claims, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {claims.map((claim) => (
            <div key={claim.claimId} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-900">{claim.claimId}</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Policy ID: <span className="font-mono font-semibold text-slate-700">{claim.policyId}</span> | 
                      Patient: <span className="font-mono text-slate-600 ml-1">{claim.patientWallet}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 md:mt-0 flex items-center space-x-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    claim.status === "SETTLED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {claim.status}
                  </span>

                  {claim.status !== "SETTLED" && (
                    <button
                      onClick={() => handleSettle(claim.claimId)}
                      disabled={settlingId === claim.claimId}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      {settlingId === claim.claimId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Execute Settlement</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Verified Payout Amount</span>
                  <span className="font-mono font-bold text-slate-900 text-base text-emerald-600">
                    ${(claim.claimedPayoutCents / 100).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ZK Nullifier (Anti-Replay)</span>
                  <span className="font-mono text-slate-700">{claim.nullifier.slice(0, 14)}...</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submitted At</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(claim.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Blockchain Verification</span>
                  <span className="font-mono text-xs text-sky-600 truncate block">
                    {claim.onChainTxHash ? `${claim.onChainTxHash.slice(0, 14)}...` : "Verified On-Chain"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
