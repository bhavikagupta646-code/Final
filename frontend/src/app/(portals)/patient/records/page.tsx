"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Lock, Unlock, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decryptedRecords, setDecryptedRecords] = useState<{ [id: string]: any }>({});
  const [decryptingId, setDecryptingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await api.get("/records");
        setRecords(data.data.records);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleDecrypt = async (recordId: string) => {
    setDecryptingId(recordId);
    try {
      const { data } = await api.get(`/records/${recordId}/decrypt`);
      setDecryptedRecords((prev) => ({ ...prev, [recordId]: data.data.payload }));
    } catch (err: any) {
      alert("Decryption failed: " + (err.response?.data?.error || err.message));
    } finally {
      setDecryptingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center space-x-3 mb-6">
        <Link href="/patient/dashboard" className="text-slate-500 hover:text-slate-800 text-sm inline-flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Medical Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            All records are encrypted at rest with AES-256-GCM and signed by accredited hospitals.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700">No medical records found</h2>
          <p className="text-sm text-slate-500 mt-1">
            When a hospital creates an encounter for your wallet, it will appear here encrypted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {records.map((rec) => {
            const isDecrypted = !!decryptedRecords[rec.recordId];
            const payload = decryptedRecords[rec.recordId];

            return (
              <div key={rec.recordId} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-sm font-bold text-slate-900">{rec.recordId}</span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Hospital: <span className="font-mono text-slate-600">{rec.hospitalWallet}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 flex items-center space-x-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono">
                      HMAC: {rec.recordHash.slice(0, 10)}...
                    </span>
                    <button
                      onClick={() => handleDecrypt(rec.recordId)}
                      disabled={decryptingId === rec.recordId}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      {decryptingId === rec.recordId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isDecrypted ? (
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{isDecrypted ? "Decrypted" : "Decrypt Record"}</span>
                    </button>
                  </div>
                </div>

                {isDecrypted ? (
                  <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confidential Clinical Details</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3">
                      <div>
                        <span className="text-slate-500 block">Diagnosis Code (ICD-10)</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{payload.diagnosisCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Billed Amount</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${(payload.billedAmountCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Encounter Description</span>
                        <span className="text-slate-800 font-medium">{payload.encounterDetails}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-slate-400 font-mono break-all bg-slate-50 p-3 rounded-xl border border-slate-100">
                    Encrypted Payload (AES-256-GCM): {rec.encryptedPayload.slice(0, 80)}...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
