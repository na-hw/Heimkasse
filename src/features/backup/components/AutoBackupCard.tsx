"use client";

import { FolderOpen, HardDriveDownload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Card, ErrorState, FormField, Select, Skeleton, Switch } from "@/components/ui";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { AUTO_BACKUP_FREQUENCIES } from "../autoBackup";
import { useAutoBackup, useIsDesktop } from "../hooks";
import styles from "./DataCards.module.css";

const KEEP_OPTIONS = [3, 5, 10, 20, 30] as const;

/** Automatic backups to a folder of the user's choice (desktop app only). */
export function AutoBackupCard() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const desktop = useIsDesktop();
  const { config, update, chooseFolder, runNow } = useAutoBackup();
  const data = config.data;

  return (
    <Card title={t("backup.auto.title")} description={t("backup.auto.description")}>
      {desktop === false ? (
        <p className={styles.hint}>{t("backup.auto.desktopOnly")}</p>
      ) : config.isError ? (
        <ErrorState
          description={errorMessage(config.error)}
          onRetry={() => void config.refetch()}
        />
      ) : !data ? (
        <Skeleton height="6rem" />
      ) : (
        <div className={styles.stack}>
          <div className={styles.folder}>
            <span className={styles.label}>{t("backup.auto.folder")}</span>
            <span className={styles.path}>{data.folder ?? t("backup.auto.noFolder")}</span>
            <Button
              iconStart={<FolderOpen />}
              loading={chooseFolder.isPending}
              onClick={() => chooseFolder.mutate()}
            >
              {t("backup.auto.chooseFolder")}
            </Button>
          </div>
          <Switch
            label={t("backup.auto.enabled")}
            description={data.folder ? undefined : t("backup.auto.needFolder")}
            checked={data.enabled}
            disabled={!data.folder}
            onCheckedChange={(enabled) => update.mutate({ enabled })}
          />
          <div className={styles.row}>
            <FormField label={t("backup.auto.frequency")}>
              <Select
                value={data.frequency}
                onValueChange={(frequency) => update.mutate({ frequency })}
                options={AUTO_BACKUP_FREQUENCIES.map((f) => ({
                  value: f,
                  label: t(`backup.auto.frequencies.${f}`),
                }))}
              />
            </FormField>
            <FormField label={t("backup.auto.keep")} hint={t("backup.auto.keepHint")}>
              <Select
                value={String(data.keep)}
                onValueChange={(v) => update.mutate({ keep: Number(v) })}
                options={KEEP_OPTIONS.map((n) => ({
                  value: String(n),
                  label: t("backup.auto.keepOption", { count: n, formatted: format.number(n) }),
                }))}
              />
            </FormField>
          </div>
          <p className={styles.hint} role="status">
            {data.lastRunAt
              ? t("backup.auto.lastRun", { date: format.dateTime(data.lastRunAt) })
              : t("backup.auto.never")}
          </p>
          {data.lastError && (
            <p className={styles.error} role="alert">
              {t("backup.auto.lastError", { message: data.lastError })}
            </p>
          )}
          <div className={styles.actions}>
            <Button
              iconStart={<HardDriveDownload />}
              disabled={!data.folder}
              loading={runNow.isPending}
              onClick={() => runNow.mutate()}
            >
              {t("backup.auto.runNow")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
