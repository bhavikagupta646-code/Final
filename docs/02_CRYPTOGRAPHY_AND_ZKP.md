# HealthShield — Cryptography & Zero-Knowledge Proof Specification

## 1. Zero-Knowledge Circuit Specification (`claim_eligibility.circom`)

The core zero-knowledge circuit is written in **Circom 2.1.6** and operates over the **BN254 (alt_bn128)** scalar field $\mathbb{F}_r$, where:
$$r = 21888242871839275222246405745257275088548364400416034343698204186575808495617$$

### Public Signals (Exposed to EVM & Insurer)
```circom
signal input authorizedDiagnosisRoot; // [0] Merkle root of covered ICD-10 categories
signal input hospitalAx;              // [1] Hospital BabyJubjub Public Key X
signal input hospitalAy;              // [2] Hospital BabyJubjub Public Key Y
signal input policyCoverageLimit;     // [3] Policy cap in cents ($50,000 = 5,000,000)
signal input policyDeductible;        // [4] Deductible in cents ($500 = 50,000)
signal input coPayBasisPoints;        // [5] Co-pay in bps (2000 = 20%)
signal input claimedPayout;           // [6] Public reimbursement amount (cents)
signal input nullifier;               // [7] Unique anti-replay hash
signal input policyId;                // [8] Policy identifier
signal input patientAddress;          // [9] Patient Ethereum address
signal input hospitalAddress;         // [10] Hospital Ethereum address
signal input insurerAddress;          // [11] Insurer Ethereum address
```

### Private Signals (Witness strictly kept on client)
```circom
signal input billedAmount;            // Private billed amount in cents
signal input diagnosisCode;           // Private numeric ICD-10 encoding
signal input timestamp;               // Encounter timestamp
signal input encounterNonce;          // Unique encounter nonce from hospital
signal input patientIdCommitment;     // Patient Poseidon commitment
signal input sigR8x;                  // Hospital EdDSA Signature R8x
signal input sigR8y;                  // Hospital EdDSA Signature R8y
signal input sigS;                    // Hospital EdDSA Signature S
signal input merklePathElements[10];  // Merkle sibling hashes
signal input merklePathIndices[10];   // 0 = left child, 1 = right child
signal input patientSecret;           // Patient private salt/secret
signal input claimNonce;              // Claim-specific nonce
```

---

## 2. Mathematical Constraint Formulations

### A. Authentic Hospital Attestation (BabyJubjub EdDSA)
The hospital signs the encounter hash $M$:
$$M = \text{Poseidon5}(patientIdCommitment, diagnosisCode, billedAmount, timestamp, encounterNonce)$$
The circuit instantiates `EdDSAPoseidonVerifier()` from `circomlib`:
$$\text{VerifyEdDSA}(Ax, Ay, R_{8x}, R_{8y}, S, M) \equiv 1$$

### B. Diagnosis Whitelist (10-Level Poseidon Merkle Tree)
Authorized diagnosis categories are committed into a depth-10 Merkle tree:
$$\text{leaf} = \text{Poseidon1}(diagnosisCode)$$
For $i = 0 \dots 9$:
$$\text{node}[i+1] = \text{Poseidon2}(\text{select}(\text{current}, \text{sibling}, \text{index}), \text{select}(\text{sibling}, \text{current}, \text{index}))$$
$$\text{node}[10] \equiv \text{authorizedDiagnosisRoot}$$

### C. Financial Deductible & Floor-Division Payout Formula
To ensure exact reimbursement without revealing the raw `billedAmount`:
1. **Deductible Verification:**
   $$\text{GreaterEqThan}(64)(billedAmount, policyDeductible) \equiv 1$$
2. **Coverage Cap Minimum:**
   $$effectiveBill = \min(billedAmount, policyCoverageLimit)$$
   $$reimbursableBase = effectiveBill - policyDeductible$$
3. **Mandatory Integer Remainder Verification:**
   $$rawProduct = reimbursableBase \times (10000 - coPayBasisPoints)$$
   $$remainder \leftarrow rawProduct \pmod{10000}$$
   $$claimedPayout \times 10000 + remainder \equiv rawProduct$$
   $$\text{LessThan}(16)(remainder, 10000) \equiv 1$$

### D. Anti-Replay Nullifier & Context Binding
$$nullifier \equiv \text{Poseidon3}(patientSecret, policyId, claimNonce)$$
$$contextHash \equiv \text{Poseidon4}(patientAddress, hospitalAddress, insurerAddress, policyId)$$

---

## 3. Powers-of-Tau Ceremony & Groth16 Setup (`pot15`)

Because the circuit contains **7,877 non-linear constraints**, compiling under standard `pot12` ($2^{12} = 4,096$) triggers an allocation failure. The ceremony is configured for **`pot15`** ($2^{15} = 32,768$ constraints):

1. `snarkjs powersoftau new bn128 15 pot15_0000.ptau`
2. `snarkjs powersoftau contribute pot15_0000.ptau pot15_0001.ptau`
3. `snarkjs powersoftau prepare phase2 pot15_0001.ptau pot15_final.ptau`
4. `snarkjs groth16 setup claim_eligibility.r1cs pot15_final.ptau claim_eligibility_v1_0000.zkey`
5. `snarkjs zkey contribute claim_eligibility_v1_0000.zkey claim_eligibility_v1_final.zkey`
6. `snarkjs zkey export verificationkey claim_eligibility_v1_final.zkey verification_key_v1.json`
7. `snarkjs zkey export solidityverifier claim_eligibility_v1_final.zkey Verifier_v1.sol`

---

## 4. Multi-Recipient Envelope Encryption Scheme

To protect patient records at rest in MongoDB Atlas:

```
                            Raw Clinical Encounter JSON
                                         │
                           Generate Random 256-bit DEK
                                         │
                                         ▼
                     +───────────────────────────────────────+
                     │        AES-256-GCM Encryption         │
                     │          (96-bit Random IV)           │
                     +───────────────────────────────────────+
                                      │      │
                           Ciphertext │      │ 128-bit Auth Tag
                                      ▼      ▼
                     +───────────────────────────────────────+
                     │     Encapsulated Medical Record       │
                     +───────────────────────────────────────+

  Key Encapsulation Mechanism (Per Authorized Recipient: Patient & Hospital):
  ============================================================================
  1. Generate Ephemeral X25519 Keypair (32 bytes private, 32 bytes public).
  2. Perform Diffie-Hellman Key Exchange:
     SS = X25519(ephemeralPrivKey, recipientPubKey)
  3. Derive Key Encryption Key:
     KEK = HKDF-SHA256(SS, salt="HealthShield-Salt", info="HealthShield-EMR-v1", length=32)
  4. Encrypt DEK with KEK:
     encryptedDEK = AES-256-GCM(KEK, DEK, ephemeralIV)
  5. Compute HMAC-SHA256:
     HMAC = HMAC-SHA256(IV || Ciphertext || AuthTag || JSON(accessList), secret)
```
