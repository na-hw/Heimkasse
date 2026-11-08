// @vitest-environment node
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { BrowserFileStore } from "./BrowserFileStore";
import { MemoryFileStore } from "./MemoryFileStore";

let counter = 0;

describe.each([
  { name: "indexeddb", create: () => new BrowserFileStore(`files-test-${++counter}`) },
  { name: "memory", create: () => new MemoryFileStore() },
])("file store on $name", ({ create }) => {
  it("writes, reads, lists and removes files", async () => {
    const store = create();
    await store.write("attachments/a.png", new Uint8Array([1, 2, 3]));
    expect(Array.from(await store.read("attachments/a.png"))).toEqual([1, 2, 3]);
    expect(await store.list()).toEqual(["attachments/a.png"]);
    await store.remove("attachments/a.png");
    await store.remove("attachments/missing.png");
    expect(await store.list()).toEqual([]);
    await expect(store.read("attachments/a.png")).rejects.toMatchObject({ code: "not_found" });
  });
});
