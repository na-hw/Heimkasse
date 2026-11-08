import type { Repositories } from "@/features/repositories";
import { LATEST_SCHEMA_VERSION } from "@/lib/db/migrations";
import { decodeValue } from "@/lib/db/codec";
import type { BaseRepository } from "@/lib/db/repository";
import { TABLE_NAMES, type TableName, tableDef } from "@/lib/db/schema";
import { BUILTIN_CATEGORIES, builtinCategoryOps } from "@/lib/db/seeds/categories";
import type { WriteOp } from "@/lib/db/types";
import { AppError } from "@/lib/errors/AppError";
import { PREFERENCE_KEYS } from "@/lib/preferences/types";
import type { BaseEntity } from "@/lib/validation/common";
import {
  BACKUP_APP_ID,
  BACKUP_FORMAT_VERSION,
  type Backup,
  type BackupEnvelope,
  DEVICE_SETTING_KEYS,
  backupEnvelopeSchema,
} from "./format";

type AnyRepository = BaseRepository<BaseEntity, object, object>;

/** Repository per table – used to validate rows of a backup. */
function repositoryFor(repos: Repositories, table: TableName): AnyRepository {
  const map: Record<TableName, unknown> = {
    accounts: repos.accounts,
    categories: repos.categories,
    transactions: repos.transactions,
    recurring_rules: repos.recurringRules,
    budgets: repos.budgets,
    contracts: repos.contracts,
    meters: repos.meters,
    meter_readings: repos.meterReadings,
    utility_settlements: repos.utilitySettlements,
    savings_goals: repos.savingsGoals,
    goal_contributions: repos.goalContributions,
    attachments: repos.attachments,
    import_rules: repos.importRules,
    settings: repos.settings,
  };
  return map[table] as AnyRepository;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(data: string): Uint8Array {
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
}

/** All data incl. trash and attachment files; device-specific settings are left out. */
export async function createBackup(repos: Repositories, now: string): Promise<BackupEnvelope> {
  const entries = await Promise.all(
    TABLE_NAMES.map(async (table) => {
      const rows = await repositoryFor(repos, table).list({
        deleted: "include",
        orderBy: [{ field: "created_at" }],
      });
      const kept =
        table === "settings"
          ? rows.filter((r) => !DEVICE_SETTING_KEYS.includes(String((r as { key?: unknown }).key)))
          : rows;
      return [table, kept as unknown as Record<string, unknown>[]] as const;
    }),
  );
  const tables = Object.fromEntries(entries) as BackupEnvelope["tables"];
  const files = await Promise.all(
    tables.attachments.map(async (a) => {
      const path = String(a.file_path);
      return { path, data: toBase64(await repos.files.read(path)) };
    }),
  );
  return {
    app: BACKUP_APP_ID,
    format: BACKUP_FORMAT_VERSION,
    schemaVersion: LATEST_SCHEMA_VERSION,
    exportedAt: now,
    tables,
    files,
  };
}

export async function createBackupJson(repos: Repositories, now: string): Promise<string> {
  return JSON.stringify(await createBackup(repos, now));
}

/** Older backups lack columns added by later migrations: fill in the column defaults. */
function withColumnDefaults(table: TableName, row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  for (const [name, def] of Object.entries(tableDef(table).columns)) {
    if (!Object.hasOwn(out, name) && def.default !== undefined) {
      out[name] = decodeValue(def, def.default);
    }
  }
  return out;
}

const invalid = (detail: string) => new AppError("backup_invalid", detail);

/**
 * Parses and fully validates a backup file before anything is written:
 * envelope, version, every row against its entity schema, unique ids,
 * safe file paths and a file for every attachment.
 */
export function parseBackup(repos: Repositories, text: string): Backup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw invalid("not JSON");
  }
  const envelope = backupEnvelopeSchema.safeParse(json);
  if (!envelope.success) {
    const app = (json as { app?: unknown } | null)?.app;
    throw invalid(app === BACKUP_APP_ID ? envelope.error.message : "not a Heimkasse backup");
  }
  const { data } = envelope;
  if (data.format > BACKUP_FORMAT_VERSION || data.schemaVersion > LATEST_SCHEMA_VERSION) {
    throw new AppError("backup_too_new", `format ${data.format}, schema ${data.schemaVersion}`);
  }

  const tables = {} as Backup["tables"];
  for (const table of TABLE_NAMES) {
    const repo = repositoryFor(repos, table);
    const ids = new Set<string>();
    tables[table] = data.tables[table].map((raw, index) => {
      const parsed = repo.validateRow(withColumnDefaults(table, raw));
      if (ids.has(parsed.id)) throw invalid(`${table}[${index}]: duplicate id`);
      ids.add(parsed.id);
      return parsed as unknown as Record<string, unknown>;
    });
  }
  tables.settings = tables.settings.filter((s) => !DEVICE_SETTING_KEYS.includes(String(s.key)));

  const files = data.files.map((f) => ({ path: f.path, data: fromBase64(f.data) }));
  const filePaths = new Set(files.map((f) => f.path));
  for (const a of tables.attachments) {
    if (!filePaths.has(String(a.file_path))) throw invalid(`missing file ${String(a.file_path)}`);
  }
  return { schemaVersion: data.schemaVersion, exportedAt: data.exportedAt, tables, files };
}

