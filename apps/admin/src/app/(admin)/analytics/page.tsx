import { AdminAnalyticsPage } from "@/features/analytics/ui/admin-analytics-page"
import { parseAdminAnalyticsFilters } from "@/features/analytics/model/admin-analytics-filters"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  getAdminAnalytics,
  getAdminLessonAnalytics,
} from "@workspace/http-client/admin"

export default async function AdminAnalyticsRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAdminAnalyticsFilters(await searchParams)
  const requestOptions = await getServerAdminRequestOptions()
  const [analyticsResult, lessonAnalyticsResult] =
    requestOptions === null
      ? [
          unauthenticatedAdminRequestFailure(),
          unauthenticatedAdminRequestFailure(),
        ]
      : await Promise.all([
          settleAdminApiRequest(
            getAdminAnalytics({ days: 30 }, requestOptions)
          ),
          settleAdminApiRequest(
            getAdminLessonAnalytics(filters, requestOptions)
          ),
        ])

  return (
    <AdminAnalyticsPage
      analyticsResult={analyticsResult}
      filters={filters}
      lessonAnalyticsResult={lessonAnalyticsResult}
    />
  )
}
