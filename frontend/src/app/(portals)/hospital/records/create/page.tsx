"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";
import { api } from "@/lib/api";

export default function CreateRecordPage() {
  const router = useRouter();
  const [patientWallet, setPatientWallet] = useState("0x70997970c51812dc3a010c7d01b50e0d17dc79c8");
  const [diagnosisCode, setDiagnosisCode] = useState("1200");
  const [billedAmount, setBilledAmount] = useState("4500");
  const [encounterDetails, setEncounterDetails] = useState("Outpatient diagnostic evaluation and therapeutic administration.");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const billedAmountCents = Math.round(parseFloat(billedAmount) * 100);

      const { data } = await api.post("/records", {
        patientWallet,
        diagnosisCode,
        billedAmountCents,
        encounterDetails,
      });

      setSuccessRecord(data.data.record);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create medical record.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/hospital/dashboard" className="text-slate-500 hover:text-slate-800 text-sm inline-flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hospital Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Create Encrypted Medical Record</h1>
            <p className="text-sm text-slate-500">
              Payload will be encrypted at rest using AES-256-GCM envelope encryption and signed with your accredited BabyJubjub key.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successRecord ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900">Encrypted Record Created Successfully!</h2>
            <p className="text-sm text-slate-600 mt-2">
              The record has been stored and a real-time Server-Sent Event alert has been dispatched to the patient.
            </p>
            <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-100 font-mono text-xs text-left space-y-1">
              <div><span className="text-slate-500">Record ID:</span> <span className="font-bold text-slate-900">{successRecord.recordId}</span></div>
              <div><span className="text-slate-500">Patient Wallet:</span> <span className="text-slate-900">{successRecord.patientWallet}</span></div>
              <div><span className="text-slate-500">HMAC Integrity Hash:</span> <span className="text-slate-900">{successRecord.recordHash}</span></div>
            </div>
            <button
              onClick={() => router.push("/hospital/dashboard")}
              className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Patient Wallet Address
                </label>
                <input
                  type="text"
                  required
                  value={patientWallet}
                  onChange={(e) => setPatientWallet(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Diagnosis Code (ICD-10)
                </label>
                <input
                  type="text"
                  required
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Clinical Encounter Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={encounterDetails}
                  onChange={(e) => setEncounterDetails(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>Encrypt & Persist Medical Record</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