/** Settings rows that survive a restore / reset. */
async function keptSettings(repos: Repositories, keys: readonly string[]) {
  const rows = await repos.settings.list({ deleted: "include" });
  return {
    keep: rows.filter((r) => keys.includes(r.key)),
    drop: rows.filter((r) => !keys.includes(r.key)),
  };
}

async function removeUnreferencedFiles(repos: Repositories, keep: ReadonlySet<string>) {
  const stored = await repos.files.list();
  await Promise.allSettled(stored.filter((p) => !keep.has(p)).map((p) => repos.files.remove(p)));
}

/**
 * Replaces all data with the backup in one atomic write. Files are written
 * first; if the database write fails, newly written files are removed again.
 * The app lock and auto-backup settings of this device are kept.
 */
export async function restoreBackup(repos: Repositories, backup: Backup): Promise<void> {
  const before = new Set(await repos.files.list());
  for (const file of backup.files) await repos.files.write(file.path, file.data);

  const { drop } = await keptSettings(repos, DEVICE_SETTING_KEYS);
  const ops: WriteOp[] = [];
  for (const table of TABLE_NAMES) {
    if (table === "settings") {
      ops.push(...repos.settings.preparePurge(drop.map((s) => s.id)));
    } else {
      ops.push({ type: "clear", table });
    }
    for (const row of backup.tables[table]) ops.push({ type: "insert", table, row });
  }
  try {
    await repos.storage.write(ops);
  } catch (error) {
    await Promise.allSettled(
      backup.files.filter((f) => !before.has(f.path)).map((f) => repos.files.remove(f.path)),
    );
    throw error;
  }
  await removeUnreferencedFiles(repos, new Set(backup.files.map((f) => f.path)));
}

/**
 * "Delete all data": removes every entity, attachment file and internal
 * setting (incl. app lock); only display preferences (language, theme …)
 * stay. Built-in categories are seeded again.
 */
export async function deleteAllData(repos: Repositories, now: string): Promise<void> {
  const { drop } = await keptSettings(repos, PREFERENCE_KEYS);
  const ops: WriteOp[] = [
    ...TABLE_NAMES.filter((t) => t !== "settings").map(
      (table) => ({ type: "clear", table }) as const,
    ),
    ...repos.settings.preparePurge(drop.map((s) => s.id)),
    ...builtinCategoryOps(BUILTIN_CATEGORIES, now),
  ];
  await repos.storage.write(ops);
  await removeUnreferencedFiles(repos, new Set());
}
