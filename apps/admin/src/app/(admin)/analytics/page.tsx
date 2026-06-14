import { AdminAnalyticsPage } from "@/features/analytics/admin-analytics-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminAnalyticsRoute() {
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
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
