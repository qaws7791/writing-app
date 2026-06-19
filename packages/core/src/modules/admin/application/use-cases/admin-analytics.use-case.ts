import {
  adminAnalyticsDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
  type AdminAnalyticsDto,
  type AdminLessonAnalyticsPageDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  AnalyticsReader,
  ReadAdminAnalyticsInput,
  ReadAdminLessonAnalyticsInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

export type AdminAnalyticsUseCase = {
  readonly getAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminAnalyticsDto>
  readonly getLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminLessonAnalyticsPageDto>
}

export function createAdminAnalyticsUseCase(
  analyticsReader: AnalyticsReader
): AdminAnalyticsUseCase {
  return {
    async getAnalytics(input) {
      return adminAnalyticsDtoSchema.parse(
        await analyticsReader.readAnalytics(input)
      )
    },
    async getLessonAnalytics(input) {
      return adminLessonAnalyticsPageDtoSchema.parse(
        await analyticsReader.readLessonAnalytics(input)
      )
    },
  }
}
