import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type Account,
  type AccountCreate,
  type AccountUpdate,
  accountCreateSchema,
  accountSchema,
  accountUpdateSchema,
} from "./schemas";

export class AccountsRepository extends BaseRepository<Account, AccountCreate, AccountUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "accounts",
      { entity: accountSchema, create: accountCreateSchema, update: accountUpdateSchema },
      deps,
    );
  }

  /** Non-archived, non-deleted accounts in display order. */
  listActive(): Promise<Account[]> {
    return this.list({
      where: [{ field: "archived", op: "eq", value: false }],
      orderBy: [{ field: "sort_order" }, { field: "name" }],
    });
  }
}
