import { AdminAnalyticsPage } from "@/features/analytics/ui/admin-analytics-page"
import { createAdminAnalyticsDal } from "@/features/analytics/server/admin-analytics-dal"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"

export default async function AdminAnalyticsRoute() {
  const api = createAdminAnalyticsDal(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const [analyticsResult, lessonAnalyticsResult] = await Promise.all([
    api.getAnalytics({ days: 30 }),
    api.getLessonAnalytics({
      direction: "asc",
      page: 1,
      pageSize: 10,
      query: "",
      sort: "completionRate",
    }),
  ])

  return (
    <AdminAnalyticsPage
      analyticsResult={analyticsResult}
      lessonAnalyticsResult={lessonAnalyticsResult}
    />
  )
}
