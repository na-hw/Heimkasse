"use client";

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { toast } from "@/components/ui";
import { invalidateData } from "@/features/queryKeys";
import type { Repositories } from "@/features/repositories";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";

interface Options<TVars, TResult> {
  mutationFn: (repos: Repositories, vars: TVars) => Promise<TResult>;
  /** Optimistic cache update; return a rollback function. */
  optimistic?: (vars: TVars, cache: OptimisticCache) => () => void;
  onSuccess?: (result: TResult, vars: TVars) => void;
}

export interface OptimisticCache {
  /** Applies `update` to every cached list under `prefix`, returns a rollback. */
  updateLists: <T>(prefix: QueryKey, update: (list: T[]) => T[]) => () => void;
}

/**
 * Standard mutation for local data: optional optimistic update, error toast
 * with rollback, and a refresh of all data queries afterwards.
 */
export function useDataMutation<TVars, TResult = unknown>({
  mutationFn,
  optimistic,
  onSuccess,
}: Options<TVars, TResult>) {
  const repos = useRepositories();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  const cache: OptimisticCache = {
    updateLists: <T>(prefix: QueryKey, update: (list: T[]) => T[]) => {
      const snapshot = queryClient.getQueriesData<T[]>({ queryKey: prefix });
      for (const [key, data] of snapshot)
        if (Array.isArray(data)) queryClient.setQueryData(key, update(data));
      return () => snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
  };

  return useMutation({
    mutationFn: (vars: TVars) => mutationFn(repos, vars),
    onMutate: async (vars: TVars) => {
      if (!optimistic) return undefined;
      await queryClient.cancelQueries();
      return { rollback: optimistic(vars, cache) };
    },
    onError: (error, _vars, context) => {
      context?.rollback();
      toast.error(errorMessage(error));
    },
    onSuccess: (result, vars) => onSuccess?.(result, vars),
    onSettled: () => invalidateData(queryClient),
  });
}
