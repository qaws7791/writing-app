import type { ContentRepository } from "#core/modules/content/application/ports/content.repository"
import {
  learnerProgressOverviewDtoSchema,
  type LearnerProgressOverviewDto,
} from "#core/modules/learning/domain/learner-read-model.dto"
import type { ProgressCourseStatusFilter } from "#core/modules/learning/domain/learner-read-model.dto"
import {
  filterCoursesByProgressStatus,
  toCourseProgress,
  type ProgressReader,
} from "#core/modules/learning/domain/learning-progress-read-model"

export type ReadProgressOptions = {
  readonly status?: ProgressCourseStatusFilter
}

export type ProgressService = {
  readonly readProgress: (
    userId: string,
    options?: ReadProgressOptions
  ) => Promise<LearnerProgressOverviewDto>
}

export function createProgressService({
  contentRepository,
  progressReader,
}: {
  readonly contentRepository: ContentRepository
  readonly progressReader: ProgressReader
}): ProgressService {
  return {
    async readProgress(userId, options) {
      const [courses, progress] = await Promise.all([
        contentRepository.listCourses(),
        progressReader.readLearnerProgress(userId),
      ])
      const courseProgress = await Promise.all(
        courses.map(async (course) => {
          const courseDetail = await contentRepository.findCourseDetail(
            course.id
          )

          if (courseDetail === null) {
            return null
          }

          return toCourseProgress(course, courseDetail, progress.lessonProgress)
        })
      )

      return learnerProgressOverviewDtoSchema.parse({
        courses: filterCoursesByProgressStatus(
          courseProgress.filter((course) => course !== null),
          options?.status
        ),
        user: {
          currentStreakDays: progress.currentStreakDays,
        },
      })
    },
  }
}
