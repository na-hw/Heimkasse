"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/ui";
import { createRepositories } from "@/features/repositories";
import { initStorage } from "@/lib/db/runtime";
import { createFileStore } from "@/lib/files/runtime";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { usePreferences } from "@/lib/preferences/store";
import { RepositoriesContext } from "./RepositoriesContext";
import { Splash } from "./Splash";

export const STORAGE_QUERY_KEY = ["storage"] as const;

/**
 * Opens local storage (SQLite in Tauri, IndexedDB in the browser), runs
 * migrations and loads preferences before rendering the app.
 */
export function StorageGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const query = useQuery({
    queryKey: STORAGE_QUERY_KEY,
    queryFn: async () => {
      const [storage, files] = await Promise.all([initStorage(), createFileStore()]);
      const repos = createRepositories({ storage, files });
      usePreferences.getState().setAll(await repos.settings.getPreferences());
      return repos;
    },
    retry: false,
    gcTime: Number.POSITIVE_INFINITY,
  });

  if (query.isPending) return <Splash />;
  if (query.isError) {
    return (
      <main id="main">
        <ErrorState
          title={t("errors.storageTitle")}
          description={`${t("errors.storageDescription")} ${errorMessage(query.error)}`}
          details={String(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </main>
    );
  }
  return <RepositoriesContext.Provider value={query.data}>{children}</RepositoriesContext.Provider>;
}
