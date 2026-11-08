import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type Contract,
  type ContractCreate,
  type ContractUpdate,
  contractCreateSchema,
  contractSchema,
  contractUpdateSchema,
} from "./schemas";

export class ContractsRepository extends BaseRepository<Contract, ContractCreate, ContractUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "contracts",
      { entity: contractSchema, create: contractCreateSchema, update: contractUpdateSchema },
      deps,
    );
  }
}
