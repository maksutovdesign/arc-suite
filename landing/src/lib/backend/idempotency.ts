import { createHash } from "crypto"

/**
 * Derive a deterministic, UUID-v4-shaped idempotency key from a stable seed.
 *
 * Circle's transaction APIs require a UUID-formatted idempotency key and dedupe
 * requests that reuse the same key. Deriving the key from a stable seed
 * (e.g. `milestoneId:action` or a caller-supplied idempotency key) means retries
 * and concurrent duplicates resolve to the *same* provider transaction instead of
 * issuing a second on-chain movement.
 */
export function deterministicIdempotencyKey(seed: string): string {
  const chars = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("")
  // Force the version (4) and variant (8-b) nibbles so the value is a valid UUID v4.
  chars[12] = "4"
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16)
  const hex = chars.join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}
