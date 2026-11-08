import type { z } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { nowIso } from "@/lib/utils/dates";
import { createId } from "@/lib/utils/id";
import type { BaseEntity } from "@/lib/validation/common";
import type { TableName } from "./schema";
import type { Condition, DomainRow, OrderBy, StorageAdapter, WriteOp } from "./types";

export type DeletedFilter = "exclude" | "include" | "only";

export interface ListOptions {
  where?: Condition[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  /** Soft-deleted rows are excluded by default. */
  deleted?: DeletedFilter;
}

export interface RepositorySchemas<TEntity, TCreate, TUpdate> {
  entity: z.ZodType<TEntity>;
  create: z.ZodType<TCreate, unknown>;
  update: z.ZodType<TUpdate, unknown>;
}

export interface RepositoryDeps {
  storage: StorageAdapter;
  clock?: () => string;
  idFactory?: () => string;
}

function deletedCondition(filter: DeletedFilter = "exclude"): Condition[] {
  if (filter === "include") return [];
  return [{ field: "deleted_at", op: filter === "only" ? "notNull" : "isNull" }];
}

/**
 * Generic repository: validated CRUD, soft delete (trash), restore and purge.
 * Entity-specific repositories extend this class. `prepare*` methods return
 * write operations so several changes can be committed atomically.
 */
export class BaseRepository<
  TEntity extends BaseEntity,
  TCreate extends object,
  TUpdate extends object,
> {
  protected readonly storage: StorageAdapter;
  protected readonly clock: () => string;
  protected readonly idFactory: () => string;

  constructor(
    readonly table: TableName,
    protected readonly schemas: RepositorySchemas<TEntity, TCreate, TUpdate>,
    deps: RepositoryDeps,
  ) {
    this.storage = deps.storage;
    this.clock = deps.clock ?? nowIso;
    this.idFactory = deps.idFactory ?? createId;
  }

  protected parse(row: DomainRow): TEntity {
    return this.schemas.entity.parse(row);
  }

  /** Validates a complete stored row (e.g. from a backup file) without writing it. */
  validateRow(row: unknown): TEntity {
    return this.schemas.entity.parse(row);
  }

  async list(options: ListOptions = {}): Promise<TEntity[]> {
    const rows = await this.storage.find(this.table, {
      where: [...deletedCondition(options.deleted), ...(options.where ?? [])],
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
    return rows.map((r) => this.parse(r));
  }

  async count(options: Pick<ListOptions, "where" | "deleted"> = {}): Promise<number> {
    return this.storage.count(this.table, [
      ...deletedCondition(options.deleted),
      ...(options.where ?? []),
    ]);
  }

  /** Returns the entity (including soft-deleted ones) or null. */
  async get(id: string): Promise<TEntity | null> {
    const row = await this.storage.get(this.table, id);
    return row ? this.parse(row) : null;
  }

  async getOrThrow(id: string): Promise<TEntity> {
    const entity = await this.get(id);
    if (!entity) throw new AppError("not_found", `${this.table}.${id}`);
    return entity;
  }

  /** Validates input and returns the new entity plus its insert operation. */
  prepareCreate(input: TCreate): { entity: TEntity; op: WriteOp } {
    const data = this.schemas.create.parse(input);
    const now = this.clock();
    const entity = this.schemas.entity.parse({
      ...data,
      id: this.idFactory(),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    return { entity, op: { type: "insert", table: this.table, row: entity as DomainRow } };
  }

  async create(input: TCreate): Promise<TEntity> {
    const { entity, op } = this.prepareCreate(input);
    await this.storage.write([op]);
    return entity;
  }

  prepareUpdate(id: string, patch: TUpdate): WriteOp {
    const data = this.schemas.update.parse(patch) as DomainRow;
    return { type: "update", table: this.table, id, patch: { ...data, updated_at: this.clock() } };
  }

  async update(id: string, patch: TUpdate): Promise<TEntity> {
    await this.storage.write([this.prepareUpdate(id, patch)]);
    return this.getOrThrow(id);
  }

  prepareSoftDelete(ids: readonly string[]): WriteOp[] {
    const now = this.clock();
    return ids.map((id) => ({
      type: "update",
      table: this.table,
      id,
      patch: { deleted_at: now, updated_at: now },
    }));
  }

  /** Moves entities to the trash. */
  async softDelete(ids: readonly string[]): Promise<void> {
    await this.storage.write(this.prepareSoftDelete(ids));
  }

  prepareRestore(ids: readonly string[]): WriteOp[] {
    const now = this.clock();
    return ids.map((id) => ({
      type: "update",
      table: this.table,
      id,
      patch: { deleted_at: null, updated_at: now },
    }));
  }

  /** Restores entities from the trash. */
  async restore(ids: readonly string[]): Promise<void> {
    await this.storage.write(this.prepareRestore(ids));
  }

  preparePurge(ids: readonly string[]): WriteOp[] {
    return ids.map((id) => ({ type: "delete", table: this.table, id }));
  }

  /** Permanently deletes entities. */
  async purge(ids: readonly string[]): Promise<void> {
    await this.storage.write(this.preparePurge(ids));
  }
}
