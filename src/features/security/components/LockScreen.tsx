"use client";

import { LockKeyhole } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ConfirmDialog, FormField, Input } from "@/components/ui";
import { useBackupActions } from "@/features/backup/hooks";
import { useFormat } from "@/lib/i18n/useFormat";
import { type AppLock, lockoutSeconds, verifyPassword } from "../lock";
import { useLockStore } from "../store";
import styles from "./LockScreen.module.css";

/** Full-screen password prompt. Nothing of the app is rendered behind it. */
export function LockScreen({ lock }: { lock: AppLock }) {
  const { t } = useTranslation();
  const format = useFormat();
  const unlock = useLockStore((s) => s.unlock);
  const { deleteAll } = useBackupActions();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [failed, setFailed] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [checking, setChecking] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const remaining = Math.max(0, Math.ceil((waitUntil - now) / 1000));

  useEffect(() => {
    if (waitUntil <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waitUntil]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (remaining > 0 || checking) return;
    setChecking(true);
    const ok = await verifyPassword(lock, password);
    setChecking(false);
    if (ok) {
      unlock();
      return;
    }
    const attempts = failed + 1;
    setFailed(attempts);
    setPassword("");
    setError(t("security.lockScreen.wrong"));
    const wait = lockoutSeconds(attempts);
    if (wait > 0) {
      setNow(Date.now());
      setWaitUntil(Date.now() + wait * 1000);
    }
  };

  return (
    <main id="main" className={styles.screen}>
      <form className={styles.card} onSubmit={(e) => void submit(e)} noValidate>
        <span className={styles.icon} aria-hidden="true">
          <LockKeyhole />
        </span>
        <h1 className={styles.title}>{t("security.lockScreen.title")}</h1>
        <p className={styles.text}>{t("security.lockScreen.text")}</p>
        <FormField
          label={t("security.fields.password")}
          error={error}
          hint={
            remaining > 0
              ? t("security.lockScreen.wait", { seconds: format.number(remaining) })
              : undefined
          }
        >
          <Input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(undefined);
            }}
          />
        </FormField>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={checking}
          disabled={remaining > 0 || password === ""}
        >
          {t("security.lockScreen.unlock")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
          {t("security.lockScreen.forgot")}
        </Button>
      </form>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t("security.lockScreen.resetTitle")}
        description={t("security.lockScreen.resetText", { word: t("settings.deleteAll.word") })}
        confirmationWord={t("settings.deleteAll.word")}
        confirmLabel={t("settings.deleteAll.confirmAction")}
        onConfirm={async () => {
          await deleteAll.mutateAsync();
          unlock();
        }}
      />
    </main>
  );
}
