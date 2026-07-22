import {
  createLearnerContentService,
  type LearnerContentService,
} from "#learning/application/learner-content-service"
import {
  createProgressService,
  type ProgressService,
} from "#learning/application/learner-progress-service"
import type { LearnerReadModelRepository } from "#learning/application/ports/learner-read-model-repository"

export type LearningQueries = Readonly<{
  content: LearnerContentService
  progress: ProgressService
}>

export function createLearningQueries(
  repository: LearnerReadModelRepository
): LearningQueries {
  return Object.freeze({
    content: createLearnerContentService({ readModelRepository: repository }),
    progress: createProgressService({ readModelRepository: repository }),
  })
}

export type {
  LearnerCourseReadQuery,
  LearnerProgressReadQuery,
  LearnerReadModelPage,
} from "#learning/application/ports/learner-read-model-repository"
export type { LearnerContentService } from "#learning/application/learner-content-service"
export type { ProgressService } from "#learning/application/learner-progress-service"
