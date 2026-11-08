"use client";

import { type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/ui";
import { Splash } from "@/components/providers/Splash";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useAppLock } from "../hooks";
import { useLockStore } from "../store";
import { LockScreen } from "./LockScreen";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
const CHECK_MS = 15_000;

/** Locks again after `minutes` without interaction (also while the window is hidden). */
function useAutoLock(minutes: number, active: boolean) {
  const lock = useLockStore((s) => s.lock);
  useEffect(() => {
    if (!active || minutes <= 0) return;
    let last = Date.now();
    const touch = () => {
      last = Date.now();
    };
    const check = () => {
      if (Date.now() - last >= minutes * 60_000) lock();
    };
    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, touch, { passive: true });
    document.addEventListener("visibilitychange", check);
    const id = setInterval(check, CHECK_MS);
    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, touch);
      document.removeEventListener("visibilitychange", check);
      clearInterval(id);
    };
  }, [minutes, active, lock]);
}

/**
 * Renders the app only when no lock is set or it was unlocked in this
 * session. While locked nothing else is mounted (no data, no overlays).
 */
export function LockGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const lock = useAppLock();
  const unlocked = useLockStore((s) => s.unlocked);
  const open = lock.data === null || unlocked;
  useAutoLock(lock.data?.autoLockMinutes ?? 0, Boolean(lock.data) && unlocked);

  if (lock.isPending) return <Splash />;
  if (lock.isError) {
    return (
      <main id="main">
        <ErrorState
          title={t("errors.storageTitle")}
          description={errorMessage(lock.error)}
          onRetry={() => void lock.refetch()}
        />
      </main>
    );
  }
  if (!open && lock.data) return <LockScreen lock={lock.data} />;
  return children;
}
