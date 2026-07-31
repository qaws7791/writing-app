import { AdminAnalyticsPage } from "@/features/analytics/ui/admin-analytics-page"
import {
  analyticsWindowDays,
  parseAdminAnalyticsFilters,
  readAnalyticsWindow,
} from "@/features/analytics/model/admin-analytics-filters"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  getAdminAiFeedbackQuality,
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
  const [analyticsResult, lessonAnalyticsResult, aiFeedbackQualityResult] =
    requestOptions === null
      ? [
          unauthenticatedAdminRequestFailure(),
          unauthenticatedAdminRequestFailure(),
          unauthenticatedAdminRequestFailure(),
        ]
      : await Promise.all([
          settleAdminApiRequest(
            getAdminAnalytics({ days: analyticsWindowDays }, requestOptions)
          ),
          settleAdminApiRequest(
            getAdminLessonAnalytics(filters, requestOptions)
          ),
          settleAdminApiRequest(
            getAdminAiFeedbackQuality(
              readAnalyticsWindow(new Date()),
              requestOptions
            )
          ),
        ])

  return (
    <AdminAnalyticsPage
      aiFeedbackQualityResult={aiFeedbackQualityResult}
      analyticsResult={analyticsResult}
      filters={filters}
      lessonAnalyticsResult={lessonAnalyticsResult}
    />
  )
}
