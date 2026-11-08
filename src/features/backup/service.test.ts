// @vitest-environment node
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { addAttachment } from "@/features/attachments/service";
import { createRepositories, type Repositories } from "@/features/repositories";
import { LATEST_SCHEMA_VERSION } from "@/lib/db/migrations";
import { BUILTIN_CATEGORIES } from "@/lib/db/seeds/categories";
import { ADAPTER_FACTORIES } from "@/test/adapters";
import { BACKUP_FILE_NAME, backupCounts, backupFileName } from "./format";
import {
  createBackup,
  createBackupJson,
  deleteAllData,
  parseBackup,
  restoreBackup,
} from "./service";

const NOW = "2026-11-08T10:00:00.000Z";

describe("backup file names", () => {
  it("are sortable and recognisable", () => {
    const name = backupFileName(new Date(2026, 10, 8, 9, 5));
    expect(name).toBe("heimkasse-backup-2026-11-08-0905.json");
    expect(BACKUP_FILE_NAME.test(name)).toBe(true);
  });
});

describe.each(ADAPTER_FACTORIES)("backup on $name", ({ create }) => {
  let repos: Repositories;
  let accountId: string;
  let txId: string;

  const fresh = async () => {
    const storage = create();
    await storage.init();
    return createRepositories({ storage });
  };

  beforeEach(async () => {
    repos = await fresh();
    accountId = (await repos.accounts.create({ name: "Giro", type: "bank" })).id;
    txId = (
      await repos.transactions.create({
        account_id: accountId,
        type: "expense",
        amount_cents: 4510,
        date: "2026-11-08",
        payee: "REWE",
        tags: ["essen"],
      })
    ).id;
    const trashed = await repos.transactions.create({
      account_id: accountId,
      type: "income",
      amount_cents: 100,
      date: "2026-11-01",
    });
    await repos.transactions.softDelete([trashed.id]);
    await addAttachment(repos, {
      entityType: "transaction",
      entityId: txId,
      fileName: "bon.png",
      type: "image/png",
      bytes: new Uint8Array([137, 80, 78, 71]),
    });
    await repos.settings.setPreference("language", "fa");
    await repos.settings.setValue("app_lock", { secret: "device" });
  });

  it("round-trips all data incl. trash, settings and files into another database", async () => {
    const json = await createBackupJson(repos, NOW);
    const target = await fresh();
    await target.settings.setValue("app_lock", { secret: "target" });
    await target.accounts.create({ name: "Wird ersetzt", type: "cash" });

    const backup = parseBackup(target, json);
    expect(backupCounts(backup)).toMatchObject({ accounts: 1, transactions: 2, attachments: 1 });
    await restoreBackup(target, backup);

    expect((await target.accounts.list()).map((a) => a.name)).toEqual(["Giro"]);
    expect(await target.transactions.count({ deleted: "only" })).toBe(1);
    expect((await target.transactions.get(txId))?.tags).toEqual(["essen"]);
    expect((await target.settings.getPreferences()).language).toBe("fa");
    const [attachment] = await target.attachments.list();
    expect(Array.from(await target.files.read(attachment?.file_path ?? ""))).toEqual([
      137, 80, 78, 71,
    ]);
    // Device-specific settings: neither exported nor overwritten.
    expect(json).not.toContain("device");
    expect(
      await target.settings.getValue("app_lock", (await import("zod")).z.unknown(), null),
    ).toEqual({
      secret: "target",
    });
  });

  it("rejects invalid files before writing anything", async () => {
    const target = await fresh();
    const good = await createBackup(repos, NOW);
    const cases: Array<[string, string]> = [
      ["not json", "backup_invalid"],
      [JSON.stringify({ app: "other" }), "backup_invalid"],
      [JSON.stringify({ ...good, schemaVersion: LATEST_SCHEMA_VERSION + 1 }), "backup_too_new"],
      [
        JSON.stringify({
          ...good,
          tables: { ...good.tables, accounts: [{ ...good.tables.accounts[0], type: "bitcoin" }] },
        }),
        "",
      ],
      [JSON.stringify({ ...good, files: [] }), "backup_invalid"],
      [
        JSON.stringify({ ...good, files: [{ path: "../../etc/passwd", data: "AA==" }] }),
        "backup_invalid",
      ],
    ];
    for (const [text, code] of cases) {
      let error: unknown;
      try {
        parseBackup(target, text);
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      if (code) expect(error).toMatchObject({ code });
    }
    expect(await target.accounts.count()).toBe(0);
  });

  it("restores older backups by filling column defaults", async () => {
    const good = await createBackup(repos, NOW);
    const account = { ...good.tables.accounts[0] };
    delete account.sort_order;
    const backup = parseBackup(
      repos,
      JSON.stringify({ ...good, tables: { ...good.tables, accounts: [account] } }),
    );
    expect(backup.tables.accounts[0]?.sort_order).toBe(0);
  });

  it("deletes all data but keeps preferences and re-seeds built-in categories", async () => {
    await repos.categories.create({ name: "Eigene", type: "expense" });
    await deleteAllData(repos, NOW);
    expect(await repos.accounts.count({ deleted: "include" })).toBe(0);
    expect(await repos.transactions.count({ deleted: "include" })).toBe(0);
    expect(await repos.attachments.count({ deleted: "include" })).toBe(0);
    expect(await repos.categories.count()).toBe(BUILTIN_CATEGORIES.length);
    expect(await repos.files.list()).toEqual([]);
    expect((await repos.settings.getPreferences()).language).toBe("fa");
    expect((await repos.settings.list()).map((s) => s.key)).toEqual(["language"]);
  });
});
