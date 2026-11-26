import crypto from "node:crypto";
import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  algorithm: 2 as const, // Argon2id (const enum Algorithm.Argon2id = 2)
  memoryCost: 19456, // 19 MiB (OWASP doporučení pro Argon2id)
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(params: { hash: string; password: string }): Promise<boolean> {
  const { hash, password } = params;
  if (!hash || !password) return false;

  if (hash.startsWith("$argon2")) {
    try {
      return await argon2Verify(hash, password);
    } catch {
      return false;
    }
  }

  // Zpětná kompatibilita se seedovanými scrypt hashi z etapy 1 před pře-seedováním
  if (hash.startsWith("scrypt:")) {
    const parts = hash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, storedHex] = parts;
    if (!salt || !storedHex) return false;
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(storedHex, "hex");
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  }

  return false;
}
