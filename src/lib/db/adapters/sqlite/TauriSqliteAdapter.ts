import { AppError } from "@/lib/errors/AppError";
import { nowIso } from "@/lib/utils/dates";
import { decodeRow } from "../../codec";
import { MIGRATIONS, type Migration } from "../../migrations";
import { tableDef } from "../../schema";
import { buildCount, buildGet, buildSelect } from "../../sql/sqlBuilder";
import type { Condition, DomainRow, Query, StorageAdapter, WriteOp } from "../../types";
import { compileOps, migrateSql, readSqlSchemaVersion } from "./migrateSql";
import type { SqlExecutor } from "./SqlExecutor";

/**
 * SQLite storage adapter (desktop & mobile via Tauri). The executor is
 * injected so the same adapter runs against node:sqlite in tests.
 */
export class TauriSqliteAdapter implements StorageAdapter {
  readonly kind = "sqlite" as const;
  private version = 0;

  constructor(
    private readonly executor: SqlExecutor,
    private readonly migrations: readonly Migration[] = MIGRATIONS,
    private readonly clock: () => string = nowIso,
  ) {}

  async init(): Promise<void> {
    try {
      this.version = await migrateSql(this.executor, this.migrations, this.clock);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("storage_init_failed", String(error), { cause: error });
    }
  }

  async schemaVersion(): Promise<number> {
    this.version = await readSqlSchemaVersion(this.executor);
    return this.version;
  }

  async find(table: string, query?: Query): Promise<DomainRow[]> {
    const def = tableDef(table);
    const rows = await this.executor.select(buildSelect(def, query));
    return rows.map((r) => decodeRow(def, r));
  }

  async get(table: string, id: string): Promise<DomainRow | null> {
    const def = tableDef(table);
    const rows = await this.executor.select(buildGet(def, id));
    return rows[0] ? decodeRow(def, rows[0]) : null;
  }

  async count(table: string, where?: Condition[]): Promise<number> {
    const rows = await this.executor.select(buildCount(tableDef(table), where));
    return Number(rows[0]?.count ?? 0);
  }

  async write(ops: WriteOp[]): Promise<void> {
    if (ops.length === 0) return;
    try {
      await this.executor.batch(compileOps(ops, Number.POSITIVE_INFINITY));
    } catch (error) {
      throw new AppError("write_failed", String(error), { cause: error });
    }
  }

  close(): Promise<void> {
    return this.executor.close();
  }
}
