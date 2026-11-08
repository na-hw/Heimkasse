"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

const loading = () => <Skeleton width="100%" height="100%" />;

/** Recharts is heavy – every chart is code-split and loaded on demand. */
export const CategoryBarChart = dynamic(() => import("./CategoryBarChart"), {
  ssr: false,
  loading,
});
export const IncomeExpenseChart = dynamic(() => import("./IncomeExpenseChart"), {
  ssr: false,
  loading,
});
export const LineSeriesChart = dynamic(() => import("./LineSeriesChart"), { ssr: false, loading });
