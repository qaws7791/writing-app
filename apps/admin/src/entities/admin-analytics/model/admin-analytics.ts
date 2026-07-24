import type {
  getAdminAnalytics,
  getAdminLessonAnalytics,
} from "@workspace/http-client/admin"

export type AdminAnalytics = Awaited<ReturnType<typeof getAdminAnalytics>>
export type AdminLessonAnalyticsPage = Awaited<
  ReturnType<typeof getAdminLessonAnalytics>
>
