import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createLearningReportingQuery as createApplicationLearningReportingQuery,
  type LearningReportingQuery,
} from "#learning/application/learning-reporting"
import type { LearningContentQueryPort } from "#learning/application/ports/learning-ports"
import { createDrizzleLearningReportingRepository } from "#learning/infrastructure/persistence/learning-reporting-drizzle-repository"

export function createLearningReportingQuery(input: {
  readonly content: Pick<LearningContentQueryPort, "listPublishedCourses">
  readonly database: WritingAppDatabase
}): LearningReportingQuery {
  return createApplicationLearningReportingQuery({
    content: input.content,
    repository: createDrizzleLearningReportingRepository(input.database),
  })
}

export type { LearningReportingQuery } from "#learning/application/learning-reporting"

export {
  addLearningCalendarDays,
  calculateCurrentStreakDays,
  groupLearningActivityDatesByUserId,
  isLearningDateKeyInRange,
  toLearningDateKey,
  type LearningDateKey,
} from "#learning/domain/learning-date"
