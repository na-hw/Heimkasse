"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import type {
  MeterCreate,
  MeterReading,
  MeterReadingCreate,
  MeterReadingUpdate,
  MeterUpdate,
} from "./schemas";
import { sortReadings } from "./consumption";

/** Meters with their readings (chronological). */
export function useMeters() {
  const repos = useRepositories();
  return useQuery({
    queryKey: queryKeys.meters,
    queryFn: async () => {
      const [meters, readings] = await Promise.all([
        repos.meters.list({ orderBy: [{ field: "name" }] }),
        repos.meterReadings.list(),
      ]);
      const byMeter = new Map<string, MeterReading[]>();
      for (const reading of readings)
        byMeter.set(reading.meter_id, [...(byMeter.get(reading.meter_id) ?? []), reading]);
      return meters.map((meter) => ({
        meter,
        readings: sortReadings(byMeter.get(meter.id) ?? []),
      }));
    },
  });
}

export function useMeterMutations() {
  const { t } = useTranslation();
  const undoToast = (title: string, onAction: () => void) =>
    toast.show({
      title,
      tone: "success",
      action: { label: t("common.undo"), altText: t("common.undo"), onAction },
    });

  const create = useDataMutation({
    mutationFn: (repos, input: MeterCreate) => repos.meters.create(input),
    onSuccess: () => toast.success(t("meters.created")),
  });
  const update = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: MeterUpdate }) =>
      repos.meters.update(id, patch),
    onSuccess: () => toast.success(t("meters.saved")),
  });
  const restore = useDataMutation({
    mutationFn: (repos, id: string) => repos.meters.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });
  const remove = useDataMutation({
    mutationFn: (repos, id: string) => repos.meters.softDelete([id]),
    onSuccess: (_r, id) => undoToast(t("meters.deleted"), () => restore.mutate(id)),
  });

  const createReading = useDataMutation({
    mutationFn: (repos, input: MeterReadingCreate) => repos.meterReadings.create(input),
    onSuccess: () => toast.success(t("meters.readings.created")),
  });
  const updateReading = useDataMutation({
    mutationFn: (repos, { id, patch }: { id: string; patch: MeterReadingUpdate }) =>
      repos.meterReadings.update(id, patch),
    onSuccess: () => toast.success(t("meters.readings.created")),
  });
  const restoreReading = useDataMutation({
    mutationFn: (repos, id: string) => repos.meterReadings.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });
  const removeReading = useDataMutation({
    mutationFn: (repos, id: string) => repos.meterReadings.softDelete([id]),
    onSuccess: (_r, id) => undoToast(t("meters.readings.deleted"), () => restoreReading.mutate(id)),
  });

  return { create, update, remove, createReading, updateReading, removeReading };
}
