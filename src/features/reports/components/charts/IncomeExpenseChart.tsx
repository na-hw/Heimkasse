"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "@/components/ui";
import { useFormat } from "@/lib/i18n/useFormat";
import { axisProps, isRtl, tooltipProps } from "./chartProps";

export interface IncomeExpenseDatum {
  label: string;
  income: number;
  expense: number;
  net: number;
}

interface Props {
  data: readonly IncomeExpenseDatum[];
  labels: { income: string; expense: string; net: string };
}

/** Income vs. expense bars per month with the net result as a line. Loaded lazily. */
export default function IncomeExpenseChart({ data, labels }: Props) {
  const theme = useChartTheme();
  const format = useFormat();
  const rtl = isRtl();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={theme.grid} vertical={false} />
        <XAxis dataKey="label" reversed={rtl} {...axisProps(theme)} />
        <YAxis
          orientation={rtl ? "right" : "left"}
          width={72}
          tickFormatter={(v: number) => format.money(v, { wholeUnits: true })}
          {...axisProps(theme)}
        />
        <Tooltip formatter={(v) => format.money(Number(v))} {...tooltipProps(theme)} />
        <Legend wrapperStyle={{ color: theme.text, fontSize: 12 }} />
        <Bar
          dataKey="income"
          name={labels.income}
          fill={theme.income}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expense"
          name={labels.expense}
          fill={theme.expense}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
        <Line
          dataKey="net"
          name={labels.net}
          stroke={theme.text}
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
