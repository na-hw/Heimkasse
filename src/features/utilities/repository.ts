import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type UtilitySettlement,
  type UtilitySettlementCreate,
  type UtilitySettlementUpdate,
  utilitySettlementCreateSchema,
  utilitySettlementSchema,
  utilitySettlementUpdateSchema,
} from "./schemas";

export class UtilitySettlementsRepository extends BaseRepository<
  UtilitySettlement,
  UtilitySettlementCreate,
  UtilitySettlementUpdate
> {
  constructor(deps: RepositoryDeps) {
    super(
      "utility_settlements",
      { entity: utilitySettlementSchema, create: utilitySettlementCreateSchema, update: utilitySettlementUpdateSchema },
      deps,
    );
  }
}
