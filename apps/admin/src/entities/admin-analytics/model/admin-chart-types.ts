import type { AdminAnalytics } from "@/entities/admin-analytics/model/admin-analytics"

type AdminDailySeriesPoint = AdminAnalytics["dailySeries"][number]

export type AdminChartKind =
  | "d7-return"
  | "signup-activation"
  | "start-completion"

export type AdminChartPanelProps = Readonly<{
  data: readonly AdminDailySeriesPoint[]
  kind: AdminChartKind
}>
