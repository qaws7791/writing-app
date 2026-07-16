import OpenAI from "openai"

import { defaultAiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import {
  createLearnerAiFeedbackTransitionService,
  type LearnerAiFeedbackTransitionService,
} from "#core/modules/ai-feedback/application/use-cases/ai-feedback.service"
import {
  createOpenAiFeedbackProvider,
  createUnavailableAiFeedbackProvider,
  type OpenAiUsageEvent,
} from "#core/modules/ai-feedback/infrastructure/adapters/openai-feedback-provider"
import { createDrizzleAiFeedbackRepository } from "#core/modules/ai-feedback/infrastructure/persistence/ai-feedback-drizzle.repository"
import type { AiFeedbackAttemptTransitionEvent } from "#core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import {
  createLearnerContentService,
  type LearnerContentService,
} from "#core/modules/content/application/use-cases/learner-content.service"
import {
  createProgressService,
  type ProgressService,
} from "#core/modules/learning/application/use-cases/learner-progress.service"
import { createLearnerCursorCodec } from "#core/modules/learning/application/learner-cursor"
import { createDrizzleLearnerReadModelRepository } from "#core/modules/learning/infrastructure/persistence/learner-read-model-drizzle.repository"
import { createDrizzleProfileReader } from "#core/modules/learning/infrastructure/persistence/learner-read-models"
import { createDrizzleLearnerTransitionRepository } from "#core/modules/learning/infrastructure/persistence/learner-transition-drizzle.repository"
import {
  createLearnerTransitionService,
  type LearnerTransitionService,
} from "#core/modules/learning/application/use-cases/learner-transition.service"
import { type ProfileReader } from "#core/modules/learning/domain/learner-profile-read-model"
import { type SessionResolver } from "#core/modules/auth/domain/learner-session"
import {
  createLearnerAuth,
  createLearnerSessionResolver,
} from "#core/modules/auth/infrastructure/adapters/learner-auth"
import { createDrizzleLearnerProfileRepository } from "#core/modules/auth/infrastructure/persistence/learner-profile-drizzle.repository"
import { createWritingAppDatabase } from "@workspace/db"

export type CreateLearnerApiCoreInput = {
  readonly aiFeedbackProvider?: AiFeedbackProvider
  readonly authBaseUrl: string
  readonly betterAuthSecret: string
  readonly cookieDomain?: string
  readonly cursorSigningSecret: string
  readonly databaseUrl?: string
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly openAiApiKey?: string
  readonly openAiModel: string
  readonly onOpenAiUsage?: (event: OpenAiUsageEvent) => void
  readonly onAiFeedbackAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
  readonly testAuthEnabled?: boolean
  readonly webOrigin: string
}

export type LearnerApiCore = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly close: () => void
  readonly contentService: LearnerContentService
  readonly learnerAiFeedbackService: LearnerAiFeedbackTransitionService
  readonly learnerTransitionService: LearnerTransitionService
  readonly profileReader: ProfileReader
  readonly progressService: ProgressService
  readonly sessionResolver: SessionResolver
}

export function createLearnerApiCore(
  input: CreateLearnerApiCoreInput
): LearnerApiCore {
  const database = createWritingAppDatabase(input.databaseUrl)
  const feedbackRepository = createDrizzleAiFeedbackRepository(database.db)
  const learnerTransitionRepository = createDrizzleLearnerTransitionRepository(
    database.db
  )
  const cursorCodec = createLearnerCursorCodec(input.cursorSigningSecret)
  const readModelRepository = createDrizzleLearnerReadModelRepository(
    database.db,
    { presentationSecret: input.cursorSigningSecret }
  )
  const learnerProfileRepository = createDrizzleLearnerProfileRepository(
    database.db
  )
  const auth = createLearnerAuth({
    authBaseUrl: input.authBaseUrl,
    cookieDomain: input.cookieDomain,
    db: database.db,
    googleClientId: input.googleClientId,
    googleClientSecret: input.googleClientSecret,
    profileRepository: learnerProfileRepository,
    secret: input.betterAuthSecret,
    testAuthEnabled: input.testAuthEnabled,
    webOrigin: input.webOrigin,
  })
  const provider =
    input.aiFeedbackProvider ??
    (input.openAiApiKey === undefined
      ? createUnavailableAiFeedbackProvider()
      : createOpenAiFeedbackProvider({
          client: new OpenAI({
            apiKey: input.openAiApiKey,
          }),
          model: input.openAiModel,
          onUsage: input.onOpenAiUsage,
        }))

  return {
    authHandler: auth.handler,
    close() {
      database.close()
    },
    contentService: createLearnerContentService({
      cursorCodec,
      readModelRepository,
    }),
    learnerAiFeedbackService: createLearnerAiFeedbackTransitionService({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository,
      learnerTransitionRepository,
      onAttemptTransition: input.onAiFeedbackAttemptTransition,
      provider,
    }),
    learnerTransitionService: createLearnerTransitionService(
      learnerTransitionRepository
    ),
    profileReader: createDrizzleProfileReader(database.db),
    progressService: createProgressService({
      cursorCodec,
      readModelRepository,
    }),
    sessionResolver: createLearnerSessionResolver(
      auth,
      learnerProfileRepository
    ),
  }
}
