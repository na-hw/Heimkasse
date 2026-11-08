import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type GoalContribution,
  type GoalContributionCreate,
  type GoalContributionUpdate,
  type SavingsGoal,
  type SavingsGoalCreate,
  type SavingsGoalUpdate,
  goalContributionCreateSchema,
  goalContributionSchema,
  goalContributionUpdateSchema,
  savingsGoalCreateSchema,
  savingsGoalSchema,
  savingsGoalUpdateSchema,
} from "./schemas";

export class SavingsGoalsRepository extends BaseRepository<SavingsGoal, SavingsGoalCreate, SavingsGoalUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "savings_goals",
      { entity: savingsGoalSchema, create: savingsGoalCreateSchema, update: savingsGoalUpdateSchema },
      deps,
    );
  }
}

export class GoalContributionsRepository extends BaseRepository<
  GoalContribution,
  GoalContributionCreate,
  GoalContributionUpdate
> {
  constructor(deps: RepositoryDeps) {
    super(
      "goal_contributions",
      { entity: goalContributionSchema, create: goalContributionCreateSchema, update: goalContributionUpdateSchema },
      deps,
    );
  }
}
