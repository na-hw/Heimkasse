"use client";

import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/components/providers/RepositoriesContext";

export const overviewKeys = {
  stats: ["overview", "stats"] as const,
};

/** Counts and storage info for the overview page. */
export function useOverviewStats() {
  const repos = useRepositories();
  return useQuery({
    queryKey: overviewKeys.stats,
    queryFn: async () => {
      const [accounts, categories, schemaVersion] = await Promise.all([
        repos.accounts.count(),
        repos.categories.count(),
        repos.storage.schemaVersion(),
      ]);
      return { accounts, categories, schemaVersion, storage: repos.storage.kind };
    },
  });
}
