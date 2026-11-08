"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Direction } from "radix-ui";
import { type ReactNode, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { LiveRegion, Toaster } from "@/components/ui";
import { LANGUAGE_DIRECTION } from "@/lib/i18n/config";
import { i18n } from "@/lib/i18n/i18n";
import { usePreferences } from "@/lib/preferences/store";
import "@/lib/validation/zodConfig";
import { PreferencesEffects } from "./PreferencesEffects";
import { createQueryClient } from "./queryClient";
import { StorageGate } from "./StorageGate";

/** All client-side providers in dependency order. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const dir = LANGUAGE_DIRECTION[usePreferences((s) => s.language)];
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <Direction.Provider dir={dir}>
          <PreferencesEffects />
          <StorageGate>{children}</StorageGate>
          <Toaster dir={dir} />
          <LiveRegion />
        </Direction.Provider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
