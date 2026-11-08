import { QueryClient } from "@tanstack/react-query";

/**
 * Data is local and only changes through our own mutations, which
 * invalidate the affected queries – so cached data never goes stale by itself.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: { retry: 0 },
    },
  });
}
