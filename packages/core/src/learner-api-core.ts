import OpenAI from "openai"

import {
  createAiFeedbackService,
  createDrizzleAiFeedbackRepository,
  createOpenAiFeedbackProvider,
  createUnavailableAiFeedbackProvider,
  defaultAiFeedbackAttemptPolicy,
  type AiFeedbackService,
} from "@workspace/core/ai-feedback"
import {
  createDrizzleContentRepository,
  createLearnerContentService,
  type LearnerContentService,
} from "@workspace/core/content"
import {
  createDrizzleProfileReader,
  createDrizzleProgressReader,
  createDrizzleLearningRepository,
  createLearningService,
  createProgressService,
  type LearningService,
  type ProfileReader,
  type ProgressService,
} from "@workspace/core/learning"
import {
  createLearnerAuth,
  createLearnerSessionResolver,
  type SessionResolver,
} from "@workspace/core/auth"
import { createKwepDatabase } from "@workspace/db"

export type CreateLearnerApiCoreInput = {
  readonly authBaseUrl: string
  readonly betterAuthSecret: string
  readonly cookieDomain?: string
  readonly databaseUrl?: string
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly openAiApiKey?: string
  readonly openAiModel: string
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
  const database = createKwepDatabase(input.databaseUrl)
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
