import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type RecurringRule,
  type RecurringRuleCreate,
  type RecurringRuleUpdate,
  recurringRuleCreateSchema,
  recurringRuleSchema,
  recurringRuleUpdateSchema,
} from "./schemas";

export class RecurringRulesRepository extends BaseRepository<RecurringRule, RecurringRuleCreate, RecurringRuleUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "recurring_rules",
      { entity: recurringRuleSchema, create: recurringRuleCreateSchema, update: recurringRuleUpdateSchema },
      deps,
    );
  }
}
