import type { ReactNode } from "react";
import styles from "./Kbd.module.css";

/** Keyboard shortcut hint, always rendered left-to-right. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className={styles.kbd} dir="ltr">
      {children}
    </kbd>
  );
}
