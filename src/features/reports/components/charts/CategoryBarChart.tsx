"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { axisProps, isRtl, tooltipProps } from "./chartProps";

export interface CategoryBarDatum {
  name: string;
  cents: number;
}

/** Horizontal bars per category (largest first). Loaded lazily. */
export default function CategoryBarChart({ data }: { data: readonly CategoryBarDatum[] }) {
  const theme = useChartTheme();
  const format = useFormat();
  const rtl = isRtl();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={[...data]}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 16 }}
      >
        <CartesianGrid stroke={theme.grid} horizontal={false} />
        <XAxis
          type="number"
          reversed={rtl}
          tickFormatter={(v: number) => format.money(v, { wholeUnits: true })}
          {...axisProps(theme)}
        />
        <YAxis
          type="category"
          dataKey="name"
          orientation={rtl ? "right" : "left"}
          width={120}
          {...axisProps(theme)}
        />
        <Tooltip formatter={(v) => format.money(Number(v))} {...tooltipProps(theme)} />
        <Bar dataKey="cents" radius={4} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={theme.series[i % theme.series.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
