"use client";

import { useEffect, useState } from "react";
import { getDb, isTauriRuntime } from "@/lib/db";
import styles from "./DbStatus.module.css";

type Status =
  | { kind: "checking" }
  | { kind: "browser" }
  | { kind: "ok"; sqliteVersion: string }
  | { kind: "error"; message: string };

/** Placeholder diagnostic: shows runtime + whether kiseh.db can be opened. */
export function DbStatus() {
  const [status, setStatus] = useState<Status>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await isTauriRuntime())) {
          if (!cancelled) setStatus({ kind: "browser" });
          return;
        }
        const db = await getDb();
        const rows = await db.select<{ v: string }[]>("SELECT sqlite_version() AS v");
        if (!cancelled) setStatus({ kind: "ok", sqliteVersion: rows[0]?.v ?? "?" });
      } catch (err) {
        if (!cancelled) setStatus({ kind: "error", message: String(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const label = {
    checking: "Checking runtime…",
    browser: "Running in browser – database available in the Tauri app only",
    ok: status.kind === "ok" ? `Tauri ✓ · kiseh.db connected (SQLite ${status.sqliteVersion})` : "",
    error: status.kind === "error" ? `Database error: ${status.message}` : "",
  }[status.kind];

  return (
    <p className={styles.status} data-kind={status.kind} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </p>
  );
}
