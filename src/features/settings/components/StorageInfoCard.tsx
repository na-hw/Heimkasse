"use client";

import { Database, FolderTree, Landmark, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, ErrorState, StatCard } from "@/components/ui";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useStorageInfo } from "../hooks";
import styles from "./SettingsScreen.module.css";

/** Where the data lives and how much there is (read-only). */
export function StorageInfoCard() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const info = useStorageInfo();

  return (
    <Card title={t("settings.sections.data")} description={t("home.intro")}>
      {info.isError ? (
        <ErrorState description={errorMessage(info.error)} onRetry={() => void info.refetch()} />
      ) : (
        <div className={styles.stats}>
          <StatCard
            label={t("settings.data.accounts")}
            icon={<Landmark />}
            loading={info.isPending}
            value={info.data ? format.number(info.data.accounts) : null}
          />
          <StatCard
            label={t("settings.data.categories")}
            icon={<FolderTree />}
            loading={info.isPending}
            value={info.data ? format.number(info.data.categories) : null}
          />
          <StatCard
            label={t("settings.data.storage")}
            icon={<Database />}
            loading={info.isPending}
            value={
              info.data ? (
                <span className={styles.small}>{t(`storage.${info.data.storage}`)}</span>
              ) : null
            }
          />
          <StatCard
            label={t("settings.data.schemaVersion")}
            icon={<Layers />}
            loading={info.isPending}
            value={info.data ? format.number(info.data.schemaVersion) : null}
          />
        </div>
      )}
    </Card>
  );
}
