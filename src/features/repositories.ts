import { AccountsRepository } from "@/features/accounts/repository";
import { AttachmentsRepository } from "@/features/attachments/repository";
import { BudgetsRepository } from "@/features/budgets/repository";
import { CategoriesRepository } from "@/features/categories/repository";
import { ContractsRepository } from "@/features/contracts/repository";
import { GoalContributionsRepository, SavingsGoalsRepository } from "@/features/goals/repository";
import { ImportRulesRepository } from "@/features/import/repository";
import { MeterReadingsRepository, MetersRepository } from "@/features/meters/repository";
import { RecurringRulesRepository } from "@/features/recurring/repository";
import { SettingsRepository } from "@/features/settings/repository";
import { TransactionsRepository } from "@/features/transactions/repository";
import { UtilitySettlementsRepository } from "@/features/utilities/repository";
import type { RepositoryDeps } from "@/lib/db/repository";
import { MemoryFileStore } from "@/lib/files/MemoryFileStore";
import type { FileStore } from "@/lib/files/types";

/**
 * Composition root of the data layer: one repository per entity plus the
 * file store for attachments (in-memory unless given – used by unit tests).
 */
export function createRepositories(deps: RepositoryDeps & { files?: FileStore }) {
  return {
    storage: deps.storage,
    files: deps.files ?? new MemoryFileStore(),
    accounts: new AccountsRepository(deps),
    categories: new CategoriesRepository(deps),
    transactions: new TransactionsRepository(deps),
    recurringRules: new RecurringRulesRepository(deps),
    budgets: new BudgetsRepository(deps),
    contracts: new ContractsRepository(deps),
    meters: new MetersRepository(deps),
    meterReadings: new MeterReadingsRepository(deps),
    utilitySettlements: new UtilitySettlementsRepository(deps),
    savingsGoals: new SavingsGoalsRepository(deps),
    goalContributions: new GoalContributionsRepository(deps),
    attachments: new AttachmentsRepository(deps),
    importRules: new ImportRulesRepository(deps),
    settings: new SettingsRepository(deps),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
