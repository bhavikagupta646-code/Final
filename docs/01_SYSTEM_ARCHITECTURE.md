# HealthShield — System Architecture & Tripartite Privacy Model

## 1. Executive Summary & Core Objective

HealthShield is a production-grade, privacy-preserving healthcare electronic medical record (EMR) and zero-knowledge insurance claim platform. The platform eliminates the systemic exposure of sensitive Protected Health Information (PHI)—such as ICD-10 diagnosis codes, exact clinical notes, and granular billing lines—during the insurance claim reimbursement process.

Through a combination of:
* Client-side **Groth16 Zero-Knowledge Proofs (BN254 curve)**
* Multi-recipient **X25519 + AES-256-GCM authenticated envelope encryption**
* Ethereum Sepolia smart contracts (`HealthShieldRegistry.sol`, `Groth16Verifier.sol`, `InsuranceClaimManager.sol`)
* High-concurrency **Server-Sent Events (SSE)** with 20-second proxy-proof heartbeats

HealthShield guarantees that an insurance provider can mathematically verify claim eligibility and payout formulas without ever possessing the underlying patient medical records.

---

## 2. Zero-Trust Tripartite Boundary

The platform establishes three strictly isolated operational domains:

```
+---------------------------------------------------------------------------------------------------+
|                                     HEALTHSHIELD TRUST DOMAINS                                    |
+------------------------------------+--------------------------------+-----------------------------+
|          1. PATIENT DOMAIN         |       2. HOSPITAL DOMAIN       |     3. INSURER DOMAIN       |
+------------------------------------+--------------------------------+-----------------------------+
| • Sovereign Identity Owner         | • Licensed Encounter Authority | • Coverage Underwriter      |
| • Holds X25519 Private Key         | • Holds Certified BabyJubjub   | • Holds Smart Contract Cap  |
| • Generates Client ZKP in Browser  |   Signing Keypair              | • Adjudicates Payout Amount |
| • Retains 100% PHI Confidentiality | • Encrypts EMR via AES-256-GCM | • Zero Access to Diagnosis  |
| • Receives Real-Time SSE Payouts   | • Signs Encounter Hash M       |   Codes or Raw EMRs         |
+------------------------------------+--------------------------------+-----------------------------+
```

### Tripartite Data Flow Architecture

```
  [1. Hospital Portal]
         │
         ├─► 1. Authors Clinical Encounter (Diagnosis, Notes, Amount)
         ├─► 2. Encapsulates via AES-256-GCM (DEK) & Encrypts DEK for Patient + Hospital (X25519)
         ├─► 3. Signs Encounter Hash M via BabyJubjub EdDSA: sig = (R8x, R8y, S)
         ├─► 4. Uploads Ciphertext Envelope to Express Backend & MongoDB Atlas
         │
         ▼
  [Express API & MongoDB Atlas] ──── SSE Broadcast ────► [2. Patient Portal]
                                                               │
         ┌─────────────────────────────────────────────────────┘
         │
         ├─► 5. Fetches Encrypted Record Envelope & Verifies HMAC-SHA256
         ├─► 6. Decrypts DEK using Patient's Private Key
         ├─► 7. Spawns Dedicated Web Worker (`zkp.worker.ts`)
         ├─► 8. Generates Groth16 Proof (BN254) with 12 Public Signals:
         │      - Proves Diagnosis in Merkle Whitelist (Poseidon, Depth 10)
         │      - Proves Valid Hospital EdDSA Signature
         │      - Proves Billed Amount >= Deductible & Calculates Payout
         │      - Computes Unique Anti-Replay Nullifier
         ├─► 9. Transmits Proof pi=[A, B, C] & 12 Public Signals to Sepolia / Express
         │
         ▼
  [Ethereum Sepolia: InsuranceClaimManager.sol]
         │
         ├─► 10. Asserts Hospital Ax, Ay registered in HealthShieldRegistry.sol
         ├─► 11. Executes On-Chain Groth16 Pairing Check via Groth16Verifier.sol
         ├─► 12. Enforces Nullifier Single-Use (Reverts on Replay)
         ├─► 13. Stores Verified Claim State & Emits ClaimSubmittedAndApproved Event
         │
         ▼
  [3. Insurance Provider Portal] ◄─── SSE Event ──── Express Web3 Listener
         │
         └─► 14. Reviews Claim under Strict Insurer Zero-Leakage DTO
                 (Sees ONLY: Claimed Payout, Status, Nullifier, Certified Hospital)
                 (ZERO exposure of diagnosis codes or medical text)
```

---

## 3. The 7 Critical Cryptographic & Build Resolutions

1. **Circom Integer Remainder Constraint (`circuits/claim_eligibility.circom`):**
   * *Resolution:* Eliminated field division `/`. Enforced integer floor division using multiplication + remainder verification: `claimedPayout * 10000 + remainder === rawProduct` with `LessThan(16)` ensuring `remainder < 10000`.
2. **Powers-of-Tau Capacity (`pot15`):**
   * *Resolution:* Upgraded ceremony from `pot12` ($2^{12} = 4,096$) to `pot15` ($2^{15} = 32,768$ constraints). Accommodates the 7,877 non-linear constraints of `EdDSAPoseidonVerifier` + 10-level Merkle tree without overflow.
3. **Fixed 12-Element Public Signals ABI:**
   * *Resolution:* `contracts/contracts/IVerifier.sol` and `InsuranceClaimManager.sol` explicitly declare `uint256[12] calldata pubSignals` matching `Groth16Verifier.sol` generated by `snarkjs`.
4. **Windows-Native Password Hashing:**
   * *Resolution:* Adopted `@node-rs/argon2` with precompiled Rust SIMD binaries, eliminating MSVC C++ toolchain installation errors on Windows.
5. **Next.js 14 Webpack & Web Worker Engine:**
   * *Resolution:* Configured `webpack.resolve.fallback` for `fs`, `path`, `crypto`, `readline`, `worker_threads`. Isolated `snarkjs.groth16.fullProve` inside `zkp.worker.ts` with dynamic asset fetching over HTTP.
6. **Header-Authenticated Real-Time SSE:**
   * *Resolution:* Frontend utilizes `@microsoft/fetch-event-source` passing `Authorization: Bearer <token>`. Backend controller applies `X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`, and emits `:heartbeat\n\n` every 20 seconds.
7. **Strict Insurer Zero-Leakage DTO Projection:**
   * *Resolution:* Backend controller physically sanitizes payloads returned to `req.user.role === 'INSURER'`, stripping all diagnosis codes, billed amounts, clinical narratives, and raw ciphertext.
