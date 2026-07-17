import type { LearnerProgressCourse } from "@workspace/contracts/learning/read-data"
import { learnerProgressCourseSchema } from "@workspace/contracts/learning/read-data"

import type {
  LearnerProgressReadQuery,
  LearnerReadModelPage,
  LearnerReadModelRepository,
} from "#core/modules/learning/application/ports/learner-read-model.repository"

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
    async readProgress(query) {
      const page = await readModelRepository.listProgress(query)

      return {
        items: learnerProgressCourseSchema.array().parse(page.items),
        nextPosition: page.nextPosition,
      }
    },
  }
}
