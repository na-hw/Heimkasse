import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type Meter,
  type MeterCreate,
  type MeterReading,
  type MeterReadingCreate,
  type MeterReadingUpdate,
  type MeterUpdate,
  meterCreateSchema,
  meterReadingCreateSchema,
  meterReadingSchema,
  meterReadingUpdateSchema,
  meterSchema,
  meterUpdateSchema,
} from "./schemas";

export class MetersRepository extends BaseRepository<Meter, MeterCreate, MeterUpdate> {
  constructor(deps: RepositoryDeps) {
    super("meters", { entity: meterSchema, create: meterCreateSchema, update: meterUpdateSchema }, deps);
  }
}

export class MeterReadingsRepository extends BaseRepository<MeterReading, MeterReadingCreate, MeterReadingUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "meter_readings",
      { entity: meterReadingSchema, create: meterReadingCreateSchema, update: meterReadingUpdateSchema },
      deps,
    );
  }

  listForMeter(meterId: string): Promise<MeterReading[]> {
    return this.list({ where: [{ field: "meter_id", op: "eq", value: meterId }], orderBy: [{ field: "date" }] });
  }
}
