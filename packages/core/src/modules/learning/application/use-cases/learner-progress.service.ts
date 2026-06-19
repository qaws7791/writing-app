import type { ContentRepository } from "@workspace/core/modules/content/api"
import {
  learnerProgressOverviewDtoSchema,
  type LearnerProgressOverviewDto,
} from "@workspace/core/modules/learning/domain/learner-read-model.dto"
import {
  toCourseProgress,
  type ProgressReader,
} from "@workspace/core/modules/learning/domain/learning-progress-read-model"

export type ProgressService = {
  readonly readProgress: (userId: string) => Promise<LearnerProgressOverviewDto>
}

export function createProgressService({
  contentRepository,
  progressReader,
}: {
  readonly contentRepository: ContentRepository
  readonly progressReader: ProgressReader
}): ProgressService {
  return {
    async readProgress(userId) {
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
        courses: courseProgress.filter((course) => course !== null),
        user: {
          currentStreakDays: progress.currentStreakDays,
        },
      })
    },
  }
}
