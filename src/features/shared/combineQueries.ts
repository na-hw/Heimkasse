interface QueryLike {
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/** Error state and retry for a view derived from several queries. */
export function combineQueries(queries: readonly QueryLike[]) {
  return {
    isError: queries.some((q) => q.isError),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}
