import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  width?: CSSProperties["inlineSize"];
  height?: CSSProperties["blockSize"];
  radius?: "sm" | "md" | "lg" | "full";
  className?: string;
}

/**
 * Loading placeholder. Decorative: put aria-busy="true" and an accessible
 * loading label on the surrounding region instead.
 */
export function Skeleton({
  width = "100%",
  height = "1em",
  radius = "sm",
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, styles[radius], className)}
      style={{ inlineSize: width, blockSize: height }}
    />
  );
}

/** Several text lines; the last one is shorter. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <span className={styles.lines} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lines > 1 ? "60%" : "100%"} />
      ))}
    </span>
  );
}
