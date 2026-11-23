import { ethers } from "ethers";
import { ENV } from "./env";

export const web3Provider = new ethers.JsonRpcProvider(
  ENV.ETHEREUM_RPC_URL,
  undefined,
  { staticNetwork: true }
);

export const relayerWallet = new ethers.Wallet(ENV.RELAYER_PRIVATE_KEY, web3Provider);

export const REGISTRY_ABI = [
  "function isHospitalCertified(address hospital, uint256 ax, uint256 ay) view returns (bool)",
  "function isInsurerAuthorized(address insurer) view returns (bool)",
  "function registerHospital(address hospital, string licenseNumber, string name, uint256 ax, uint256 ay)",
  "function registerInsurer(address insurer, string licenseNumber, string name)",
];

export const CLAIM_MANAGER_ABI = [
  "function submitClaim(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[12] calldata pubSignals) returns (bool)",
  "function isClaimSpent(uint256 nullifier) view returns (bool)",
  "function getClaim(uint256 nullifier) view returns (tuple(uint256 nullifier, uint256 policyId, address patient, address hospital, address insurer, uint256 claimedPayout, uint8 status, uint256 submittedAt, uint256 settledAt))",
  "function settleClaim(uint256 nullifier) returns (bool)",
];

export const registryContract = new ethers.Contract(ENV.REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI, relayerWallet);
export const claimManagerContract = new ethers.Contract(ENV.CLAIM_MANAGER_CONTRACT_ADDRESS, CLAIM_MANAGER_ABI, relayerWallet);
