"use client";

import { useEffect, useRef } from "react";
import { todayIso } from "@/lib/utils/dates";
import { useGenerateDue } from "../hooks";

/** Books due recurring transactions once when the app starts. */
export function RecurringAutoRunner() {
  const generate = useGenerateDue();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generate.mutate(todayIso());
  }, [generate]);
  return null;
}
