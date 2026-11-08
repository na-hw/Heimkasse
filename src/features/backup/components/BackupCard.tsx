"use client";

import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, ConfirmDialog, FileInput } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { type Backup, backupCounts } from "../format";
import { useBackupActions } from "../hooks";
import styles from "./DataCards.module.css";

/** Manual JSON backup export and restore (replaces all data after confirmation). */
export function BackupCard() {
  const { t } = useTranslation();
  const format = useFormat();
  const { exportBackup, readBackup, restore } = useBackupActions();
  const [pending, setPending] = useState<Backup | null>(null);
  const counts = pending ? backupCounts(pending) : null;

  return (
    <Card title={t("backup.title")} description={t("backup.description")}>
      <div className={styles.actions}>
        <Button
          variant="primary"
          iconStart={<Download />}
          loading={exportBackup.isPending}
          onClick={() => exportBackup.mutate()}
        >
          {t("backup.export")}
        </Button>
        <FileInput
          accept=".json,application/json"
          icon={<Upload />}
          loading={restore.isPending}
          onFiles={async ([file]) => {
            if (!file) return;
            const backup = await readBackup(file);
            if (backup) setPending(backup);
          }}
        >
          {t("backup.restore")}
        </FileInput>
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={t("backup.confirm.title")}
        description={
          pending && counts ? (
            <>
              {t("backup.confirm.text", { date: format.dateTime(pending.exportedAt) })}
              <span className={styles.counts}>
                {t("backup.confirm.counts", {
                  transactions: format.number(counts.transactions),
                  accounts: format.number(counts.accounts),
                  attachments: format.number(counts.attachments),
                })}
              </span>
            </>
          ) : (
            ""
          )
        }
        confirmLabel={t("backup.confirm.action")}
        onConfirm={async () => {
          if (pending) await restore.mutateAsync(pending);
        }}
      />
    </Card>
  );
}
