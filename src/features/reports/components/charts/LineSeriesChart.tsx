"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { axisProps, isRtl, tooltipProps } from "./chartProps";

export interface LineSeries {
  key: string;
  name: string;
}

interface Props {
  /** Rows with a `label` and one numeric value (cents) per series key. */
  data: readonly ({ label: string } & Record<string, number | string>)[];
  series: readonly LineSeries[];
}

/** One or more money lines over time (trends, net worth). Loaded lazily. */
export default function LineSeriesChart({ data, series }: Props) {
  const theme = useChartTheme();
  const format = useFormat();
  const rtl = isRtl();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={theme.grid} vertical={false} />
        <XAxis dataKey="label" reversed={rtl} {...axisProps(theme)} />
        <YAxis
          orientation={rtl ? "right" : "left"}
          width={72}
          tickFormatter={(v: number) => format.money(v, { wholeUnits: true })}
          {...axisProps(theme)}
        />
        <Tooltip formatter={(v) => format.money(Number(v))} {...tooltipProps(theme)} />
        {series.length > 1 && <Legend wrapperStyle={{ color: theme.text, fontSize: 12 }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stroke={theme.series[i % theme.series.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
