import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type Transaction,
  type TransactionCreate,
  type TransactionUpdate,
  transactionCreateSchema,
  transactionSchema,
  transactionUpdateSchema,
} from "./schemas";

export class TransactionsRepository extends BaseRepository<Transaction, TransactionCreate, TransactionUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "transactions",
      { entity: transactionSchema, create: transactionCreateSchema, update: transactionUpdateSchema },
      deps,
    );
  }

  /** Counts active transactions referencing an account or category (archive-instead-of-delete checks). */
  countUsing(field: "account_id" | "category_id", id: string): Promise<number> {
    return this.count({ where: [{ field, op: "eq", value: id }] });
  }
}
