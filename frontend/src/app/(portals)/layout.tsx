"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Home, LogOut, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function PortalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Determine portal role badge and accent styling from current route
  let roleBadge = "Role Portal";
  let roleBadgeClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (pathname.startsWith("/patient")) {
    roleBadge = "Patient Portal";
    roleBadgeClasses = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (pathname.startsWith("/hospital")) {
    roleBadge = "Hospital Portal";
    roleBadgeClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (pathname.startsWith("/insurance") || pathname.startsWith("/insurer")) {
    roleBadge = "Insurer Portal";
    roleBadgeClasses = "bg-indigo-50 text-indigo-700 border-indigo-200";
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request completed with local cleanup:", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("healthshield_access_token");
        localStorage.removeItem("healthshield_user");
        document.cookie = "userRole=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
      }
      setIsLoggingOut(false);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* =========================================================================
          HEALTHSHIELD PORTAL TOP NAVIGATION HEADER
          Sticky, non-intrusive brand identity + exit/sign-out controls
          ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Top-Left: HealthShield Brand Logo & Role Badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group transition focus:outline-none"
              title="Return to HealthShield Home"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition shadow-sm">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Health<span className="text-teal-600">Shield</span>
              </span>
            </Link>

            <span
              className={`hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleBadgeClasses}`}
            >
              {roleBadge}
            </span>
          </div>

          {/* Top-Right: Exit Portal to Home & Sign Out */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition shadow-sm focus:outline-none"
              title="Exit portal interface and return to landing page"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Exit to Home</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-sm font-medium transition cursor-pointer disabled:opacity-50 focus:outline-none"
              title="Sign out of your session completely"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Portal Content Workspace */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
