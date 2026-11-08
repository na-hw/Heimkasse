import Dexie, { type Table } from "dexie";
import { AppError } from "@/lib/errors/AppError";
import { nowIso } from "@/lib/utils/dates";
import { decodeRow, encodePatch, encodeRow } from "../../codec";
import { MIGRATIONS, type Migration } from "../../migrations";
import { schemaAt, tableDef } from "../../schema";
import type { Condition, DomainRow, Query, StorageAdapter, StoredRow, WriteOp } from "../../types";
import { applyQuery } from "../shared/matchQuery";

const VERSION_STORE = "schema_version";

interface VersionRow {
  version: number;
  name: string;
  applied_at: string;
}

/** Dexie store spec for all tables as of a migration version. */
export function dexieStores(
  version: number,
  migrations: readonly Migration[],
): Record<string, string> {
  const stores: Record<string, string> = { [VERSION_STORE]: "version" };
  for (const table of schemaAt(version, migrations).values()) {
    const indexes = (table.indexes ?? []).map((i) => {
      const spec = i.columns.length > 1 ? `[${i.columns.join("+")}]` : (i.columns[0] ?? "");
      return i.unique ? `&${spec}` : spec;
    });
    stores[table.name] = ["id", ...indexes].join(", ");
  }
  return stores;
}

/**
 * IndexedDB storage adapter (web/browser version) built on Dexie.
 * Store structure follows the same declarative migrations as SQLite;
 * seed data and the schema_version log are applied after opening.
 */
export class BrowserAdapter implements StorageAdapter {
  readonly kind = "indexeddb" as const;
  private readonly db: Dexie;

  constructor(
    name = "heimkasse",
    private readonly migrations: readonly Migration[] = MIGRATIONS,
    private readonly clock: () => string = nowIso,
  ) {
    this.db = new Dexie(name);
    for (const m of migrations) {
      this.db.version(m.version).stores(dexieStores(m.version, migrations));
    }
  }

  private table(name: string): Table<StoredRow, string> {
    tableDef(name);
    return this.db.table<StoredRow, string>(name);
  }

  async init(): Promise<void> {
    try {
      await this.db.open();
      const versions = this.db.table<VersionRow, number>(VERSION_STORE);
      const applied = new Set((await versions.toArray()).map((v) => v.version));
      for (const m of this.migrations) {
        if (applied.has(m.version)) continue;
        const now = this.clock();
        await this.db.transaction("rw", this.db.tables, async () => {
          await this.applyOps(m.seed?.(now) ?? []);
          await versions.put({ version: m.version, name: m.name, applied_at: now });
        });
      }
    } catch (error) {
      throw new AppError("storage_init_failed", String(error), { cause: error });
    }
  }

  async schemaVersion(): Promise<number> {
    const rows = await this.db.table<VersionRow, number>(VERSION_STORE).toArray();
    return rows.reduce((max, r) => Math.max(max, r.version), 0);
  }

  async find(table: string, query?: Query): Promise<DomainRow[]> {
    const def = tableDef(table);
    const rows = await this.table(table).toArray();
    return applyQuery(def, rows, query).map((r) => decodeRow(def, r));
  }

  async get(table: string, id: string): Promise<DomainRow | null> {
    const row = await this.table(table).get(id);
    return row ? decodeRow(tableDef(table), row) : null;
  }

  async count(table: string, where?: Condition[]): Promise<number> {
    if (!where?.length) return this.table(table).count();
    const rows = await this.table(table).toArray();
    return applyQuery(tableDef(table), rows, { where }).length;
  }

  async write(ops: WriteOp[]): Promise<void> {
    if (ops.length === 0) return;
    try {
      await this.db.transaction("rw", this.db.tables, () => this.applyOps(ops));
    } catch (error) {
      throw new AppError("write_failed", String(error), { cause: error });
    }
  }

  private async applyOps(ops: WriteOp[]): Promise<void> {
    for (const op of ops) {
      const def = tableDef(op.table);
      const store = this.table(op.table);
      if (op.type === "insert") {
        const row = encodeRow(def, op.row);
        const id = String(row.id);
        if (await store.get(id)) {
          if (op.onConflict === "ignore") continue;
          throw new Error(`Duplicate id ${op.table}.${id}`);
        }
        await store.add(row);
      } else if (op.type === "update") {
        const updated = await store.update(op.id, encodePatch(def, op.patch));
        if (updated === 0) throw new AppError("not_found", `${op.table}.${op.id}`);
      } else if (op.type === "clear") {
        await store.clear();
      } else {
        await store.delete(op.id);
      }
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }

  /** Deletes the whole IndexedDB database (used by tests and "delete all data"). */
  async destroy(): Promise<void> {
    await this.db.delete();
  }
}
