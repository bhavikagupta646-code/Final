# HealthShield — Database Schemas & REST/SSE API Specification

## 1. Mongoose Database Schemas (MongoDB Atlas)

### `User` Collection
* Stores authentication credentials, cryptographic identity, and role.
* Password hashes generated via `@node-rs/argon2` (memory: 64MB, iterations: 3, parallelism: 4).
* Stores `x25519PublicKey` for envelope encryption and optional `babyJubjubPublicKey` (`ax`, `ay`) for hospitals.

### `MedicalRecord` Collection
* Stores opaque ciphertext, 12-byte IV, 16-byte auth tag, and 32-byte HMAC-SHA256.
* Multi-recipient `accessList`:
  ```typescript
  accessList: [
    {
      recipientId: string,
      recipientRole: "PATIENT" | "HOSPITAL",
      ephemeralPublicKey: string, // 32-byte hex
      ephemeralIV: string,        // 12-byte hex
      encryptedDEK: string,       // 32-byte encrypted DEK hex
      dekAuthTag: string          // 16-byte hex
    }
  ]
  ```
* Stores hospital BabyJubjub attestation signature: `{ r8x, r8y, s, encounterNonce, timestamp }`.

### `Policy` Collection
* Defines policy coverage parameters:
  * `coverageLimit`: Maximum claimable amount in cents (e.g. 5,000,000 cents = $50,000).
  * `deductible`: Patient share in cents (e.g. 50,000 cents = $500).
  * `coPayBasisPoints`: Co-pay rate (e.g. 2000 bps = 20%).
  * `authorizedDiagnosisRoot`: 10-level Poseidon Merkle root of covered ICD-10 categories.

### `Claim` Collection
* Represents zero-knowledge claims:
  * `nullifier`: Unique anti-replay commitment.
  * `claimedPayout`: Reimbursement amount in cents.
  * `status`: `"DRAFT" | "SUBMITTED" | "VERIFIED_APPROVED" | "SETTLED" | "REJECTED"`.
  * `publicSignals`: Array of exactly 12 public inputs.
  * `proof`: Groth16 curve points `{ pi_a: string[], pi_b: string[][], pi_c: string[] }`.
  * `txHash`: Ethereum Sepolia transaction hash.

### `AuditLog` Collection
* Immutable audit trail: `{ actorId, actorRole, action, resourceId, resourceType, ip, timestamp }`.

---

## 2. Authentication & Authorization Specification

### Dual-Token Lifecycle
* **Access Token:** 15-minute lifespan, signed via HMAC-SHA256 (`HS256`). Sent via `Authorization: Bearer <token>`.
* **Refresh Token:** 7-day lifespan. Transported via HTTP-only cookie (`SameSite=None; Secure` in production; `SameSite=Lax` in development).

### RBAC Middleware Matrix
| Endpoint | Allowed Roles | Description |
|---|---|---|
| `POST /api/v1/auth/register` | Public | Account creation (Patient, Hospital, Insurer) |
| `POST /api/v1/auth/login` | Public | Password verification via Argon2id |
| `POST /api/v1/auth/refresh` | Public (Cookie) | Race-condition free access token renewal |
| `POST /api/v1/records` | `HOSPITAL` | Encapsulate and upload new medical encounter |
| `GET /api/v1/records` | `PATIENT`, `HOSPITAL` | Fetch accessible records (strictly forbidden to `INSURER`) |
| `POST /api/v1/claims` | `PATIENT` | Submit in-browser Groth16 proof and public signals |
| `GET /api/v1/claims` | `PATIENT`, `HOSPITAL`, `INSURER` | Filtered list; Insurers receive sanitized DTO |
| `POST /api/v1/claims/settle` | `INSURER` | Mark claim settled and trigger on-chain disbursement |
| `GET /api/v1/sse` | All Authenticated | Header-authenticated real-time event stream |

---

## 3. Strict Insurer Zero-Leakage DTO Projection

Whenever `req.user.role === 'INSURER'` requests `GET /api/v1/claims`, the backend applies an unalterable sanitization pipeline:

```typescript
// Strict Insurer Zero-Leakage Projection (Mandatory Bug 7)
const sanitized = claims.map((c) => ({
  claimId: c.claimId,
  nullifier: c.nullifier,
  policyId: c.policyId,
  patient: {
    policyNumber: c.patientId?.policyNumber,
    walletAddress: c.patientId?.walletAddress,
  },
  hospital: {
    name: c.hospitalId?.name,
    hospitalId: c.hospitalId?.hospitalId,
    walletAddress: c.hospitalId?.walletAddress,
  },
  claimedPayout: c.claimedPayout,
  status: c.status,
  txHash: c.txHash,
  publicSignals: c.publicSignals,
  submittedAt: c.submittedAt,
  settledAt: c.settledAt,
  // STRIPPED: diagnosisCode, billedAmount, encryptedData, iv, authTag, clinicalNotes
}));
```

---

## 4. Server-Sent Events (SSE) Protocol

* **Transport:** `GET /api/v1/sse` with `Authorization: Bearer <token>` (via `@microsoft/fetch-event-source`).
* **Headers:**
  * `Content-Type: text/event-stream`
  * `Cache-Control: no-cache, no-transform`
  * `Connection: keep-alive`
  * `X-Accel-Buffering: no`
* **Heartbeat:** Comment ping `:heartbeat\n\n` emitted every **20 seconds** to prevent Render proxy timeouts.
* **Events Dispatched:**
  * `CONNECTED`: Initial stream handshake.
  * `NEW_RECORD_AVAILABLE`: Sent to patient when hospital issues an EMR.
  * `CLAIM_SUBMITTED`: Sent to insurer when patient submits a ZK claim.
  * `CLAIM_STATUS_UPDATED`: Sent to patient/hospital upon on-chain verification or settlement.
