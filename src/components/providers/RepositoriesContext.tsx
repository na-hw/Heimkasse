"use client";

import { createContext, useContext } from "react";
import type { Repositories } from "@/features/repositories";

export const RepositoriesContext = createContext<Repositories | null>(null);

/** Access repositories from hooks. Only available below StorageGate. */
export function useRepositories(): Repositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error("useRepositories must be used inside <StorageGate>");
  return repos;
}
