import { claimManagerContract, registryContract } from "../config/web3";

export class BlockchainService {
  /**
   * Checks if hospital is certified in registry
   */
  static async isHospitalCertified(hospitalAddress: string, ax: string, ay: string): Promise<boolean> {
    try {
      return await registryContract.isHospitalCertified(hospitalAddress, BigInt(ax), BigInt(ay));
    } catch (error) {
      console.error("[BlockchainService] Error checking hospital certification:", error);
      return false;
    }
  }

  /**
   * Checks if insurer is authorized in registry
   */
  static async isInsurerAuthorized(insurerAddress: string): Promise<boolean> {
    try {
      return await registryContract.isInsurerAuthorized(insurerAddress);
    } catch (error) {
      console.error("[BlockchainService] Error checking insurer authorization:", error);
      return false;
    }
  }

  /**
   * Checks if nullifier has already been spent on-chain
   */
  static async isClaimSpent(nullifier: string): Promise<boolean> {
    try {
      return await claimManagerContract.isClaimSpent(BigInt(nullifier));
    } catch (error) {
      console.error("[BlockchainService] Error checking nullifier:", error);
      return false;
    }
  }

  /**
   * Submits verified Groth16 claim proof to the on-chain InsuranceClaimManager contract
   */
  static async submitClaimOnChain(
    a: [string, string],
    b: [[string, string], [string, string]],
    c: [string, string],
    pubSignals: string[]
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const formattedA: [bigint, bigint] = [BigInt(a[0]), BigInt(a[1])];
      const formattedB: [[bigint, bigint], [bigint, bigint]] = [
        [BigInt(b[0][0]), BigInt(b[0][1])],
        [BigInt(b[1][0]), BigInt(b[1][1])],
      ];
      const formattedC: [bigint, bigint] = [BigInt(c[0]), BigInt(c[1])];
      const formattedSignals = pubSignals.map((s) => BigInt(s));

      const tx = await claimManagerContract.submitClaim(formattedA, formattedB, formattedC, formattedSignals);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      console.warn("[BlockchainService] On-chain submission failed or mocked for offline dev:", err.message);
      return { success: false, error: err.message };
    }
  }
}
