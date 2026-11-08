"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { toast } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { notifyNative } from "@/lib/utils/notify";
import { pendingReminders } from "../deadlines";
import { useContracts } from "../hooks";

const SETTINGS_KEY = "contract_reminders";
const notifiedSchema = z.record(z.string(), z.number().int());
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Reminds 30, 14 and 3 days before a cancellation deadline – once per stage
 * (remembered in settings). Checks on start, on data changes and hourly.
 */
export function ContractReminderWatcher() {
  const { t } = useTranslation();
  const format = useFormat();
  const repos = useRepositories();
  const contracts = useContracts();
  const running = useRef<Promise<void>>(Promise.resolve());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const active = contracts.data?.active;
    if (!active) return;
    running.current = running.current
      .then(async () => {
        const notified = await repos.settings.getValue(SETTINGS_KEY, notifiedSchema, {});
        const { due, next } = pendingReminders(
          active.map((v) => ({ id: v.contract.id, info: v.info })),
          notified,
        );
        for (const reminder of due) {
          const contract = active.find((v) => v.contract.id === reminder.contractId)?.contract;
          if (!contract) continue;
          const date = format.date(reminder.deadline, "medium");
          const title = t("contracts.reminder.title", { name: contract.name });
          const body =
            reminder.daysLeft === 0
              ? t("contracts.reminder.today", { date })
              : t("contracts.reminder.body", { count: reminder.daysLeft, date });
          toast.show({ title, description: body, tone: reminder.stage === 3 ? "error" : "info" });
          await notifyNative(title, body).catch(() => false);
        }
        if (JSON.stringify(next) !== JSON.stringify(notified))
          await repos.settings.setValue(SETTINGS_KEY, next);
      })
      .catch(() => {
        // Best-effort; deadlines are always visible on the contracts page.
      });
  }, [contracts.data, tick, repos, t, format]);

  return null;
}
