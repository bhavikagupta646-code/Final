@echo off
echo [Circom] Compiling claim_eligibility.circom...
if not exist "build\v1" mkdir "build\v1"
if exist "bin\circom.exe" (
    bin\circom.exe claim_eligibility.circom --r1cs --wasm --sym -o build\v1
) else (
    circom claim_eligibility.circom --r1cs --wasm --sym -o build\v1
)
echo [Circom] Circuit compilation finished!
