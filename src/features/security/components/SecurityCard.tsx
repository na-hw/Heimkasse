"use client";

import { KeyRound, Lock, LockOpen, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, ErrorState, FormField, Select, Skeleton } from "@/components/ui";
import styles from "@/features/backup/components/DataCards.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useAppLock, useAppLockMutations } from "../hooks";
import { AUTO_LOCK_MINUTES } from "../lock";
import { useLockStore } from "../store";
import { type PasswordDialogMode, PasswordDialog } from "./PasswordDialog";

/** App lock settings: password, auto-lock and "lock now". */
export function SecurityCard() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const lock = useAppLock();
  const { setAutoLock } = useAppLockMutations();
  const lockNow = useLockStore((s) => s.lock);
  const [dialog, setDialog] = useState<PasswordDialogMode | null>(null);

  return (
    <Card
      title={t("security.title")}
      description={t("security.description")}
      actions={
        lock.data ? (
          <Badge tone="success" icon={<ShieldCheck />}>
            {t("security.active")}
          </Badge>
        ) : undefined
      }
    >
      {lock.isError ? (
        <ErrorState description={errorMessage(lock.error)} onRetry={() => void lock.refetch()} />
      ) : lock.isPending ? (
        <Skeleton height="3rem" />
      ) : lock.data ? (
        <div className={styles.stack}>
          <FormField label={t("security.autoLock")} hint={t("security.autoLockHint")}>
            <Select
              value={String(lock.data.autoLockMinutes)}
              onValueChange={(v) => setAutoLock.mutate(Number(v))}
              options={AUTO_LOCK_MINUTES.map((m) => ({
                value: String(m),
                label:
                  m === 0
                    ? t("security.autoLockOff")
                    : t("security.autoLockMinutes", { count: m, formatted: format.number(m) }),
              }))}
            />
          </FormField>
          <div className={styles.actions}>
            <Button variant="primary" iconStart={<Lock />} onClick={lockNow}>
              {t("security.lockNow")}
            </Button>
            <Button iconStart={<KeyRound />} onClick={() => setDialog("change")}>
              {t("security.changePassword")}
            </Button>
            <Button variant="ghost" iconStart={<LockOpen />} onClick={() => setDialog("remove")}>
              {t("security.removeLock")}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Button iconStart={<KeyRound />} onClick={() => setDialog("set")}>
            {t("security.setPassword")}
          </Button>
        </div>
      )}
      <PasswordDialog mode={dialog} onClose={() => setDialog(null)} />
    </Card>
  );
}
