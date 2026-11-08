"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Amount, Button, ProgressBar, StatCard, toast } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { GallerySection } from "./GallerySection";
import styles from "./DesignGallery.module.css";

export function FeedbackDemo() {
  const { t } = useTranslation();
  const format = useFormat();
  return (
    <GallerySection title={t("design.sections.feedback")}>
      <div className={styles.row}>
        <Button onClick={() => toast.success(t("design.feedback.toastSavedTitle"))}>{t("design.feedback.toastSuccess")}</Button>
        <Button
          onClick={() =>
            toast.show({
              title: t("design.feedback.toastDeletedTitle"),
              action: {
                label: t("common.undo"),
                altText: t("common.undo"),
                onAction: () => toast.success(t("design.feedback.toastRestored")),
              },
            })
          }
        >
          {t("design.feedback.toastUndo")}
        </Button>
        <Button onClick={() => toast.error(t("design.feedback.toastErrorTitle"), { description: t("errors.codes.write_failed") })}>
          {t("design.feedback.toastError")}
        </Button>
      </div>
      <div className={styles.stats}>
        <StatCard label={t("design.feedback.balance")} icon={<Wallet />} value={<Amount cents={1234567} variant="neutral" size="lg" />} />
        <StatCard
          label={t("design.feedback.income")}
          icon={<ArrowDownLeft />}
          value={<Amount cents={320000} size="lg" />}
          trend={{ ratio: 0.04, goodWhen: "up" }}
        />
        <StatCard
          label={t("design.feedback.expenses")}
          icon={<ArrowUpRight />}
          value={<Amount cents={-214590} size="lg" />}
          trend={{ ratio: 0.12, goodWhen: "down" }}
        />
      </div>
      <div className={styles.progress}>
        {[40, 85, 112].map((percent) => (
          <ProgressBar
            key={percent}
            label={t("design.feedback.budget")}
            value={percent * 300}
            max={30000}
            warnAt={80}
            valueText={`${format.money(percent * 300)} / ${format.money(30000)}`}
          />
        ))}
      </div>
    </GallerySection>
  );
}
