import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/healthshield"),
  JWT_SECRET: z.string().min(16).default("healthshield_dev_jwt_secret_key_32chars"),
  JWT_REFRESH_SECRET: z.string().min(16).default("healthshield_dev_refresh_secret_key_32c"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  MASTER_ENCRYPTION_KEY: z.string().length(64).default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  HMAC_SECRET: z.string().min(16).default("healthshield_dev_hmac_secret_key_32c"),
  ETHEREUM_RPC_URL: z.string().default("http://127.0.0.1:8545"),
  REGISTRY_CONTRACT_ADDRESS: z.string().default("0x5FbDB2315678afecb367f032d93F642f64180aa3"),
  CLAIM_MANAGER_CONTRACT_ADDRESS: z.string().default("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"),
  RELAYER_PRIVATE_KEY: z.string().default("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://127.0.0.1:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid Backend Environment Variables:", parsed.error.format());
  throw new Error("Invalid backend environment configuration.");
}

export const ENV = parsed.data;
