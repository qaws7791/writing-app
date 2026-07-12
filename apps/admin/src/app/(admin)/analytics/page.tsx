import { AdminAnalyticsPage } from "@/features/analytics/admin-analytics-page"
import { createAdminAnalyticsApi } from "@/features/analytics/admin-analytics-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminAnalyticsRoute() {
  const api = createAdminAnalyticsApi(
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
