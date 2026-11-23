#!/usr/bin/env bash
set -e
echo "[Circom] Compiling claim_eligibility.circom..."
mkdir -p build/v1
circom claim_eligibility.circom --r1cs --wasm --sym -o build/v1
echo "[Circom] Circuit compilation finished!"
