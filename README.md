# HealthShield 🛡️

> Privacy-Preserving Healthcare Records & Zero-Knowledge Insurance Claims Platform

HealthShield is an end-to-end decentralized healthcare and insurance platform that protects patient privacy using client-side **Groth16 Zero-Knowledge Proofs (BN254 curve)**, **X25519 + AES-256-GCM envelope encryption**, and **Ethereum Sepolia smart contracts**.

---

## 📚 Technical Documentation Index

1. **[01 System Architecture](docs/01_SYSTEM_ARCHITECTURE.md)** — Tripartite boundary (Patient, Hospital, Insurer), data flow diagram, and the 7 critical architectural resolutions.
2. **[02 Cryptography & ZKP](docs/02_CRYPTOGRAPHY_AND_ZKP.md)** — Circom circuit constraints (`claim_eligibility.circom`), BabyJubjub EdDSA signature verification, 10-level Poseidon Merkle tree, integer floor-division proof, and `pot15` trusted setup.
3. **[03 Database & API Spec](docs/03_DATABASE_AND_API_SPEC.md)** — MongoDB Atlas Mongoose schemas, `@node-rs/argon2` authentication, RBAC middleware matrix, 20-second SSE heartbeat protocol, and strict Insurer zero-leakage DTO projection.
4. **[04 Deployment & Runbook](docs/04_DEPLOYMENT_AND_RUNBOOK.md)** — Complete step-by-step Windows PowerShell guide, `.env` configurations, Hardhat deployment, Render backend deployment, and Vercel frontend deployment.

---

## ⚡ Quick Start (Windows PowerShell)

```powershell
# 1. Install workspace dependencies
npm.cmd install

# 2. Compile circuits & run Groth16 pot15 ceremony
npm.cmd --prefix circuits run build

# 3. Compile contracts & run unit/ZK proof tests
npm.cmd --prefix contracts run test

# 4. Run end-to-end verification suite
npm.cmd run verify:e2e

# 5. Seed demo database
npm.cmd --prefix backend run seed

# 6. Start full full-stack application (Hardhat Node + Contracts + Express + Next.js)
npm.cmd run dev:all
```

---

## 🔐 Demo Credentials

| Role | Email | Password | Identifier | Key Capability |
|---|---|---|---|---|
| **Patient** | `patient@healthshield.io` | `Patient@1234` | `POL-HS-2026-9941` | Generates browser-side Groth16 ZKP with 0 PHI leakage |
| **Hospital** | `hospital@healthshield.io` | `Hospital@1234` | `HOSP-APL-8821` | Encapsulates AES-256-GCM EMR & signs with BabyJubjub |
| **Insurer** | `insurer@healthshield.io` | `Insurer@1234` | `INS-4092` | Verifies claims on Sepolia without seeing diagnosis codes |

---

## 🏗️ Monorepo Workspaces

```text
healthshield/
├── docs/                 # Architectural specifications & technical runbooks
├── circuits/             # Circom 2.1.6 Zero-Knowledge claim eligibility circuit
├── contracts/            # Solidity 0.8.20 Hardhat smart contracts (Sepolia)
├── backend/              # Express.js REST API & Real-Time Server-Sent Events
├── frontend/             # Next.js 14 App Router (Patient, Hospital, Insurer Portals)
├── scripts/              # Automated verification & testing scripts
└── package.json          # Root workspace scripts & concurrency orchestration
```

---

## 🛡️ License
MIT License.
