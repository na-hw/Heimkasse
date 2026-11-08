import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import styles from "./DesignGallery.module.css";

/** One titled block of the gallery. */
export function GallerySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title}>
      <div className={styles.sectionBody}>{children}</div>
    </Card>
  );
}
