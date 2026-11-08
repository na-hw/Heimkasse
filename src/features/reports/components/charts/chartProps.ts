import type { ChartTheme } from "@/components/ui";

/** Shared Recharts styling derived from design tokens. */
export function axisProps(theme: ChartTheme) {
  return { stroke: theme.axis, tickLine: false, fontSize: 12 } as const;
}

export function tooltipProps(theme: ChartTheme) {
  return {
    contentStyle: {
      background: theme.surface,
      color: theme.text,
      borderRadius: 8,
      border: `1px solid ${theme.grid}`,
    },
    labelStyle: { color: theme.text },
    itemStyle: { color: theme.text },
    cursor: { fill: theme.grid, opacity: 0.4 },
  } as const;
}

/** In RTL the value axis is mirrored so bars grow in reading direction. */
export const isRtl = () =>
  typeof document !== "undefined" && document.documentElement.dir === "rtl";
