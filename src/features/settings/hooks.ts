"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { usePreferences } from "@/lib/preferences/store";
import type { PreferenceKey, Preferences } from "@/lib/preferences/types";

interface PreferenceChange {
  key: PreferenceKey;
  value: Preferences[PreferenceKey];
}

/**
 * Changes a preference: the UI updates instantly (optimistic), the value is
 * persisted in the background and rolled back with an error toast on failure.
 */
export function useUpdatePreference() {
  const { t } = useTranslation();
  const repos = useRepositories();
  const errorMessage = useErrorMessage();

  const mutation = useMutation({
    mutationFn: ({ key, value }: PreferenceChange) =>
      repos.settings.setPreference(key, value as Preferences[typeof key]),
    onMutate: ({ key, value }: PreferenceChange) => {
      const previous = usePreferences.getState()[key];
      usePreferences.getState().set(key, value);
      return { key, previous };
    },
    onError: (error, _change, context) => {
      if (context) usePreferences.getState().set(context.key, context.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: () => announce(t("settings.saved")),
  });

  const { mutate } = mutation;
  return useCallback(
    <K extends PreferenceKey>(key: K, value: Preferences[K]) => mutate({ key, value }),
    [mutate],
  );
}
