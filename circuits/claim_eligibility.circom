pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template ClaimEligibility(MERKLE_DEPTH) {
    // ------------------------------------------------------------------------
    // 1. PUBLIC SIGNALS (Exposed to Blockchain Verifier & Insurer)
    // ------------------------------------------------------------------------
    signal input authorizedDiagnosisRoot; // 1. Merkle root of covered ICD-10 categories
    signal input hospitalAx;              // 2. Hospital BabyJubjub Public Key X
    signal input hospitalAy;              // 3. Hospital BabyJubjub Public Key Y
    signal input policyCoverageLimit;     // 4. Max policy coverage in cents
    signal input policyDeductible;        // 5. Policy deductible in cents
    signal input coPayBasisPoints;        // 6. Co-pay in basis points (e.g., 2000 = 20%)
    signal input claimedPayout;           // 7. Public reimbursement requested (cents)
    signal input nullifier;               // 8. Unique anti-replay nullifier
    signal input policyId;                // 9. Unique policy identifier
    signal input patientAddress;          // 10. Patient's Ethereum address
    signal input hospitalAddress;         // 11. Hospital's Ethereum address
    signal input insurerAddress;          // 12. Insurer's Ethereum address

    // ------------------------------------------------------------------------
    // 2. PRIVATE SIGNALS (Witness only - strictly kept on client)
    // ------------------------------------------------------------------------
    signal input billedAmount;            // Private billed amount in cents
    signal input diagnosisCode;           // Private numeric ICD-10 encoding
    signal input timestamp;               // Encounter timestamp
    signal input encounterNonce;          // Unique encounter nonce from hospital
    signal input patientIdCommitment;     // Patient Poseidon commitment
    signal input sigR8x;                  // Hospital EdDSA Signature R8x
    signal input sigR8y;                  // Hospital EdDSA Signature R8y
    signal input sigS;                    // Hospital EdDSA Signature S
    signal input merklePathElements[MERKLE_DEPTH]; // Sibling hashes in Merkle tree
    signal input merklePathIndices[MERKLE_DEPTH];  // 0 = left child, 1 = right child
    signal input patientSecret;           // Patient's private key/secret
    signal input claimNonce;              // Nonce to generate distinct nullifier

    // ------------------------------------------------------------------------
    // 3. CONSTRAINT: Authentic Hospital Attestation (EdDSA on BabyJubjub)
    // ------------------------------------------------------------------------
    // Compute encounter hash M = Poseidon(patientIdCommitment, diagnosisCode, billedAmount, timestamp, encounterNonce)
    component encounterHasher = Poseidon(5);
    encounterHasher.inputs[0] <== patientIdCommitment;
    encounterHasher.inputs[1] <== diagnosisCode;
    encounterHasher.inputs[2] <== billedAmount;
    encounterHasher.inputs[3] <== timestamp;
    encounterHasher.inputs[4] <== encounterNonce;

    component eddsaVerifier = EdDSAPoseidonVerifier();
    eddsaVerifier.enabled <== 1;
    eddsaVerifier.Ax <== hospitalAx;
    eddsaVerifier.Ay <== hospitalAy;
    eddsaVerifier.R8x <== sigR8x;
    eddsaVerifier.R8y <== sigR8y;
    eddsaVerifier.S <== sigS;
    eddsaVerifier.M <== encounterHasher.out;

    // ------------------------------------------------------------------------
    // 4. CONSTRAINT: Diagnosis Membership in Authorized Whitelist Merkle Tree
    // ------------------------------------------------------------------------
    component leafHasher = Poseidon(1);
    leafHasher.inputs[0] <== diagnosisCode;

    signal currentHash[MERKLE_DEPTH + 1];
    currentHash[0] <== leafHasher.out;

    component nodeHashers[MERKLE_DEPTH];
    for (var i = 0; i < MERKLE_DEPTH; i++) {
        // Enforce boolean index: merklePathIndices[i] must be 0 or 1
        merklePathIndices[i] * (1 - merklePathIndices[i]) === 0;

        nodeHashers[i] = Poseidon(2);
        // If index == 0: left = currentHash[i], right = sibling
        // If index == 1: left = sibling, right = currentHash[i]
        nodeHashers[i].inputs[0] <== currentHash[i] + merklePathIndices[i] * (merklePathElements[i] - currentHash[i]);
        nodeHashers[i].inputs[1] <== merklePathElements[i] + merklePathIndices[i] * (currentHash[i] - merklePathElements[i]);

        currentHash[i + 1] <== nodeHashers[i].out;
    }
    // Verify computed root equals the public authorizedDiagnosisRoot
    currentHash[MERKLE_DEPTH] === authorizedDiagnosisRoot;

    // ------------------------------------------------------------------------
    // 5. CONSTRAINT: Financial Deductible & Policy Coverage Rules
    // ------------------------------------------------------------------------
    // Check 1: billedAmount >= policyDeductible
    component dedCheck = GreaterEqThan(64);
    dedCheck.in[0] <== billedAmount;
    dedCheck.in[1] <== policyDeductible;
    dedCheck.out === 1;

    // Check 2: effectiveBill = min(billedAmount, policyCoverageLimit)
    component capCheck = LessThan(64);
    capCheck.in[0] <== billedAmount;
    capCheck.in[1] <== policyCoverageLimit;

    signal effectiveBill;
    effectiveBill <== capCheck.out * (billedAmount - policyCoverageLimit) + policyCoverageLimit;

    // Reimbursable base = effectiveBill - policyDeductible
    signal reimbursableBase;
    reimbursableBase <== effectiveBill - policyDeductible;

    // ------------------------------------------------------------------------
    // 6. MANDATORY FIX 1: Integer Floor Division & Remainder Check
    // ------------------------------------------------------------------------
    // coPayBasisPoints is e.g. 2000 for 20%. Insurer pays (10000 - coPayBasisPoints)/10000
    signal payoutMultiplier;
    payoutMultiplier <== 10000 - coPayBasisPoints;

    signal rawProduct;
    rawProduct <== reimbursableBase * payoutMultiplier;

    signal remainder;
    remainder <-- rawProduct % 10000;

    claimedPayout * 10000 + remainder === rawProduct;

    component remCheck = LessThan(16);
    remCheck.in[0] <== remainder;
    remCheck.in[1] <== 10000;
    remCheck.out === 1;

    // ------------------------------------------------------------------------
    // 7. CONSTRAINT: Unique Anti-Replay Nullifier
    // ------------------------------------------------------------------------
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== patientSecret;
    nullifierHasher.inputs[1] <== policyId;
    nullifierHasher.inputs[2] <== claimNonce;
    nullifier === nullifierHasher.out;

    // ------------------------------------------------------------------------
    // 8. CONSTRAINT: Cryptographic Binding of Public Entity Addresses
    // ------------------------------------------------------------------------
    component contextHasher = Poseidon(4);
    contextHasher.inputs[0] <== patientAddress;
    contextHasher.inputs[1] <== hospitalAddress;
    contextHasher.inputs[2] <== insurerAddress;
    contextHasher.inputs[3] <== policyId;

    signal contextHash;
    contextHash <== contextHasher.out;
    signal dummyConstraint;
    dummyConstraint <== contextHash * contextHash;
}

// Exactly 12 public inputs exposed in this strict order
component main {public [
    authorizedDiagnosisRoot,
    hospitalAx,
    hospitalAy,
    policyCoverageLimit,
    policyDeductible,
    coPayBasisPoints,
    claimedPayout,
    nullifier,
    policyId,
    patientAddress,
    hospitalAddress,
    insurerAddress
]} = ClaimEligibility(10);
