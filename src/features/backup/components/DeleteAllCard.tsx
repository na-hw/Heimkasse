"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, ConfirmDialog } from "@/components/ui";
import { useBackupActions } from "../hooks";
import styles from "./DataCards.module.css";

/** Irreversible reset behind a typed confirmation word. */
export function DeleteAllCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deleteAll } = useBackupActions();
  const [open, setOpen] = useState(false);

  return (
    <Card title={t("settings.deleteAll.title")} description={t("settings.deleteAll.description")}>
      <div className={styles.actions}>
        <Button variant="danger" iconStart={<TriangleAlert />} onClick={() => setOpen(true)}>
          {t("settings.deleteAll.action")}
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("settings.deleteAll.confirmTitle")}
        description={t("settings.deleteAll.confirmText", {
          word: t("settings.deleteAll.word"),
        })}
        confirmationWord={t("settings.deleteAll.word")}
        confirmLabel={t("settings.deleteAll.confirmAction")}
        onConfirm={async () => {
          await deleteAll.mutateAsync();
          router.push("/");
        }}
      />
    </Card>
  );
}
