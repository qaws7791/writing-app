import {
  createLearnerAiFeedbackTransitionService,
  defaultAiFeedbackAttemptPolicy,
  type AiFeedbackAttemptTransitionEvent,
  type AiFeedbackProvider,
  type LearnerAiFeedbackTransitionService,
} from "@workspace/core/ai-feedback"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createLearnerContentService,
  createLearnerCursorCodec,
  createProgressService,
  type CompleteLearnerStepTransitionResult,
  type LearnerContentService,
  type LearnerCursorCodec,
  type LearnerTransitionError,
  type LearnerTransitionRepository,
  type ProgressService,
} from "@workspace/core/learning"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  createLearnerAuthRuntime,
  type LearnerAuthIdentity,
  type LearnerAuthIdentityResolver,
} from "@workspace/auth/learner/server"
import type { IdentityModule } from "@workspace/identity/module"
import type { SessionResolver } from "@workspace/identity/sessions"

import { createLearnerAuthDatabase } from "@/adapters/auth/auth-sqlite-database"
import { createLearnerTestAuthDisplayNameSynchronizer } from "@/adapters/auth/learner-test-auth-display-name-synchronizer"
import { createDrizzleAiFeedbackRepository } from "@/adapters/ai-feedback/ai-feedback-drizzle.repository"
import { createDrizzleLearnerReadModelRepository } from "@/adapters/learning/learner-read-model-drizzle.repository"
import { createDrizzleProfileReader } from "@/adapters/learning/learner-read-models"
import { createDrizzleLearnerTransitionRepository } from "@/adapters/learning/learner-transition-drizzle.repository"

export type CreateLearnerApiCoreInput = {
  readonly aiFeedbackProvider: AiFeedbackProvider
  readonly apiOrigin: string
  readonly cursorSigningSecret: string
  readonly database: WritingAppDatabase
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly learnerAuthSecret: string
  readonly learnerCookieDomain?: string
  readonly identity: IdentityModule
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
  readonly identityRoutes: ReturnType<IdentityModule["createLearnerRoutes"]>
  readonly progressService: ProgressService
  readonly sessionResolver: SessionResolver
}

export function createLearnerApiCore(
  input: CreateLearnerApiCoreInput
): LearnerApiCore {
  const {
    aiFeedbackProvider,
    apiOrigin,
    cursorSigningSecret,
    database,
    googleClientId,
    googleClientSecret,
    learnerAuthSecret,
    learnerCookieDomain,
    onAiFeedbackAttemptTransition,
    testAuthEnabled,
    webOrigin,
  } = input
  const learnerReadModelRepository = createDrizzleLearnerReadModelRepository(
    database,
    {
      presentationSecret: cursorSigningSecret,
    }
  )
  const learnerTransitionRepository =
    createDrizzleLearnerTransitionRepository(database)
  const cursorCodec = createLearnerCursorCodec(cursorSigningSecret)
  const profileStatsQuery = createDrizzleProfileReader(database)
  const auth = createLearnerAuthRuntime({
    apiOrigin,
    database: createLearnerAuthDatabase(database),
    googleClientId,
    googleClientSecret,
    identityProvisioner: createIdentityProvisioner(input.identity),
    secret: learnerAuthSecret,
    cookieDomain: learnerCookieDomain,
    testAuth:
      testAuthEnabled === true
        ? {
            kind: "enabled",
            ...createLearnerTestAuthDisplayNameSynchronizer(
              database,
              input.identity.application
            ),
          }
        : { kind: "disabled" },
    webOrigin,
  })
  const sessionResolver = input.identity.createLearnerSessionResolver(
    createLearnerAuthenticationPort(auth.identityResolver)
  )

  return {
    authHandler: auth.authHandler,
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
    identityRoutes: input.identity.createLearnerRoutes({
      profileStatsQuery,
      sessionResolver,
    }),
    progressService: createProgressService({
      readModelRepository: learnerReadModelRepository,
    }),
    sessionResolver,
  }
}

function createIdentityProvisioner(identity: IdentityModule) {
  return {
    async provision(authIdentity: LearnerAuthIdentity) {
      await identity.provisioningPort.provision({
        ...authIdentity,
        id: userIdSchema.parse(authIdentity.id),
      })
    },
  }
}

function createLearnerAuthenticationPort(
  resolver: LearnerAuthIdentityResolver
) {
  return {
    async resolveIdentity(headers: Headers) {
      const identity = await resolver.resolveIdentity(headers)
      if (identity === null) return null

      const userId = userIdSchema.safeParse(identity.id)
      return userId.success ? { ...identity, id: userId.data } : null
    },
  }
}
