/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope;

// Lazy imports / references inside worker
let snarkjs: any = null;

async function getSnarkJS() {
  if (!snarkjs) {
    // Dynamic import to avoid SSR bundling issues
    // @ts-ignore
    snarkjs = await import("snarkjs");
  }
  return snarkjs;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === "GENERATE_CLAIM_PROOF") {
    try {
      self.postMessage({ type: "PROGRESS", stage: "FETCHING_CIRCUIT_ARTIFACTS", percent: 15 });

      const wasmUrl = new URL("/zkp/v1/claim_eligibility_v1.wasm", self.location.origin).href;
      const zkeyUrl = new URL("/zkp/v1/claim_eligibility_v1_final.zkey", self.location.origin).href;

      self.postMessage({ type: "PROGRESS", stage: "COMPUTING_WITNESS", percent: 40 });

      const snark = await getSnarkJS();

      self.postMessage({ type: "PROGRESS", stage: "GENERATING_GROTH16_PROOF", percent: 70 });

      const { proof, publicSignals } = await snark.groth16.fullProve(
        payload.circuitInputs,
        wasmUrl,
        zkeyUrl
      );

      self.postMessage({ type: "PROGRESS", stage: "PROOF_GENERATED", percent: 100 });

      // Convert proof to format required by Solidity Groth16Verifier:
      // a: [a[0], a[1]]
      // b: [[b[0][1], b[0][0]], [b[1][1], b[1][0]]] (note snarkjs b coordinates inversion for EVM)
      // c: [c[0], c[1]]
      const formattedProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
      };

      self.postMessage({
        type: "SUCCESS",
        proof: formattedProof,
        publicSignals,
      });
    } catch (error: any) {
      console.error("[ZKP Worker] Error during proof generation:", error);
      self.postMessage({
        type: "ERROR",
        error: error.message || "Failed to generate Zero-Knowledge Proof.",
      });
    }
  }
};

export {};
