import type { ContentApplication } from "@workspace/content/ports"
import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createLearningApplication,
  type LearningApplication,
} from "#learning/application/learning-application"
import {
  createLearningProfileStatsQuery,
  createLearningReportingQuery,
  type LearningProfileStats,
  type LearningReportingQuery,
} from "#learning/application/learning-reporting"
import type { LearningApplicationDependencies } from "#learning/application/ports/learning-ports"
import { createLearningContentQueryPort } from "#learning/infrastructure/adapters/content-query-adapter"
import { createDrizzleLearningReadRepository } from "#learning/infrastructure/persistence/learning-read-drizzle-repository"
import {
  createLearnerCursorCodec,
  type LearnerCursorCodec,
} from "#learning/infrastructure/persistence/learner-cursor"
import {
  createDrizzleLearningReportingRepository,
  toLearningUserId,
} from "#learning/infrastructure/persistence/learning-reporting-drizzle-repository"
import { createDrizzleLearnerTransitionRepository } from "#learning/infrastructure/persistence/learning-transition-drizzle-repository"

export type LearningModule = Readonly<{
  application: LearningApplication
  cursor: LearnerCursorCodec
  profileStatsQuery: Readonly<{
    readProfileStats: (userId: string) => Promise<LearningProfileStats>
  }>
  reportingQuery: LearningReportingQuery
}>

export function createLearningModule(
  input: Omit<
    LearningApplicationDependencies,
    "content" | "readRepository" | "transitionRepository"
  > &
    Readonly<{
      content: ContentApplication
      cursorSigningSecret: string
      database: WritingAppDatabase
      presentationSecret: string
    }>
): LearningModule {
  const content = createLearningContentQueryPort(input.content)
  const transitionRepository = createDrizzleLearnerTransitionRepository(
    input.database
  )
  const readRepository = createDrizzleLearningReadRepository(input.database, {
    content,
    presentationSecret: input.presentationSecret,
  })
  const application = createLearningApplication({
    ...input,
    content,
    readRepository,
    transitionRepository,
  })
  const cursor = createLearnerCursorCodec(input.cursorSigningSecret)
  const reportingQuery = createLearningReportingQuery({
    content,
    repository: createDrizzleLearningReportingRepository(input.database),
  })
  const profileStatsQuery = createLearningProfileStatsQuery({
    clock: input.clock,
    reporting: reportingQuery,
  })

  return {
    application,
    cursor,
    profileStatsQuery: {
      readProfileStats(userId: string) {
        return profileStatsQuery.readProfileStats(toLearningUserId(userId))
      },
    },
    reportingQuery,
  }
}

export { learningLearnerDataPurge } from "#learning/infrastructure/persistence/learner-purge"
