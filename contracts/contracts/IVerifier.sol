// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice Interface matching snarkjs generated Groth16 Verifier_v1 contract.
 * @dev Fixed 12-element public signal array matching ClaimEligibility circuit.
 */
interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[12] calldata input
    ) external view returns (bool r);
}
