"use client"

import dynamic from "next/dynamic"

import type { AdminChartPanelProps } from "@/entities/admin-analytics/model/admin-chart-types"

const AdminAnalyticsChart = dynamic(
  () =>
    import("@/entities/admin-analytics/ui/admin-charts").then(
      (module) => module.AdminAnalyticsChart
    ),
  { loading: ChartLoading, ssr: false }
)

export function AdminChartVisual(props: AdminChartPanelProps) {
  return (
    <div aria-hidden="true" className="mt-5 min-h-[260px]">
      <AdminAnalyticsChart {...props} />
    </div>
  )
}

function ChartLoading() {
  return (
    <div
      className="h-[260px] animate-pulse rounded-3xl bg-muted"
      role="presentation"
    />
  )
}
