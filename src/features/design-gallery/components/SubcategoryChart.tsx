"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/components/ui";

export interface SubcategoryDatum {
  name: string;
  count: number;
}

/** Recharts bar chart, themed via design tokens. Loaded lazily. */
export default function SubcategoryChart({ data }: { data: SubcategoryDatum[] }) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid stroke={theme.grid} vertical={false} />
        <XAxis dataKey="name" stroke={theme.axis} tickLine={false} fontSize={12} />
        <YAxis
          allowDecimals={false}
          stroke={theme.axis}
          tickLine={false}
          fontSize={12}
          width={32}
        />
        <Tooltip contentStyle={{ background: theme.surface, color: theme.text, borderRadius: 8 }} />
        <Bar dataKey="count" fill={theme.series[0]} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
