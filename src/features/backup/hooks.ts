"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { toast } from "@/components/ui";
import { invalidateData, queryKeys } from "@/features/queryKeys";
import type { Repositories } from "@/features/repositories";
import { isTauriRuntime } from "@/lib/db/runtime";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { saveFile } from "@/lib/export/saveFile";
import { usePreferences } from "@/lib/preferences/store";
import {
  type AutoBackupConfig,
  loadAutoBackupConfig,
  pickBackupFolder,
  runAutoBackup,
  saveAutoBackupConfig,
} from "./autoBackup";
import { type Backup, backupFileName } from "./format";
import { createBackupJson, deleteAllData, parseBackup, restoreBackup } from "./service";

/** True inside the desktop app (features like auto-backup need the file system). */
export function useIsDesktop() {
  return useQuery({ queryKey: ["runtime", "tauri"], queryFn: isTauriRuntime, staleTime: Infinity })
    .data;
}

/** After replacing data: reload preferences and refresh every query. */
async function reloadEverything(
  repos: Repositories,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  usePreferences.getState().setAll(await repos.settings.getPreferences());
  await invalidateData(queryClient);
}

export function useBackupActions() {
  const { t } = useTranslation();
  const repos = useRepositories();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const onError = (error: unknown) => toast.error(errorMessage(error));

  const exportBackup = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const fileName = backupFileName(now);
      const saved = await saveFile({
        fileName,
        mimeType: "application/json",
        data: await createBackupJson(repos, now.toISOString()),
      });
      return saved ? fileName : null;
    },
    onSuccess: (fileName) =>
      fileName && toast.success(t("backup.exported"), { description: fileName }),
    onError,
  });

  /** Reads and validates a file; nothing is written yet. */
  const readBackup = async (file: File): Promise<Backup | null> => {
    try {
      return parseBackup(repos, await file.text());
    } catch (error) {
      onError(error);
      return null;
    }
  };

  const restore = useMutation({
    mutationFn: (backup: Backup) => restoreBackup(repos, backup),
    onSuccess: async () => {
      await reloadEverything(repos, queryClient);
      toast.success(t("backup.restored"));
    },
    onError,
  });

  const deleteAll = useMutation({
    mutationFn: () => deleteAllData(repos, new Date().toISOString()),
    onSuccess: async () => {
      await reloadEverything(repos, queryClient);
      toast.success(t("settings.deleteAll.done"));
    },
    onError,
  });

  return { exportBackup, readBackup, restore, deleteAll };
}

export function useAutoBackup() {
  const { t } = useTranslation();
  const repos = useRepositories();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const key = [...queryKeys.backup, "auto"];

  const config = useQuery({ queryKey: key, queryFn: () => loadAutoBackupConfig(repos) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const update = useMutation({
    mutationFn: async (patch: Partial<AutoBackupConfig>) => {
      const current = await loadAutoBackupConfig(repos);
      await saveAutoBackupConfig(repos, { ...current, ...patch });
    },
    onSuccess: () => toast.success(t("settings.saved")),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: refresh,
  });

  const chooseFolder = useMutation({
    mutationFn: pickBackupFolder,
    onSuccess: (folder) => folder && update.mutate({ folder, lastError: null }),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const runNow = useMutation({
    mutationFn: async () => runAutoBackup(repos, await loadAutoBackupConfig(repos)),
    onSuccess: (path) => path && toast.success(t("backup.auto.ran"), { description: path }),
    onError: (error) =>
      toast.error(t("backup.auto.failed"), {
        description: error instanceof Error ? error.message : String(error),
      }),
    onSettled: refresh,
  });

  return { config, update, chooseFolder, runNow };
}
