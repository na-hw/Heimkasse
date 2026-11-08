"use client";

import { Gauge, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CategoryIcon,
  ChartContainer,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
  StatCard,
} from "@/components/ui";
import { ValueBarChart } from "@/features/reports/components/charts";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import list from "@/features/shared/components/EntityList.module.css";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import { consumptionPeriods, meterStats } from "../consumption";
import { useMeterMutations, useMeters } from "../hooks";
import type { Meter, MeterReading } from "../schemas";
import { MeterFormDialog } from "./MeterFormDialog";
import { ReadingFormDialog } from "./ReadingFormDialog";
import { METER_APPEARANCE } from "./meterAppearance";
import styles from "./MetersPanel.module.css";

/** Meters with readings, consumption per period and yearly projection. */
export function MetersPanel() {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const meters = useMeters();
  const mutations = useMeterMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meterTarget, setMeterTarget] = useState<{ meter: Meter | null } | null>(null);
  const [readingTarget, setReadingTarget] = useState<{
    meter: Meter;
    readings: MeterReading[];
    reading: MeterReading | null;
  } | null>(null);

  const data = meters.data;
  const selected = data?.find((m) => m.meter.id === selectedId) ?? data?.[0];
  const units = (value: number, unit: string, digits = 1) =>
    `${format.number(value, { maximumFractionDigits: digits })} ${unit}`;

  const addMeter = (
    <Button iconStart={<Plus />} onClick={() => setMeterTarget({ meter: null })}>
      {t("meters.add")}
    </Button>
  );

  const dialogs = (
    <>
      <MeterFormDialog
        target={meterTarget}
        onClose={() => setMeterTarget(null)}
        onCreated={(m) => setSelectedId(m.id)}
      />
      <ReadingFormDialog target={readingTarget} onClose={() => setReadingTarget(null)} />
    </>
  );

  if (meters.isError)
    return (
      <ErrorState description={errorMessage(meters.error)} onRetry={() => void meters.refetch()} />
    );
  if (!data)
    return (
      <Card padding="none">
        <ListSkeleton />
      </Card>
    );
  if (!selected)
    return (
      <>
        <Card>
          <EmptyState
            icon={<Gauge />}
            title={t("meters.empty.title")}
            description={t("meters.empty.text")}
            action={
              <Button
                variant="primary"
                iconStart={<Plus />}
                onClick={() => setMeterTarget({ meter: null })}
              >
                {t("meters.add")}
              </Button>
            }
          />
        </Card>
        {dialogs}
      </>
    );

  const { meter, readings } = selected;
  const stats = meterStats(readings, meter.price_per_unit_millicents);
  const periods = consumptionPeriods(readings, meter.price_per_unit_millicents);
  const chartRows = periods.map((p) => ({
    label: format.date(p.to, "dayMonth"),
    period: `${format.date(p.from, "medium")} – ${format.date(p.to, "medium")}`,
    value: p.amount,
    days: p.days,
    perDay: p.perDay,
    cost: p.costCents,
  }));
  const consumptionSince = new Map(periods.map((p) => [p.to, p.amount]));
  const hasPrice = meter.price_per_unit_millicents > 0;

  return (
    <div className={styles.layout}>
      <div className={styles.toolbar}>
        <div role="group" aria-label={t("meters.select")} className={styles.picker}>
          {data.map(({ meter: m, readings: r }) => {
            const look = METER_APPEARANCE[m.type];
            const last = r.at(-1);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={m.id === meter.id}
                className={cn(styles.meterButton, m.id === meter.id && styles.active)}
                onClick={() => setSelectedId(m.id)}
              >
                <CategoryIcon icon={look.icon} color={look.color} />
                <span className={styles.meterText}>
                  <span className={styles.meterName}>{m.name}</span>
                  <span className={list.meta}>
                    {last ? units(last.value, m.unit, 3) : t(`meters.types.${m.type}`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {addMeter}
      </div>

      <Card
        title={meter.name}
        description={[t(`meters.types.${meter.type}`), meter.meter_number]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Button
              variant="primary"
              iconStart={<Plus />}
              onClick={() => setReadingTarget({ meter, readings, reading: null })}
            >
              {t("meters.readings.add")}
            </Button>
            <DropdownMenu
              trigger={
                <IconButton
                  label={t("common.actionsFor", { name: meter.name })}
                  icon={<MoreHorizontal />}
                />
              }
              items={[
                {
                  id: "edit",
                  label: t("common.edit"),
                  icon: <Pencil />,
                  onSelect: () => setMeterTarget({ meter }),
                },
                { type: "separator", id: "sep" },
                {
                  id: "delete",
                  label: t("common.delete"),
                  icon: <Trash2 />,
                  tone: "danger",
                  onSelect: () => {
                    setSelectedId(null);
                    mutations.remove.mutate(meter.id);
                  },
                },
              ]}
            />
          </>
        }
      >
        <div className={styles.stats}>
          <StatCard
            label={t("meters.stats.latest")}
            value={stats.latest ? units(stats.latest.value, meter.unit, 3) : "–"}
            hint={
              stats.latest
                ? t("meters.stats.latestOn", { date: format.date(stats.latest.date, "medium") })
                : undefined
            }
          />
          <StatCard
            label={t("meters.stats.perDay")}
            value={stats.perDay !== null ? units(stats.perDay, meter.unit, 2) : "–"}
            hint={stats.perDay === null ? t("meters.stats.needTwo") : undefined}
          />
          <StatCard
            label={t("meters.stats.yearly")}
            value={stats.yearly !== null ? units(stats.yearly, meter.unit, 0) : "–"}
          />
          {hasPrice && (
            <StatCard
              label={t("meters.stats.yearlyCost")}
              value={stats.yearlyCostCents !== null ? format.money(stats.yearlyCostCents) : "–"}
            />
          )}
        </div>
      </Card>

      {chartRows.length > 0 && (
        <ChartContainer
          title={t("meters.consumption.title")}
          description={t("meters.consumption.description")}
          data={chartRows}
          columns={[
            { key: "period", header: t("meters.consumption.period") },
            {
              key: "value",
              header: t("meters.consumption.amount"),
              align: "end",
              format: (v) => units(Number(v), meter.unit),
            },
            {
              key: "days",
              header: t("meters.consumption.days"),
              align: "end",
              format: (v) => format.number(Number(v)),
            },
            {
              key: "perDay",
              header: t("meters.consumption.perDay"),
              align: "end",
              format: (v) => units(Number(v), meter.unit, 2),
            },
            ...(hasPrice
              ? [
                  {
                    key: "cost" as const,
                    header: t("meters.consumption.cost"),
                    align: "end" as const,
                    format: (v: unknown) => format.money(Number(v)),
                  },
                ]
              : []),
          ]}
        >
          <ValueBarChart
            data={chartRows}
            name={t("meters.consumption.amount")}
            formatValue={(v) => units(v, meter.unit, 0)}
          />
        </ChartContainer>
      )}

      <Card title={t("meters.readings.title")} padding="none">
        {readings.length === 0 ? (
          <p className={styles.empty}>{t("meters.readings.empty")}</p>
        ) : (
          <ul role="list" className={list.list}>
            {[...readings].reverse().map((reading) => {
              const diff = consumptionSince.get(reading.date);
              const label = format.date(reading.date, "medium");
              return (
                <li key={reading.id} className={list.row}>
                  <div className={list.main}>
                    <span className={list.title}>{units(reading.value, meter.unit, 3)}</span>
                    <span className={list.meta}>
                      {[
                        label,
                        diff !== undefined ? `+${units(diff, meter.unit)}` : null,
                        reading.note,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <DropdownMenu
                    trigger={
                      <IconButton
                        label={t("common.actionsFor", { name: label })}
                        icon={<MoreHorizontal />}
                      />
                    }
                    items={[
                      {
                        id: "edit",
                        label: t("common.edit"),
                        icon: <Pencil />,
                        onSelect: () => setReadingTarget({ meter, readings, reading }),
                      },
                      {
                        id: "delete",
                        label: t("common.delete"),
                        icon: <Trash2 />,
                        tone: "danger",
                        onSelect: () => mutations.removeReading.mutate(reading.id),
                      },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {dialogs}
    </div>
  );
}
