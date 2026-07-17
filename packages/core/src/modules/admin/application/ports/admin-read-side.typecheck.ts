import type { AdminAnalyticsReader } from "#core/modules/admin/application/ports/admin-analytics.reader"
import type { AdminDashboardReader } from "#core/modules/admin/application/ports/admin-dashboard.reader"

type Assert<TValue extends true> = TValue
type Equal<TLeft, TRight> = [TLeft] extends [TRight]
  ? [TRight] extends [TLeft]
    ? true
    : false
  : false
export type AdminReadSideBoundary = [
  Assert<Equal<keyof AdminDashboardReader, "readDashboard">>,
  Assert<
    Equal<keyof AdminAnalyticsReader, "readAnalytics" | "readLessonAnalytics">
  >,
]
