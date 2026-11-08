"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { AppError } from "@/lib/errors/AppError";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { type AppLock, createLock, loadLock, saveLock, verifyPassword } from "./lock";
import { useLockStore } from "./store";

const LOCK_KEY = [...queryKeys.security, "lock"];

/** The stored lock (null = no password set). */
export function useAppLock() {
  const repos = useRepositories();
  return useQuery({ queryKey: LOCK_KEY, queryFn: () => loadLock(repos) });
}

async function requireCurrent(lock: AppLock | null, current: string) {
  if (!lock) throw new AppError("not_found", "app_lock");
  if (!(await verifyPassword(lock, current))) throw new AppError("permission_denied", "password");
}

/** True if the error means "wrong current password" (shown at the field, not as toast). */
export const isWrongPassword = (error: unknown) =>
  error instanceof AppError && error.code === "permission_denied";

export function useAppLockMutations() {
  const { t } = useTranslation();
  const repos = useRepositories();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const options = {
    onSettled: () => queryClient.invalidateQueries({ queryKey: LOCK_KEY }),
    onError: (error: unknown) => {
      if (!isWrongPassword(error)) toast.error(errorMessage(error));
    },
  };

  const setPassword = useMutation({
    ...options,
    mutationFn: async ({ password }: { password: string }) => {
      await saveLock(repos, await createLock(password));
      useLockStore.getState().unlock();
    },
    onSuccess: () => toast.success(t("security.enabled")),
  });

  const changePassword = useMutation({
    ...options,
    mutationFn: async ({ current, password }: { current: string; password: string }) => {
      const lock = await loadLock(repos);
      await requireCurrent(lock, current);
      await saveLock(repos, await createLock(password, lock?.autoLockMinutes ?? 0));
    },
    onSuccess: () => toast.success(t("security.changed")),
  });

  const removeLock = useMutation({
    ...options,
    mutationFn: async ({ current }: { current: string }) => {
      await requireCurrent(await loadLock(repos), current);
      await saveLock(repos, null);
    },
    onSuccess: () => toast.success(t("security.disabled")),
  });

  const setAutoLock = useMutation({
    ...options,
    mutationFn: async (autoLockMinutes: number) => {
      const lock = await loadLock(repos);
      if (lock) await saveLock(repos, { ...lock, autoLockMinutes });
    },
    onSuccess: () => toast.success(t("settings.saved")),
  });

  return { setPassword, changePassword, removeLock, setAutoLock };
}
