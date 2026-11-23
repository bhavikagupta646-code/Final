"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Shield,
  Lock,
  ArrowRight,
  User,
  Building2,
  Landmark,
  Fingerprint,
  Zap,
  CheckCircle2,
  Cpu,
  UserPlus,
} from "lucide-react";
import "./landing.css";
import { portalConfig } from "../config/portalConfig";
import { ECGShieldLoader } from "../components/landing/ECGShieldLoader";
import { AuthModal } from "../components/landing/AuthModal";
import { ClaimVerificationModal } from "../components/landing/ClaimVerificationModal";

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "hospital" | "insurer">("patient");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  const openAuth = (role: "patient" | "hospital" | "insurer", mode: "login" | "register" = "login") => {
    setSelectedRole(role);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="hs-landing">
      {/* 1. ECG Shield Loader */}
      <ECGShieldLoader />

      {/* 2. Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialRole={selectedRole}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

      <ClaimVerificationModal
        isOpen={verificationModalOpen}
        claimId="CLAIM-HS-2026-001"
        onClose={() => setVerificationModalOpen(false)}
      />

      {/* 3. NAVBAR */}
      <nav className="hs-navbar" id="home">
        <Link href="/" className="hs-logo">
          <ShieldCheck className="hs-logo-icon text-teal-600" />
          <span>Health<span className="text-teal-600">Shield</span></span>
        </Link>

        <div className="hs-nav-links">
          <button
            type="button"
            onClick={() => scrollToSection("home")}
            className="hs-nav-link bg-transparent border-none cursor-pointer"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("features")}
            className="hs-nav-link bg-transparent border-none cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("portals")}
            className="hs-nav-link bg-transparent border-none cursor-pointer"
          >
            Portals
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("about")}
            className="hs-nav-link bg-transparent border-none cursor-pointer"
          >
            About
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openAuth("patient", "login")}
            className="text-xs font-bold text-slate-700 hover:text-teal-700 px-3 py-2 transition hidden sm:inline-block"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("portals")}
            className="hs-nav-btn"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 4. HERO SECTION */}
      <header className="hs-hero">
        <div className="hs-hero-content">
          <span className="hs-tag">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>Privacy First Healthcare</span>
          </span>

          <h1>
            Your Health Records.<br />
            <span>Your Privacy.</span><br />
            Our Priority.
          </h1>

          <p className="hs-hero-p">
            A secure healthcare insurance platform powered by Zero-Knowledge Proofs
            and Ethereum Sepolia smart contracts. Verify insurance claim eligibility
            and calculate payouts without ever exposing private medical records or diagnosis codes.
          </p>

          <div className="hs-hero-buttons">
            <button
              type="button"
              onClick={() => scrollToSection("portals")}
              className="hs-btn-primary"
            >
              <span>Explore Portals</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="hs-btn-secondary"
            >
              Learn More
            </button>
          </div>

          <div className="hs-hero-stats">
            <div>
              <h3>100%</h3>
              <p>Privacy Focused</p>
            </div>
            <div>
              <h3>Groth16</h3>
              <p>zk-SNARK Prover</p>
            </div>
            <div>
              <h3>Web3</h3>
              <p>Ethereum Sepolia</p>
            </div>
          </div>
        </div>

        {/* Hero Interactive Main Card */}
        <div className="hs-hero-card-col">
          <div
            className="hs-main-card cursor-pointer group"
            onClick={() => setVerificationModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Preview Zero-Knowledge Verification"
          >
            <div className="hs-card-icon group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-10 h-10 text-teal-600" />
            </div>

            <h3>Secure Verification</h3>
            <p>Your medical data stays private.</p>

            <div className="hs-security-status">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero-Knowledge Protected</span>
            </div>

            <div className="hs-card-bottom">
              <span>Groth16 zk-SNARK Proof</span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* 5. FEATURES SECTION */}
      <section className="hs-section" id="features">
        <div className="hs-section-heading">
          <span className="hs-tag">Our Technology</span>
          <h2>Healthcare Meets <span>Web3</span></h2>
          <p>Mathematical privacy protection for modern healthcare insurance.</p>
        </div>

        <div className="hs-feature-grid">
          <div className="hs-feature-card">
            <div className="hs-feature-icon">
              <Lock className="w-5 h-5 text-teal-600" />
            </div>
            <h3>Data Privacy</h3>
            <p>
              Protect sensitive medical records through multi-recipient X25519 and AES-256-GCM envelope encryption.
            </p>
          </div>

          <div className="hs-feature-card">
            <div className="hs-feature-icon">
              <Fingerprint className="w-5 h-5 text-teal-600" />
            </div>
            <h3>Zero Knowledge Proofs</h3>
            <p>
              Generate client-side Groth16 proofs in browser Web Workers. Prove insurance eligibility without disclosing diagnosis codes.
            </p>
          </div>

          <div className="hs-feature-card">
            <div className="hs-feature-icon">
              <Cpu className="w-5 h-5 text-teal-600" />
            </div>
            <h3>Blockchain Security</h3>
            <p>
              Verify claims through on-chain Solidity contracts on Ethereum Sepolia with fixed 12-element public signal integrity.
            </p>
          </div>

          <div className="hs-feature-card">
            <div className="hs-feature-icon">
              <Zap className="w-5 h-5 text-teal-600" />
            </div>
            <h3>Instant Settlement</h3>
            <p>
              Automate co-pay calculations and claim approvals directly through smart contracts with zero human claim delay.
            </p>
          </div>
        </div>
      </section>

      {/* 6. PORTALS SECTION */}
      <section className="hs-section hs-portals-section" id="portals">
        <div className="hs-section-heading">
          <span className="hs-tag">Get Started</span>
          <h2>Choose Your <span>Portal</span></h2>
          <p>Select your dedicated role gateway to sign in or create a self-service account.</p>
        </div>

        <div className="hs-portal-grid">
          {/* Patient Portal Card */}
          <div className="hs-portal-card">
            <div>
              <div className="hs-portal-icon-wrap hs-portal-patient">
                <User className="w-8 h-8" />
              </div>
              <span className="hs-portal-badge hs-badge-patient">Patient Identity</span>
              <h3>Patient Portal</h3>
              <p>
                Manage personal medical records, grant selective doctor access, and submit zero-leakage insurance claims with browser zk-SNARKs.
              </p>
            </div>

            <div className="hs-portal-actions">
              <button
                type="button"
                onClick={() => openAuth("patient", "login")}
                className="hs-portal-btn-primary"
              >
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-3 text-xs">
                <Link
                  href={portalConfig.portals.patient.routes.login}
                  className="hs-portal-btn-secondary"
                >
                  Direct Sign In
                </Link>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => openAuth("patient", "register")}
                  className="hs-portal-btn-secondary bg-transparent border-none cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Register</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hospital Portal Card */}
          <div className="hs-portal-card">
            <div>
              <div className="hs-portal-icon-wrap hs-portal-hospital">
                <Building2 className="w-8 h-8" />
              </div>
              <span className="hs-portal-badge hs-badge-hospital">Verified Care Provider</span>
              <h3>Hospital Portal</h3>
              <p>
                Issue cryptographically signed patient encounters with BabyJubjub EdDSA signatures and AES-256-GCM envelope encryption.
              </p>
            </div>

            <div className="hs-portal-actions">
              <button
                type="button"
                onClick={() => openAuth("hospital", "login")}
                className="hs-portal-btn-primary"
              >
                <span>Enter Hospital Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-3 text-xs">
                <Link
                  href={portalConfig.portals.hospital.routes.login}
                  className="hs-portal-btn-secondary"
                >
                  Direct Sign In
                </Link>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => openAuth("hospital", "register")}
                  className="hs-portal-btn-secondary bg-transparent border-none cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Register</span>
                </button>
              </div>
            </div>
          </div>

          {/* Insurer Portal Card */}
          <div className="hs-portal-card">
            <div>
              <div className="hs-portal-icon-wrap hs-portal-insurer">
                <Landmark className="w-8 h-8" />
              </div>
              <span className="hs-portal-badge hs-badge-insurer">Zero-Knowledge Audited</span>
              <h3>Insurance Portal</h3>
              <p>
                Adjudicate claims and verify on-chain proofs with zero clinical leakage. Audit policy validity without seeing diagnoses.
              </p>
            </div>

            <div className="hs-portal-actions">
              <button
                type="button"
                onClick={() => openAuth("insurer", "login")}
                className="hs-portal-btn-primary"
              >
                <span>Enter Insurance Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-3 text-xs">
                <Link
                  href={portalConfig.portals.insurer.routes.login}
                  className="hs-portal-btn-secondary"
                >
                  Direct Sign In
                </Link>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => openAuth("insurer", "register")}
                  className="hs-portal-btn-secondary bg-transparent border-none cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Register</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ABOUT SECTION */}
      <section className="hs-section hs-about" id="about">
        <div className="hs-about-content">
          <span className="hs-tag">About HealthShield</span>
          <h2>Privacy Should Never Be A <span>Trade-Off.</span></h2>
          <p>
            HealthShield was engineered to eliminate the compromise between comprehensive healthcare insurance coverage
            and patient medical privacy. By utilizing Groth16 zk-SNARKs and Ethereum Sepolia smart contracts, patients can
            prove eligibility, treatments, and reimbursable amounts without ever releasing their raw diagnosis records to
            third-party insurance adjudicators.
          </p>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="hs-footer">
        <div className="hs-footer-logo">
          <Shield className="w-5 h-5 text-teal-400" />
          <span>HealthShield</span>
        </div>
        <p>Privacy First. Trust Always. Zero-Knowledge Cryptography for Healthcare.</p>
        <p className="hs-copyright">
          © {new Date().getFullYear()} HealthShield. Production-grade privacy-preserving healthcare records.
        </p>
      </footer>
    </div>
  );
}
