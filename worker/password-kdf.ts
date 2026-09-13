import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";

/** Same PBKDF2-SHA256 output as WebCrypto, without Workers' native iteration ceiling. */
export async function derivePasswordBytes(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 1_000_000) {
    throw new Error("Unsupported password work factor");
  }
  const encoded = new TextEncoder().encode(password);
  try {
    return await pbkdf2Async(sha256, encoded, salt, { c: iterations, dkLen: 32, asyncTick: 10 });
  } finally {
    encoded.fill(0);
  }
}
