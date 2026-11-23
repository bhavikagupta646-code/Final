import { test } from "node:test";
import assert from "node:assert";
import { CryptoService } from "../services/crypto.service";

test("CryptoService - Argon2id Password Hashing & Verification", async () => {
  const password = "SuperSecretPassword2026!";
  const hash = await CryptoService.hashPassword(password);

  assert.ok(hash.startsWith("$argon2id$"), "Hash should use Argon2id variant");

  const valid = await CryptoService.verifyPassword(hash, password);
  assert.strictEqual(valid, true, "Valid password should verify successfully");

  const invalid = await CryptoService.verifyPassword(hash, "WrongPassword");
  assert.strictEqual(invalid, false, "Invalid password should fail verification");
});

test("CryptoService - AES-256-GCM Symmetric Authenticated Encryption", () => {
  const plaintext = JSON.stringify({
    patientId: "PAT-001",
    diagnosisCode: "E11.9",
    billedAmountCents: 450000,
  });

  const { ciphertext, iv, authTag } = CryptoService.encryptAES256GCM(plaintext);

  assert.ok(ciphertext.length > 0, "Ciphertext should not be empty");
  assert.strictEqual(iv.length, 24, "IV should be 12 bytes (24 hex characters)");
  assert.strictEqual(authTag.length, 32, "Auth tag should be 16 bytes (32 hex characters)");

  const decrypted = CryptoService.decryptAES256GCM(ciphertext, iv, authTag);
  assert.strictEqual(decrypted, plaintext, "Decrypted text should match original plaintext");
});

test("CryptoService - HMAC-SHA256 Integrity Verification", () => {
  const data = "clinical-encounter-record-hash-data";
  const hmac = CryptoService.computeHMAC(data);

  assert.strictEqual(hmac.length, 64, "HMAC-SHA256 must be 32 bytes (64 hex characters)");
  assert.strictEqual(CryptoService.verifyHMAC(data, hmac), true, "HMAC should verify for authentic payload");
  assert.strictEqual(CryptoService.verifyHMAC(data + "tampered", hmac), false, "HMAC must fail for tampered payload");
});

test("CryptoService - X25519 ECDH Shared Secret Derivation", () => {
  const alice = CryptoService.generateX25519KeyPair();
  const bob = CryptoService.generateX25519KeyPair();

  const aliceShared = CryptoService.deriveSharedSecret(alice.privateKeyHex, bob.publicKeyHex);
  const bobShared = CryptoService.deriveSharedSecret(bob.privateKeyHex, alice.publicKeyHex);

  assert.strictEqual(aliceShared.length, 64, "Shared secret should be 32 bytes (64 hex characters)");
  assert.strictEqual(aliceShared, bobShared, "Alice and Bob must derive identical shared secrets");
});
