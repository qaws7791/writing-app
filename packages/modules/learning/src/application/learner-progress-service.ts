import type { LearnerProgressCourse } from "#learning/application/learning-read-model"
import type {
  LearnerProgressReadQuery,
  LearnerReadModelPage,
  LearnerReadModelRepository,
} from "#learning/application/ports/learner-read-model-repository"

export type ProgressService = {
  readonly readProgress: (
    query: LearnerProgressReadQuery
  ) => Promise<LearnerReadModelPage<LearnerProgressCourse>>
}

export function createProgressService({
  readModelRepository,
}: {
  readonly readModelRepository: LearnerReadModelRepository
}): ProgressService {
  return {
    readProgress(query) {
      return readModelRepository.listProgress(query)
    },
  }
}
