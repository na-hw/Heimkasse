"use client";

import { CalendarClock, CircleAlert, CircleCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { todayIso } from "@/lib/utils/dates";
import type { ContractView } from "../hooks";

/** Status line of a contract: next cancellation deadline, open-ended or cancelled/ended. */
export function ContractDeadline({ view }: { view: ContractView }) {
  const { t } = useTranslation();
  const format = useFormat();
  const { contract, info } = view;

  if (contract.status !== "active" || !info) {
    const date = contract.cancellation_date;
    const ended = contract.status === "ended" || (date !== null && date < todayIso());
    return (
      <Badge icon={<CircleCheck />}>
        {date
          ? t(ended ? "contracts.status.ended" : "contracts.status.cancelled", {
              date: format.date(date, "medium"),
            })
          : t("contracts.status.ended", { date: "–" })}
      </Badge>
    );
  }

  if (info.kind === "open")
    return (
      <span>{t("contracts.deadline.open", { date: format.date(info.earliestEnd, "medium") })}</span>
    );

  const urgent = info.daysLeft <= 30;
  return (
    <span>
      {t(`contracts.deadline.${info.kind}`, { date: format.date(info.deadline, "medium") })}{" "}
      <Badge
        tone={info.daysLeft <= 3 ? "danger" : urgent ? "warning" : "neutral"}
        icon={urgent ? <CircleAlert /> : <CalendarClock />}
      >
        {info.daysLeft === 0
          ? t("contracts.deadline.today")
          : t("contracts.deadline.daysLeft", { count: info.daysLeft })}
      </Badge>
    </span>
  );
}
