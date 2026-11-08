import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type ImportRule,
  type ImportRuleCreate,
  type ImportRuleUpdate,
  importRuleCreateSchema,
  importRuleSchema,
  importRuleUpdateSchema,
} from "./schemas";

export class ImportRulesRepository extends BaseRepository<
  ImportRule,
  ImportRuleCreate,
  ImportRuleUpdate
> {
  constructor(deps: RepositoryDeps) {
    super(
      "import_rules",
      { entity: importRuleSchema, create: importRuleCreateSchema, update: importRuleUpdateSchema },
      deps,
    );
  }
}
