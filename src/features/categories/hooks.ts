"use client";

import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import type { CategoryType } from "./schemas";

export const categoryKeys = {
  all: ["categories"] as const,
  active: (type?: CategoryType) => ["categories", "active", type ?? "all"] as const,
};

/** Active categories in display order. */
export function useCategories(type?: CategoryType) {
  const repos = useRepositories();
  return useQuery({
    queryKey: categoryKeys.active(type),
    queryFn: () => repos.categories.listActive(type),
  });
}
