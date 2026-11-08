// @vitest-environment node
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createRepositories, type Repositories } from "@/features/repositories";
import { ADAPTER_FACTORIES } from "@/test/adapters";
import {
  MAX_ATTACHMENT_BYTES,
  addAttachment,
  checkAttachment,
  cleanupDeletedAttachments,
  purgeWithAttachments,
  resolveMimeType,
} from "./service";

describe("attachment validation", () => {
  it("resolves mime types from type or extension", () => {
    expect(resolveMimeType("a.pdf", "application/pdf")).toBe("application/pdf");
    expect(resolveMimeType("IMG_1.HEIC", "")).toBe("image/heic");
    expect(resolveMimeType("notes.txt", "text/plain")).toBeNull();
  });

  it("rejects wrong types and oversized files", () => {
    const bytes = new Uint8Array(1);
    expect(checkAttachment({ fileName: "a.png", type: "image/png", bytes })).toBeNull();
    expect(checkAttachment({ fileName: "a.exe", type: "", bytes })).toBe("type");
    const big = { byteLength: MAX_ATTACHMENT_BYTES + 1 } as Uint8Array;
    expect(checkAttachment({ fileName: "a.png", type: "image/png", bytes: big })).toBe("size");
  });
});

describe.each(ADAPTER_FACTORIES)("attachments on $name", ({ create }) => {
  let repos: Repositories;
  let txId: string;

  beforeEach(async () => {
    const storage = create();
    await storage.init();
    repos = createRepositories({ storage });
    const account = await repos.accounts.create({ name: "Giro", type: "bank" });
    txId = (
      await repos.transactions.create({
        account_id: account.id,
        type: "expense",
        amount_cents: 100,
        date: "2026-11-08",
      })
    ).id;
  });

  const attach = (name = "beleg.pdf") =>
    addAttachment(repos, {
      entityType: "transaction",
      entityId: txId,
      fileName: name,
      type: "application/pdf",
      bytes: new Uint8Array([37, 80, 68, 70]),
    });

  it("stores the file and the row", async () => {
    const a = await attach();
    expect(a.file_path).toMatch(/^attachments\/[0-9a-f-]+\.pdf$/);
    expect(Array.from(await repos.files.read(a.file_path))).toEqual([37, 80, 68, 70]);
    expect(a.size_bytes).toBe(4);
  });

  it("removes the file again when the row is invalid", async () => {
    await expect(
      addAttachment(repos, {
        entityType: "transaction",
        entityId: "not-a-uuid",
        fileName: "x.pdf",
        type: "application/pdf",
        bytes: new Uint8Array([1]),
      }),
    ).rejects.toThrow();
    expect(await repos.files.list()).toEqual([]);
  });

  it("purges a transaction together with its attachments and files", async () => {
    await attach();
    await repos.transactions.softDelete([txId]);
    await purgeWithAttachments(repos, "transaction", [txId]);
    expect(await repos.attachments.count({ deleted: "include" })).toBe(0);
    expect(await repos.transactions.get(txId)).toBeNull();
    expect(await repos.files.list()).toEqual([]);
  });

  it("cleans up attachments the user deleted", async () => {
    const keep = await attach("keep.pdf");
    const drop = await attach("drop.pdf");
    await repos.attachments.softDelete([drop.id]);
    expect(await cleanupDeletedAttachments(repos)).toBe(1);
    expect(await repos.files.list()).toEqual([keep.file_path]);
  });
});
