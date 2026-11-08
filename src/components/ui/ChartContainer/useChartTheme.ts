"use client";

import { useEffect, useState } from "react";

export interface ChartTheme {
  series: string[];
  grid: string;
  axis: string;
  text: string;
  surface: string;
  income: string;
  expense: string;
}

const SERIES_VARS = Array.from({ length: 8 }, (_, i) => `--chart-${i + 1}`);

function readTheme(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name).trim();
  return {
    series: SERIES_VARS.map(v),
    grid: v("--chart-grid"),
    axis: v("--chart-axis"),
    text: v("--color-text"),
    surface: v("--color-surface-raised"),
    income: v("--color-income"),
    expense: v("--color-expense"),
  };
}

const FALLBACK: ChartTheme = {
  series: ["#1d6b58", "#3b6fd6", "#c2701b", "#9a4fc4", "#c23b6a", "#2b8a9e", "#7a8a1f", "#6b7570"],
  grid: "#e3e7e4",
  axis: "#5f6a65",
  text: "#17201c",
  surface: "#ffffff",
  income: "#1c7442",
  expense: "#b8322a",
};

/**
 * Resolves chart colors from design tokens (SVG attributes cannot use CSS
 * variables reliably) and updates when the theme changes.
 */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK);
  useEffect(() => {
    const update = () => setTheme(readTheme());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", update);
    return () => {
      observer.disconnect();
      mql.removeEventListener("change", update);
    };
  }, []);
  return theme;
}
