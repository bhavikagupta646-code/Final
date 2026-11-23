// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HealthShieldRegistry.sol";
import "./IVerifier.sol";

/**
 * @title InsuranceClaimManager
 * @notice Manages zero-knowledge verified insurance claims on Ethereum Sepolia.
 */
contract InsuranceClaimManager is ReentrancyGuard, Ownable {
    HealthShieldRegistry public registry;
    IVerifier public verifier;

    enum ClaimStatus {
        NONE,
        VERIFIED_APPROVED,
        SETTLED,
        REJECTED
    }

    struct Claim {
        uint256 nullifier;
        uint256 policyId;
        address patient;
        address hospital;
        address insurer;
        uint256 claimedPayout;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 settledAt;
    }

    // Public inputs mapping index constants matching claim_eligibility.circom
    uint256 public constant IDX_AUTH_ROOT = 0;
    uint256 public constant IDX_HOSP_AX = 1;
    uint256 public constant IDX_HOSP_AY = 2;
    uint256 public constant IDX_POLICY_LIMIT = 3;
    uint256 public constant IDX_DEDUCTIBLE = 4;
    uint256 public constant IDX_COPAY_BPS = 5;
    uint256 public constant IDX_CLAIMED_PAYOUT = 6;
    uint256 public constant IDX_NULLIFIER = 7;
    uint256 public constant IDX_POLICY_ID = 8;
    uint256 public constant IDX_PATIENT_ADDR = 9;
    uint256 public constant IDX_HOSP_ADDR = 10;
    uint256 public constant IDX_INSURER_ADDR = 11;

    // Anti-replay nullifier registry
    mapping(uint256 => bool) public nullifiers;

    // Claims storage indexed by nullifier
    mapping(uint256 => Claim) public claims;

    // Events
    event ClaimSubmittedAndApproved(
        uint256 indexed nullifier,
        uint256 indexed policyId,
        address indexed patient,
        address hospital,
        address insurer,
        uint256 claimedPayout,
        uint256 timestamp
    );

    event ClaimSettled(
        uint256 indexed nullifier,
        address indexed insurer,
        uint256 payoutAmount,
        uint256 timestamp
    );

    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event RegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    // Custom Errors
    error NullifierAlreadySpent(uint256 nullifier);
    error InvalidZKProof();
    error HospitalNotCertified(address hospital, uint256 ax, uint256 ay);
    error InsurerNotAuthorized(address insurer);
    error InvalidCaller();
    error ClaimNotFound(uint256 nullifier);
    error ClaimAlreadySettled(uint256 nullifier);

    constructor(address _registry, address _verifier) Ownable(msg.sender) {
        registry = HealthShieldRegistry(_registry);
        verifier = IVerifier(_verifier);
    }

    /**
     * @notice Submit and verify a Zero-Knowledge insurance claim with Groth16 proof
     * @param a Groth16 proof element A
     * @param b Groth16 proof element B
     * @param c Groth16 proof element C
     * @param pubSignals Exactly 12 public signals matching ClaimEligibility circuit
     */
    function submitClaim(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[12] calldata pubSignals
    ) external nonReentrant returns (bool) {
        uint256 nullifier = pubSignals[IDX_NULLIFIER];
        if (nullifiers[nullifier]) revert NullifierAlreadySpent(nullifier);

        address patient = address(uint160(pubSignals[IDX_PATIENT_ADDR]));
        address hospital = address(uint160(pubSignals[IDX_HOSP_ADDR]));
        address insurer = address(uint160(pubSignals[IDX_INSURER_ADDR]));

        // Validate submitter is either the patient or authorized relayer
        if (msg.sender != patient && msg.sender != owner()) {
            revert InvalidCaller();
        }

        // Verify Hospital authenticity in HealthShieldRegistry
        uint256 hospAx = pubSignals[IDX_HOSP_AX];
        uint256 hospAy = pubSignals[IDX_HOSP_AY];
        if (!registry.isHospitalCertified(hospital, hospAx, hospAy)) {
            revert HospitalNotCertified(hospital, hospAx, hospAy);
        }

        // Verify Insurer authorization in HealthShieldRegistry
        if (!registry.isInsurerAuthorized(insurer)) {
            revert InsurerNotAuthorized(insurer);
        }

        // Verify Groth16 pairing check on-chain
        bool isValid = verifier.verifyProof(a, b, c, pubSignals);
        if (!isValid) revert InvalidZKProof();

        // Mark nullifier as spent to prevent double-spending / claim replays
        nullifiers[nullifier] = true;

        uint256 policyId = pubSignals[IDX_POLICY_ID];
        uint256 payout = pubSignals[IDX_CLAIMED_PAYOUT];

        claims[nullifier] = Claim({
            nullifier: nullifier,
            policyId: policyId,
            patient: patient,
            hospital: hospital,
            insurer: insurer,
            claimedPayout: payout,
            status: ClaimStatus.VERIFIED_APPROVED,
            submittedAt: block.timestamp,
            settledAt: 0
        });

        emit ClaimSubmittedAndApproved(
            nullifier,
            policyId,
            patient,
            hospital,
            insurer,
            payout,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Insurer settles and marks claim as paid
     */
    function settleClaim(uint256 _nullifier) external nonReentrant {
        Claim storage claim = claims[_nullifier];
        if (claim.status == ClaimStatus.NONE) revert ClaimNotFound(_nullifier);
        if (claim.status == ClaimStatus.SETTLED) revert ClaimAlreadySettled(_nullifier);
        if (msg.sender != claim.insurer && msg.sender != owner()) revert InvalidCaller();

        claim.status = ClaimStatus.SETTLED;
        claim.settledAt = block.timestamp;

        emit ClaimSettled(_nullifier, msg.sender, claim.claimedPayout, block.timestamp);
    }

    /**
     * @notice Check whether a claim nullifier has already been spent
     */
    function isClaimSpent(uint256 _nullifier) external view returns (bool) {
        return nullifiers[_nullifier];
    }

    /**
     * @notice Retrieve claim details
     */
    function getClaim(uint256 _nullifier) external view returns (Claim memory) {
        return claims[_nullifier];
    }

    /**
     * @notice Admin update for verifier contract
     */
    function setVerifier(address _newVerifier) external onlyOwner {
        emit VerifierUpdated(address(verifier), _newVerifier);
        verifier = IVerifier(_newVerifier);
    }

    /**
     * @notice Admin update for registry contract
     */
    function setRegistry(address _newRegistry) external onlyOwner {
        emit RegistryUpdated(address(registry), _newRegistry);
        registry = HealthShieldRegistry(_newRegistry);
    }
}
