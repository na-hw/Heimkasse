"use client";

import { Database, FolderTree, Landmark, Layers, Settings } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, Card, ErrorState, PageHeader, StatCard } from "@/components/ui";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useDocumentTitle } from "@/lib/utils/useDocumentTitle";
import { useOverviewStats } from "../hooks";
import { greetingKey } from "../greeting";
import styles from "./OverviewScreen.module.css";

/** Start page: greeting, local data status and a pointer to settings. */
export function OverviewScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const stats = useOverviewStats();
  useDocumentTitle(t("nav.home"));

  return (
    <>
      <PageHeader title={t(greetingKey(new Date()))} description={t("home.intro")} />
      <div className={styles.grid}>
        <section aria-labelledby="status-heading" className={styles.status}>
          <h2 id="status-heading" className={styles.sectionTitle}>
            {t("home.statusTitle")}
          </h2>
          {stats.isError ? (
            <ErrorState
              description={errorMessage(stats.error)}
              onRetry={() => void stats.refetch()}
            />
          ) : (
            <div className={styles.stats}>
              <StatCard
                label={t("home.accounts")}
                icon={<Landmark />}
                loading={stats.isPending}
                value={stats.data ? format.number(stats.data.accounts) : null}
              />
              <StatCard
                label={t("home.categories")}
                icon={<FolderTree />}
                loading={stats.isPending}
                value={stats.data ? format.number(stats.data.categories) : null}
              />
              <StatCard
                label={t("home.storage")}
                icon={<Database />}
                loading={stats.isPending}
                value={
                  stats.data ? (
                    <span className={styles.small}>{t(`storage.${stats.data.storage}`)}</span>
                  ) : null
                }
              />
              <StatCard
                label={t("home.schemaVersion")}
                icon={<Layers />}
                loading={stats.isPending}
                value={stats.data ? format.number(stats.data.schemaVersion) : null}
              />
            </div>
          )}
        </section>
        <Card title={t("home.customizeTitle")} description={t("home.customizeText")}>
          <div>
            <Button asChild variant="primary">
              <Link href="/settings/">
                <Settings aria-hidden="true" />
                {t("home.openSettings")}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
