# HealthShield — Deployment Guide & Operational Runbook

## 1. Local Development on Windows (PowerShell)

### Prerequisites
* **Node.js:** v20+ or v22+ LTS installed.
* **npm:** v10+ (runs via `npm.cmd` on Windows PowerShell).
* **Git:** Installed.

### Step 1: Install Dependencies
```powershell
npm.cmd install
```

### Step 2: Build Circuit Assets & Groth16 Setup (pot15)
```powershell
npm.cmd --prefix circuits run build
```
*This compiles `claim_eligibility.circom` with `circom.exe`, runs the `pot15` trusted setup ceremony, exports `Verifier_v1.sol` to `contracts/contracts/`, and copies `.wasm` and `.zkey` into `frontend/public/zkp/v1/`.*

### Step 3: Compile Smart Contracts & Run Tests
```powershell
npm.cmd --prefix contracts run compile
npm.cmd --prefix contracts run test
```

### Step 4: Seed Database
```powershell
npm.cmd --prefix backend run seed
```
*Idempotently seeds patient Aarav Sharma, Apollo Hospital, and HealthSecure Insurer with pre-encrypted EMRs and verified claims.*

### Step 5: Launch All Services Concurrently
```powershell
npm.cmd run dev:all
```
*Starts local Hardhat node (`:8545`), deploys contracts, starts Express backend (`:5000`), and starts Next.js frontend (`:3000`).*

---

## 2. Environment Configuration Reference

### Backend (`backend/.env`)
```bash
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
ALLOW_VERCEL_PREVIEWS=true
MONGODB_URI=mongodb://127.0.0.1:27017/healthshield
JWT_ACCESS_SECRET=e7b4c91038a5d62f40918b2c7e4a1f592d3c8a1b6e4f9d2c8a7b3e1f5a9c2d4e
JWT_REFRESH_SECRET=f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
RECORD_HMAC_SECRET=9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b
SEPOLIA_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SSE_URL=http://localhost:5000/api/v1/sse
NEXT_PUBLIC_SEPOLIA_CHAIN_ID=31337
NEXT_PUBLIC_SEPOLIA_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CLAIM_MANAGER_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### Contracts (`contracts/.env`)
```bash
SEPOLIA_RPC_URL=https://rpc.sepolia.org
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHERSCAN_API_KEY=
```

---

## 3. Render Backend Deployment

1. **Service Type:** Web Service (Node or Docker).
2. **Repository Root:** `backend` (or root using `backend/Dockerfile`).
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start`
5. **Health Check Path:** `/api/v1/health`
6. **Environment Variables:**
   * `NODE_ENV`: `production`
   * `CORS_ORIGIN`: `https://healthshield.vercel.app`
   * `ALLOW_VERCEL_PREVIEWS`: `true`
   * `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   * `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `RECORD_HMAC_SECRET`

---

## 4. Vercel Frontend Deployment

1. **Framework Preset:** Next.js
2. **Root Directory:** `frontend`
3. **Build Command:** `next build`
4. **Environment Variables:**
   * `NEXT_PUBLIC_API_BASE_URL`: `https://healthshield-backend.onrender.com/api/v1`
   * `NEXT_PUBLIC_SSE_URL`: `https://healthshield-backend.onrender.com/api/v1/sse`
   * `NEXT_PUBLIC_SEPOLIA_CHAIN_ID`: `11155111`
   * `NEXT_PUBLIC_SEPOLIA_RPC_URL`: `https://eth-sepolia.g.alchemy.com/v2/...`
   * `NEXT_PUBLIC_REGISTRY_ADDRESS`: `<Deployed Sepolia Registry>`
   * `NEXT_PUBLIC_CLAIM_MANAGER_ADDRESS`: `<Deployed Sepolia ClaimManager>`

---

## 5. Automated Verification Checklist

Execute the complete end-to-end verification suite:
```powershell
npm.cmd run verify:e2e
```
*Validates that Circom R1CS/WASM/zKey artifacts exist, deployments.json matches between backend and frontend, real Groth16 proofs verify on-chain, Insurer zero-leakage projections strip diagnosis codes, and SSE heartbeats are active.*
