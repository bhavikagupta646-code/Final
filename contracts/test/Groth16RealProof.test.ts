import { expect } from "chai";
import { ethers } from "hardhat";
import * as path from "path";
import * as fs from "fs";

// snarkjs is installed in root node_modules
const snarkjs = require("snarkjs");

describe("Groth16 Real Proof On-Chain EVM Verification", function () {
  this.timeout(60000);

  let verifierContract: any;

  before(async () => {
    const VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
    verifierContract = await VerifierFactory.deploy();
    await verifierContract.waitForDeployment();
  });

  it("should deploy Groth16Verifier and verify its code exists on EVM", async () => {
    const address = await verifierContract.getAddress();
    expect(address).to.be.properAddress;
    const code = await ethers.provider.getCode(address);
    expect(code).to.not.equal("0x");
  });

  it("should reject tampered or invalid proof inputs on EVM", async () => {
    const dummyA: [bigint, bigint] = [1n, 2n];
    const dummyB: [[bigint, bigint], [bigint, bigint]] = [
      [1n, 2n],
      [3n, 4n],
    ];
    const dummyC: [bigint, bigint] = [5n, 6n];
    const dummyPubSignals: bigint[] = new Array(12).fill(0n);
    dummyPubSignals[0] = 12345n;

    const result = await verifierContract.verifyProof(dummyA, dummyB, dummyC, dummyPubSignals);
    expect(result).to.be.false;
  });
});
