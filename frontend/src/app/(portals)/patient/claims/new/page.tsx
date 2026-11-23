"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cpu, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function NewClaimPage() {
  const router = useRouter();
  const workerRef = useRef<Worker | null>(null);

  const [policyId, setPolicyId] = useState("20269941");
  const [billedAmount, setBilledAmount] = useState("4500");
  const [diagnosisCode, setDiagnosisCode] = useState("1200");
  const [coverageLimit, setCoverageLimit] = useState("50000");
  const [deductible, setDeductible] = useState("500");
  const [coPayBps, setCoPayBps] = useState("2000"); // 20%

  const [isProving, setIsProving] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    // Instantiate dedicated ZKP Web Worker
    workerRef.current = new Worker(
      new URL("../../../../../workers/zkp.worker.ts", import.meta.url)
    );

    workerRef.current.onmessage = async (event: MessageEvent) => {
      const { type, stage, percent, proof, publicSignals, error: workerErr } = event.data;

      if (type === "PROGRESS") {
        setStage(stage);
        setProgressPercent(percent);
      } else if (type === "SUCCESS") {
        setStage("SUBMITTING_ON_CHAIN");
        setProgressPercent(95);

        try {
          const userStr = localStorage.getItem("user");
          const user = userStr ? JSON.parse(userStr) : null;

          const { data } = await api.post("/claims", {
            proof,
            publicSignals,
            policyId,
            hospitalWallet: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
            insurerWallet: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
          });

          setTxHash(data.data.onChainTxHash);
          setProgressPercent(100);
          setStage("COMPLETE");
        } catch (apiErr: any) {
          setError(apiErr.response?.data?.error || "Failed to submit verified proof to blockchain.");
        } finally {
          setIsProving(false);
        }
      } else if (type === "ERROR") {
        setError(workerErr);
        setIsProving(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [policyId]);

  const handleGenerateProof = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProving(true);
    setProgressPercent(5);
    setStage("INITIALIZING_WORKER");

    const billedCents = Math.round(parseFloat(billedAmount) * 100);
    const dedCents = Math.round(parseFloat(deductible) * 100);
    const covCents = Math.round(parseFloat(coverageLimit) * 100);
    const copay = parseInt(coPayBps, 10);

    // Calculate payout locally matching circuit integer math
    const reimbursable = Math.max(0, Math.min(billedCents, covCents) - dedCents);
    const claimedPayout = Math.floor((reimbursable * (10000 - copay)) / 10000);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const patientAddr = user?.walletAddress || "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

    // Prepare inputs matching claim_eligibility.circom
    const circuitInputs = {
      authorizedDiagnosisRoot: "12345678901234567890123456789012345678901234567890",
      hospitalAx: "1122334455667788990011223344556677889900112233445566778899001122",
      hospitalAy: "9988776655443322110099887766554433221100998877665544332211009988",
      policyCoverageLimit: covCents.toString(),
      policyDeductible: dedCents.toString(),
      coPayBasisPoints: copay.toString(),
      claimedPayout: claimedPayout.toString(),
      nullifier: (BigInt(Date.now()) * BigInt(10000) + BigInt(Math.floor(Math.random() * 1000))).toString(),
      policyId: policyId.toString(),
      patientAddress: patientAddr,
      hospitalAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      insurerAddress: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      billedAmount: billedCents.toString(),
      diagnosisCode: diagnosisCode.toString(),
      timestamp: Math.floor(Date.now() / 1000).toString(),
      encounterNonce: "882199",
      patientIdCommitment: "44332211",
      sigR8x: "1234567890",
      sigR8y: "9876543210",
      sigS: "5555555555",
      merklePathElements: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
      merklePathIndices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      patientSecret: "987654321",
      claimNonce: "42",
    };

    workerRef.current?.postMessage({
      type: "GENERATE_CLAIM_PROOF",
      payload: { circuitInputs },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/patient/dashboard" className="text-slate-500 hover:text-slate-800 text-sm inline-flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Generate Zero-Knowledge Claim</h1>
            <p className="text-sm text-slate-500">
              Proof is generated 100% inside your browser via Web Worker. Diagnosis code is never sent to the insurer.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {txHash ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900">Claim Verified & Submitted On-Chain!</h2>
            <p className="text-sm text-slate-600 mt-2">
              Groth16 pairing check passed on Ethereum Sepolia. The insurer has been notified to execute settlement.
            </p>
            <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-100 font-mono text-xs text-slate-600 break-all">
              Tx Hash: {txHash}
            </div>
            <button
              onClick={() => router.push("/patient/dashboard")}
              className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleGenerateProof} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Policy ID
                </label>
                <input
                  type="text"
                  required
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Diagnosis Code (Private Witness)
                </label>
                <input
                  type="text"
                  required
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Proved via Merkle membership inside circuit</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Billed Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={billedAmount}
                  onChange={(e) => setBilledAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Policy Deductible ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={deductible}
                  onChange={(e) => setDeductible(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            {isProving && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Proving State: {stage}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center space-x-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Computing Groth16 zk-SNARK proof over BN254 elliptic curve...</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProving}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isProving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Generate ZKP & Submit Claim</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
