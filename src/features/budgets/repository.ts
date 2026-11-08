import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type Budget,
  type BudgetCreate,
  type BudgetUpdate,
  budgetCreateSchema,
  budgetSchema,
  budgetUpdateSchema,
} from "./schemas";

export class BudgetsRepository extends BaseRepository<Budget, BudgetCreate, BudgetUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "budgets",
      { entity: budgetSchema, create: budgetCreateSchema, update: budgetUpdateSchema },
      deps,
    );
  }
}
