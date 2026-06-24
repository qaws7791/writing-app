import OpenAI from "openai"

import { defaultAiFeedbackAttemptPolicy } from "@workspace/core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import {
  createAiFeedbackService,
  type AiFeedbackService,
} from "@workspace/core/modules/ai-feedback/application/use-cases/ai-feedback.service"
import {
  createOpenAiFeedbackProvider,
  createUnavailableAiFeedbackProvider,
} from "@workspace/core/modules/ai-feedback/infrastructure/adapters/openai-feedback-provider"
import { createDrizzleAiFeedbackRepository } from "@workspace/core/modules/ai-feedback/infrastructure/persistence/ai-feedback-drizzle.repository"
import {
  createLearnerContentService,
  type LearnerContentService,
} from "@workspace/core/modules/content/application/use-cases/learner-content.service"
import { createDrizzleContentRepository } from "@workspace/core/modules/content/infrastructure/persistence/content-drizzle.repository"
import {
  createLearningService,
  type LearningService,
} from "@workspace/core/modules/learning/application/use-cases/learning.service"
import {
  createProgressService,
  type ProgressService,
} from "@workspace/core/modules/learning/application/use-cases/learner-progress.service"
import {
  createDrizzleProfileReader,
  createDrizzleProgressReader,
} from "@workspace/core/modules/learning/infrastructure/persistence/learner-read-models"
import { createDrizzleLearningRepository } from "@workspace/core/modules/learning/infrastructure/persistence/learning-drizzle.repository"
import { type ProfileReader } from "@workspace/core/modules/learning/domain/learner-profile-read-model"
import { type SessionResolver } from "@workspace/core/modules/auth/domain/learner-session"
import {
  createLearnerAuth,
  createLearnerSessionResolver,
} from "@workspace/core/modules/auth/infrastructure/adapters/learner-auth"
import { createWritingAppDatabase } from "@workspace/db"

export type CreateLearnerApiCoreInput = {
  readonly authBaseUrl: string
  readonly betterAuthSecret: string
  readonly cookieDomain?: string
  readonly databaseUrl?: string
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly openAiApiKey?: string
  readonly openAiModel: string
  readonly testAuthEnabled?: boolean
  readonly webOrigin: string
}

export type LearnerApiCore = {
  readonly aiFeedbackService: AiFeedbackService
  readonly authHandler: (request: Request) => Promise<Response>
  readonly close: () => void
  readonly contentService: LearnerContentService
  readonly learningService: LearningService
  readonly profileReader: ProfileReader
  readonly progressService: ProgressService
  readonly sessionResolver: SessionResolver
}

export function createLearnerApiCore(
  input: CreateLearnerApiCoreInput
): LearnerApiCore {
  const database = createWritingAppDatabase(input.databaseUrl)
  const contentRepository = createDrizzleContentRepository(database.db)
  const feedbackRepository = createDrizzleAiFeedbackRepository(database.db)
  const learningRepository = createDrizzleLearningRepository(database.db)
  const progressReader = createDrizzleProgressReader(database.db)
  const auth = createLearnerAuth({
    authBaseUrl: input.authBaseUrl,
    cookieDomain: input.cookieDomain,
    db: database.db,
    googleClientId: input.googleClientId,
    googleClientSecret: input.googleClientSecret,
    secret: input.betterAuthSecret,
    testAuthEnabled: input.testAuthEnabled,
    webOrigin: input.webOrigin,
  })
  const provider =
    input.openAiApiKey === undefined
      ? createUnavailableAiFeedbackProvider()
      : createOpenAiFeedbackProvider({
          client: new OpenAI({
            apiKey: input.openAiApiKey,
          }),
          model: input.openAiModel,
        })

  return {
    aiFeedbackService: createAiFeedbackService({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      contentRepository,
      feedbackRepository,
      provider,
    }),
    authHandler: auth.handler,
    close() {
      database.close()
    },
    contentService: createLearnerContentService({
      contentRepository,
      progressReader,
    }),
    learningService: createLearningService({
      contentRepository,
      learningRepository,
    }),
    profileReader: createDrizzleProfileReader(database.db),
    progressService: createProgressService({
      contentRepository,
      progressReader,
    }),
    sessionResolver: createLearnerSessionResolver(auth, database.db),
  }
}
