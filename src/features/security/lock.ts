import { z } from "zod";
import type { Repositories } from "@/features/repositories";

/**
 * App lock. A privacy screen, not encryption: the data itself stays readable
 * for anyone with file access. Only a salted PBKDF2-SHA256 hash is stored.
 *
 * Unlock methods are pluggable: today only "password"; a "biometric" method
 * (Touch ID / Face ID via a Tauri plugin) can be added as another entry of
 * `LockMethod` with its own verifier, without changing the lock gate.
 */
export const LOCK_METHODS = ["password"] as const;
export type LockMethod = (typeof LOCK_METHODS)[number];

export const APP_LOCK_KEY = "app_lock";
export const MIN_PASSWORD_LENGTH = 4;
export const AUTO_LOCK_MINUTES = [0, 1, 5, 15, 30] as const;
const ITERATIONS = 310_000;

export const appLockSchema = z.object({
  version: z.literal(1),
  method: z.enum(LOCK_METHODS),
  algorithm: z.literal("PBKDF2-SHA256"),
  iterations: z.number().int().min(10_000),
  salt: z.base64(),
  hash: z.base64(),
  /** Lock again after this many minutes without interaction (0 = only on start). */
  autoLockMinutes: z.number().int().min(0).max(120),
});
export type AppLock = z.infer<typeof appLockSchema>;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (data: string) => Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Creates a new lock record for the password (random 16-byte salt). */
export async function createLock(
  password: string,
  autoLockMinutes = 0,
  iterations = ITERATIONS,
): Promise<AppLock> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, iterations);
  return {
    version: 1,
    method: "password",
    algorithm: "PBKDF2-SHA256",
    iterations,
    salt: toBase64(salt),
    hash: toBase64(hash),
    autoLockMinutes,
  };
}

/** Constant-time comparison of the derived hash. */
export async function verifyPassword(lock: AppLock, password: string): Promise<boolean> {
  const expected = fromBase64(lock.hash);
  const actual = await derive(password, fromBase64(lock.salt), lock.iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= (actual[i] ?? 0) ^ (expected[i] ?? 0);
  return diff === 0;
}

export function loadLock(repos: Repositories): Promise<AppLock | null> {
  return repos.settings.getValue(APP_LOCK_KEY, appLockSchema.nullable(), null);
}

export async function saveLock(repos: Repositories, lock: AppLock | null): Promise<void> {
  if (lock === null) await repos.settings.removeValue(APP_LOCK_KEY);
  else await repos.settings.setValue(APP_LOCK_KEY, appLockSchema.parse(lock));
}

/** Seconds to wait after repeated failures: none for the first 4, then 30 s, doubling up to 5 min. */
export function lockoutSeconds(failedAttempts: number): number {
  if (failedAttempts < 5) return 0;
  return Math.min(30 * 2 ** (failedAttempts - 5), 300);
}
