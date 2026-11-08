// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRepositories } from "@/features/repositories";
import { ADAPTER_FACTORIES } from "@/test/adapters";
import { createLock, loadLock, lockoutSeconds, saveLock, verifyPassword } from "./lock";

// Few iterations keep the test fast; the algorithm is the same.
const FAST = 10_000;

describe("app lock", () => {
  it("verifies the right password and rejects others", async () => {
    const lock = await createLock("geheim", 5, FAST);
    expect(lock).toMatchObject({
      method: "password",
      algorithm: "PBKDF2-SHA256",
      autoLockMinutes: 5,
    });
    expect(JSON.stringify(lock)).not.toContain("geheim");
    expect(await verifyPassword(lock, "geheim")).toBe(true);
    expect(await verifyPassword(lock, "Geheim")).toBe(false);
    expect(await verifyPassword(lock, "")).toBe(false);
  });

  it("uses a random salt per lock", async () => {
    const a = await createLock("same", 0, FAST);
    const b = await createLock("same", 0, FAST);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it("normalizes Unicode so Persian input matches", async () => {
    const lock = await createLock("رمزé", 0, FAST);
    expect(await verifyPassword(lock, "رمزé")).toBe(true);
  });

  it("slows down repeated failures", () => {
    expect(lockoutSeconds(4)).toBe(0);
    expect(lockoutSeconds(5)).toBe(30);
    expect(lockoutSeconds(6)).toBe(60);
    expect(lockoutSeconds(20)).toBe(300);
  });

  it("persists and removes the lock in settings", async () => {
    const storage = ADAPTER_FACTORIES[0]!.create();
    await storage.init();
    const repos = createRepositories({ storage });
    expect(await loadLock(repos)).toBeNull();
    const lock = await createLock("pin1", 0, FAST);
    await saveLock(repos, lock);
    expect(await loadLock(repos)).toEqual(lock);
    await saveLock(repos, null);
    expect(await loadLock(repos)).toBeNull();
  });
});
