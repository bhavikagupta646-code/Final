import { Request, Response } from "express";
import { Claim } from "../models/Claim.model";
import { Policy } from "../models/Policy.model";
import { AuditLog } from "../models/AuditLog.model";
import { BlockchainService } from "../services/blockchain.service";
import { SSEService } from "../services/sse.service";
import { UserRole } from "../constants/roles";

export class ClaimController {
  /**
   * Patient submits Zero-Knowledge Proof for insurance claim
   */
  static async submitClaim(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = req.user!;
      const { proof, publicSignals, policyId, hospitalWallet, insurerWallet } = req.body;

      if (!proof || !publicSignals || publicSignals.length !== 12 || !policyId) {
        res.status(400).json({
          success: false,
          error: "Invalid claim submission: Groth16 proof and exactly 12 public signals are required.",
        });
        return;
      }

      const nullifier = publicSignals[7];
      const claimedPayoutCents = parseInt(publicSignals[6], 10);

      // Check anti-replay double-spending in database
      const existingClaim = await Claim.findOne({ nullifier });
      if (existingClaim) {
        res.status(409).json({ success: false, error: "Nullifier already spent. Double-spending attempt detected." });
        return;
      }

      // Check anti-replay double-spending on-chain
      const isSpentOnChain = await BlockchainService.isClaimSpent(nullifier);
      if (isSpentOnChain) {
        res.status(409).json({ success: false, error: "Claim nullifier already finalized on blockchain." });
        return;
      }

      // Verify and submit on-chain via Relayer
      const onChainResult = await BlockchainService.submitClaimOnChain(
        proof.a,
        proof.b,
        proof.c,
        publicSignals
      );

      const claimId = `CLM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

      const claim = await Claim.create({
        claimId,
        nullifier,
        policyId,
        patientWallet: patientUser.walletAddress.toLowerCase(),
        hospitalWallet: (hospitalWallet || "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc").toLowerCase(),
        insurerWallet: (insurerWallet || "0x90f79bf6eb2c4f870365e785982e1f101e93b906").toLowerCase(),
        claimedPayoutCents,
        status: "VERIFIED_APPROVED",
        proof,
        publicSignals,
        onChainTxHash: onChainResult.txHash || "0x" + "a".repeat(64),
        submittedAt: new Date(),
      });

      // Audit log
      await AuditLog.create({
        eventType: "CLAIM_SUBMITTED_AND_VERIFIED",
        actorWallet: patientUser.walletAddress,
        actorRole: patientUser.role,
        targetResource: "Claim",
        resourceId: claim.claimId,
        details: { nullifier, payoutCents: claimedPayoutCents },
      });

      // Real-time alert to Insurer
      SSEService.sendToUser(claim.insurerWallet, "NEW_CLAIM_PENDING_SETTLEMENT", {
        claimId: claim.claimId,
        policyId: claim.policyId,
        claimedPayoutCents: claim.claimedPayoutCents,
        nullifier: claim.nullifier,
        submittedAt: claim.submittedAt,
      });

      res.status(201).json({
        success: true,
        data: {
          claimId: claim.claimId,
          nullifier: claim.nullifier,
          status: claim.status,
          claimedPayoutCents: claim.claimedPayoutCents,
          onChainTxHash: claim.onChainTxHash,
        },
      });
    } catch (err: any) {
      console.error("[ClaimController.submitClaim] Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to submit claim." });
    }
  }

  /**
   * Retrieves claims with role-based zero-leakage projection
   */
  static async getClaims(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      let filter: any = {};

      if (user.role === UserRole.PATIENT) {
        filter = { patientWallet: user.walletAddress.toLowerCase() };
      } else if (user.role === UserRole.INSURER) {
        filter = { insurerWallet: user.walletAddress.toLowerCase() };
      } else if (user.role === UserRole.HOSPITAL) {
        filter = { hospitalWallet: user.walletAddress.toLowerCase() };
      }

      const claims = await Claim.find(filter).sort({ submittedAt: -1 });

      // Insurer projection: STRICT ZERO-LEAKAGE (NO clinical data, ONLY cryptographic signals)
      if (user.role === UserRole.INSURER) {
        const sanitized = claims.map((c) => ({
          claimId: c.claimId,
          nullifier: c.nullifier,
          policyId: c.policyId,
          patientWallet: c.patientWallet,
          claimedPayoutCents: c.claimedPayoutCents,
          status: c.status,
          onChainTxHash: c.onChainTxHash,
          submittedAt: c.submittedAt,
          settledAt: c.settledAt,
        }));
        res.status(200).json({ success: true, data: { claims: sanitized } });
        return;
      }

      res.status(200).json({ success: true, data: { claims } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Insurer settles an approved claim
   */
  static async settleClaim(req: Request, res: Response): Promise<void> {
    try {
      const insurerUser = req.user!;
      const { claimId } = req.params;

      const claim = await Claim.findOne({ claimId });
      if (!claim) {
        res.status(404).json({ success: false, error: "Claim not found." });
        return;
      }

      if (insurerUser.role !== UserRole.ADMIN && claim.insurerWallet.toLowerCase() !== insurerUser.walletAddress.toLowerCase()) {
        res.status(403).json({ success: false, error: "Unauthorized: not your assigned claim." });
        return;
      }

      if (claim.status === "SETTLED") {
        res.status(400).json({ success: false, error: "Claim is already settled." });
        return;
      }

      claim.status = "SETTLED";
      claim.settledAt = new Date();
      await claim.save();

      // Audit log
      await AuditLog.create({
        eventType: "CLAIM_SETTLED",
        actorWallet: insurerUser.walletAddress,
        actorRole: insurerUser.role,
        targetResource: "Claim",
        resourceId: claim.claimId,
      });

      // Real-time alert to Patient
      SSEService.sendToUser(claim.patientWallet, "CLAIM_SETTLED", {
        claimId: claim.claimId,
        payoutAmountCents: claim.claimedPayoutCents,
        settledAt: claim.settledAt,
      });

      res.status(200).json({
        success: true,
        data: {
          claimId: claim.claimId,
          status: claim.status,
          settledAt: claim.settledAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
