"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/components/ui";
import { axisProps, isRtl, tooltipProps } from "./chartProps";

export interface ValueBarDatum {
  label: string;
  value: number;
}

interface Props {
  data: readonly ValueBarDatum[];
  /** Formats values for axis and tooltip (units, money, …). */
  formatValue: (value: number) => string;
  name: string;
  colorIndex?: number;
}

/** Vertical bars over time with a custom value format (consumption, contributions). Loaded lazily. */
export default function ValueBarChart({ data, formatValue, name, colorIndex = 0 }: Props) {
  const theme = useChartTheme();
  const rtl = isRtl();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={theme.grid} vertical={false} />
        <XAxis dataKey="label" reversed={rtl} {...axisProps(theme)} />
        <YAxis
          orientation={rtl ? "right" : "left"}
          width={72}
          tickFormatter={(v: number) => formatValue(v)}
          {...axisProps(theme)}
        />
        <Tooltip formatter={(v) => formatValue(Number(v))} {...tooltipProps(theme)} />
        <Bar
          dataKey="value"
          name={name}
          fill={theme.series[colorIndex % theme.series.length]}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
