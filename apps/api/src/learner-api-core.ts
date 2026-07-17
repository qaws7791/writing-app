import {
  createLearnerAiFeedbackTransitionService,
  defaultAiFeedbackAttemptPolicy,
  type AiFeedbackAttemptTransitionEvent,
  type AiFeedbackProvider,
  type LearnerAiFeedbackTransitionService,
} from "@workspace/core/ai-feedback"
import type { SessionResolver } from "@workspace/core/auth"
import {
  createLearnerContentService,
  createLearnerCursorCodec,
  createProgressService,
  type CompleteLearnerStepTransitionResult,
  type LearnerContentService,
  type LearnerCursorCodec,
  type LearnerTransitionError,
  type LearnerTransitionRepository,
  type ProfileReader,
  type ProgressService,
} from "@workspace/core/learning"
import type { WritingAppDatabase } from "@workspace/db"

import {
  createLearnerAuth,
  createLearnerSessionResolver,
} from "@/adapters/auth/learner-auth"
import { createDrizzleLearnerProfileRepository } from "@/adapters/auth/learner-profile-drizzle.repository"
import { createDrizzleAiFeedbackRepository } from "@/adapters/ai-feedback/ai-feedback-drizzle.repository"
import { createDrizzleLearnerReadModelRepository } from "@/adapters/learning/learner-read-model-drizzle.repository"
import { createDrizzleProfileReader } from "@/adapters/learning/learner-read-models"
import { createDrizzleLearnerTransitionRepository } from "@/adapters/learning/learner-transition-drizzle.repository"

export type CreateLearnerApiCoreInput = {
  readonly aiFeedbackProvider: AiFeedbackProvider
  readonly authBaseUrl: string
  readonly betterAuthSecret: string
  readonly cookieDomain?: string
  readonly cursorSigningSecret: string
  readonly database: WritingAppDatabase
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly onAiFeedbackAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
  readonly testAuthEnabled?: boolean
  readonly webOrigin: string
}

export type LearnerApiCore = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly contentService: LearnerContentService
  readonly learnerAiFeedbackService: LearnerAiFeedbackTransitionService<
    LearnerTransitionError,
    CompleteLearnerStepTransitionResult
  >
  readonly learnerCursorCodec: LearnerCursorCodec
  readonly learnerTransitionRepository: Pick<
    LearnerTransitionRepository,
    "completeStep" | "startLesson"
  >
  readonly profileReader: ProfileReader
  readonly progressService: ProgressService
  readonly sessionResolver: SessionResolver
}

export function createLearnerApiCore(
  input: CreateLearnerApiCoreInput
): LearnerApiCore {
  const {
    authBaseUrl,
    aiFeedbackProvider,
    betterAuthSecret,
    cookieDomain,
    cursorSigningSecret,
    database,
    googleClientId,
    googleClientSecret,
    onAiFeedbackAttemptTransition,
    testAuthEnabled,
    webOrigin,
  } = input
  const learnerProfileRepository =
    createDrizzleLearnerProfileRepository(database)
  const learnerReadModelRepository = createDrizzleLearnerReadModelRepository(
    database,
    {
      presentationSecret: cursorSigningSecret,
    }
  )
  const learnerTransitionRepository =
    createDrizzleLearnerTransitionRepository(database)
  const cursorCodec = createLearnerCursorCodec(cursorSigningSecret)
  const auth = createLearnerAuth({
    authBaseUrl,
    cookieDomain,
    db: database,
    googleClientId,
    googleClientSecret,
    profileRepository: learnerProfileRepository,
    secret: betterAuthSecret,
    testAuthEnabled,
    webOrigin,
  })

  return {
    authHandler: auth.handler,
    contentService: createLearnerContentService({
      readModelRepository: learnerReadModelRepository,
    }),
    learnerAiFeedbackService: createLearnerAiFeedbackTransitionService({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository: createDrizzleAiFeedbackRepository(database),
      learnerTransitionRepository,
      onAttemptTransition: onAiFeedbackAttemptTransition,
      provider: aiFeedbackProvider,
    }),
    learnerCursorCodec: cursorCodec,
    learnerTransitionRepository,
    profileReader: createDrizzleProfileReader(database),
    progressService: createProgressService({
      readModelRepository: learnerReadModelRepository,
    }),
    sessionResolver: createLearnerSessionResolver(
      auth,
      learnerProfileRepository
    ),
  }
}
