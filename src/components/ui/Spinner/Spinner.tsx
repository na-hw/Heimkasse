import { cn } from "@/lib/utils/cn";
import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: number;
  className?: string;
}

/** Decorative loading indicator. Pair it with text or aria-busy on the parent. */
export function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <span
      className={cn(styles.spinner, className)}
      style={{ inlineSize: size, blockSize: size }}
      aria-hidden="true"
    />
  );
}
