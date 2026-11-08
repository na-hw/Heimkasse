"use client";

import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui";
import styles from "./EntityList.module.css";

/** Loading placeholder for entity lists. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div aria-busy="true" aria-label={t("a11y.loading")} role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton width={40} height={40} radius="md" />
          <div style={{ flex: 1 }}>
            <Skeleton width="45%" />
          </div>
          <Skeleton width={80} />
        </div>
      ))}
    </div>
  );
}
