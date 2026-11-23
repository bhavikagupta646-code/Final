// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVerifier.sol";

/**
 * @title MockVerifier
 * @notice Test verifier for unit testing and local deployment validation before circuit compilation.
 */
contract MockVerifier is IVerifier {
    bool public shouldPass = true;

    function setShouldPass(bool _pass) external {
        shouldPass = _pass;
    }

    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[12] calldata
    ) external view override returns (bool r) {
        return shouldPass;
    }
}
