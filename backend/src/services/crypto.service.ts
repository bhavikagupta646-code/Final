import * as crypto from "crypto";
import { hash, verify } from "@node-rs/argon2";
import { ENV } from "../config/env";

export class CryptoService {
  /**
   * Hashes a password using Argon2id with high-memory parameters
   */
  static async hashPassword(password: string): Promise<string> {
    return hash(password, {
      memoryCost: 65536, // 64 MiB
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    });
  }

  /**
   * Verifies a password against an Argon2id hash
   */
  static async verifyPassword(hashVal: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashVal, plain);
    } catch {
      return false;
    }
  }

  /**
   * Encrypts plaintext data using AES-256-GCM
   * @param plaintext UTF-8 string or Buffer to encrypt
   * @param keyHex 32-byte key buffer or hex string (defaults to MASTER_ENCRYPTION_KEY)
   */
  static encryptAES256GCM(
    plaintext: string,
    keyHex: string = ENV.MASTER_ENCRYPTION_KEY
  ): { ciphertext: string; iv: string; authTag: string } {
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== 32) {
      throw new Error("AES-256-GCM key must be exactly 32 bytes (64 hex characters).");
    }

    const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      ciphertext,
      iv: iv.toString("hex"),
      authTag,
    };
  }

  /**
   * Decrypts ciphertext using AES-256-GCM and verifies authenticity
   */
  static decryptAES256GCM(
    ciphertext: string,
    ivHex: string,
    authTagHex: string,
    keyHex: string = ENV.MASTER_ENCRYPTION_KEY
  ): string {
    const key = Buffer.from(keyHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Computes HMAC-SHA256 hash for tamper evidence
   */
  static computeHMAC(data: string, secret: string = ENV.HMAC_SECRET): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  /**
   * Verifies HMAC-SHA256 hash in constant time
   */
  static verifyHMAC(data: string, expectedHash: string, secret: string = ENV.HMAC_SECRET): boolean {
    const computed = this.computeHMAC(data, secret);
    const computedBuf = Buffer.from(computed, "hex");
    const expectedBuf = Buffer.from(expectedHash, "hex");
    if (computedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, expectedBuf);
  }

  /**
   * Generates a new random 32-byte Data Encryption Key (DEK)
   */
  static generateDEK(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generates a new X25519 key pair for ECDH key agreement
   */
  static generateX25519KeyPair(): { publicKeyHex: string; privateKeyHex: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519", {
      publicKeyEncoding: { type: "spki", format: "der" },
      privateKeyEncoding: { type: "pkcs8", format: "der" },
    });
    return {
      publicKeyHex: publicKey.toString("hex"),
      privateKeyHex: privateKey.toString("hex"),
    };
  }

  /**
   * Derives shared secret between local private key and remote public key using X25519 ECDH
   */
  static deriveSharedSecret(privateKeyHex: string, peerPublicKeyHex: string): string {
    const privKey = crypto.createPrivateKey({
      key: Buffer.from(privateKeyHex, "hex"),
      format: "der",
      type: "pkcs8",
    });
    const pubKey = crypto.createPublicKey({
      key: Buffer.from(peerPublicKeyHex, "hex"),
      format: "der",
      type: "spki",
    });

    const shared = crypto.diffieHellman({
      privateKey: privKey,
      publicKey: pubKey,
    });

    // Hash shared secret with SHA-256 to produce uniform 256-bit symmetric key
    return crypto.createHash("sha256").update(shared).digest("hex");
  }

  /**
   * Generates a BabyJubjub EdDSA key pair using circomlibjs
   */
  static async generateBabyJubjubKeyPair(): Promise<{
    privKeyHex: string;
    ax: string;
    ay: string;
  }> {
    const circomlib = require("circomlibjs");
    const eddsa = await circomlib.buildEddsa();
    const privKey = crypto.randomBytes(32);
    const pubKey = eddsa.prv2pub(privKey);
    return {
      privKeyHex: privKey.toString("hex"),
      ax: eddsa.F.toString(pubKey[0]),
      ay: eddsa.F.toString(pubKey[1]),
    };
  }
}
