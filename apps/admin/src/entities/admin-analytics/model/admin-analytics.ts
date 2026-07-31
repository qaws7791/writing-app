import type {
  getAdminAiFeedbackQuality,
  getAdminAnalytics,
  getAdminLessonAnalytics,
} from "@workspace/http-client/admin"

export type AdminAiFeedbackQuality = Awaited<
  ReturnType<typeof getAdminAiFeedbackQuality>
>

export type AdminAnalytics = Awaited<ReturnType<typeof getAdminAnalytics>>
export type AdminLessonAnalyticsPage = Awaited<
  ReturnType<typeof getAdminLessonAnalytics>
>
