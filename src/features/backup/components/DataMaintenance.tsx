"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { toast } from "@/components/ui";
import { cleanupDeletedAttachments } from "@/features/attachments/service";
import { queryKeys } from "@/features/queryKeys";
import { isTauriRuntime } from "@/lib/db/runtime";
import { runAutoBackupIfDue } from "../autoBackup";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Background housekeeping while the app runs: removes attachment files the
 * user deleted in an earlier session (the undo window is over) and writes
 * the automatic backup when it is due (desktop; on start and hourly).
 */
export function DataMaintenance() {
  const { t } = useTranslation();
  const repos = useRepositories();
  const queryClient = useQueryClient();

  useEffect(() => {
    void cleanupDeletedAttachments(repos).catch(() => {
      // Retried on the next start; deleted attachments are invisible anyway.
    });
  }, [repos]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!(await isTauriRuntime()) || cancelled) return;
      try {
        const path = await runAutoBackupIfDue(repos);
        if (path) void queryClient.invalidateQueries({ queryKey: queryKeys.backup });
      } catch (error) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.backup });
        toast.error(t("backup.auto.failed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    };
    void check();
    const id = setInterval(() => void check(), CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [repos, queryClient, t]);

  return null;
}
