import type { Repositories } from "@/features/repositories";

/** Permanently deletes meters together with all their readings (atomic). */
export async function purgeMeters(repos: Repositories, ids: readonly string[]): Promise<void> {
  const readings = await repos.meterReadings.list({
    where: [{ field: "meter_id", op: "in", values: [...ids] }],
    deleted: "include",
  });
  await repos.storage.write([
    ...repos.meterReadings.preparePurge(readings.map((r) => r.id)),
    ...repos.meters.preparePurge(ids),
  ]);
}
