import type { Database } from "bun:sqlite"
import type { AiFeedbackAttemptTransition } from "@workspace/ai-feedback/application"
import type { AiFeedbackHttpRouteGroup } from "@workspace/ai-feedback/http"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import type { OpenAiUsageEvent } from "@workspace/ai-feedback/provider"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createLearnerContentService,
  createLearnerCursorCodec,
  createProgressService,
  type LearnerContentService,
  type LearnerCursorCodec,
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
import { createDrizzleLearnerReadModelRepository } from "@/adapters/learning/learner-read-model-drizzle.repository"
import { createDrizzleProfileReader } from "@/adapters/learning/learner-read-models"
import { createDrizzleLearnerTransitionRepository } from "@/adapters/learning/learner-transition-drizzle.repository"
import { composeAiFeedbackModule } from "@/composition/ai-feedback-module.composition"

export type CreateLearnerApiCoreInput = {
  readonly aiFeedbackProvider?: AiFeedbackProvider
  readonly aiFeedbackModel: string
  readonly aiFeedbackApiKey?: string
  readonly apiOrigin: string
  readonly cursorSigningSecret: string
  readonly database: WritingAppDatabase
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly learnerAuthSecret: string
  readonly learnerCookieDomain?: string
  readonly identity: IdentityModule
  readonly onAiFeedbackAttemptTransition?: (
    event: AiFeedbackAttemptTransition
  ) => void
  readonly onAiFeedbackUsage?: (event: OpenAiUsageEvent) => void
  readonly sqlite: Database
  readonly testAuthEnabled?: boolean
  readonly webOrigin: string
}

export type LearnerApiCore = {
  readonly aiFeedbackRoutes: AiFeedbackHttpRouteGroup
  readonly authHandler: (request: Request) => Promise<Response>
  readonly contentService: LearnerContentService
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
    aiFeedbackApiKey,
    aiFeedbackModel,
    aiFeedbackProvider,
    apiOrigin,
    cursorSigningSecret,
    database,
    googleClientId,
    googleClientSecret,
    learnerAuthSecret,
    learnerCookieDomain,
    onAiFeedbackAttemptTransition,
    onAiFeedbackUsage,
    sqlite,
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
  const aiFeedback = composeAiFeedbackModule({
    apiKey: aiFeedbackApiKey,
    database,
    learnerTransitionRepository,
    model: aiFeedbackModel,
    onAttemptTransition: onAiFeedbackAttemptTransition,
    onUsage: onAiFeedbackUsage,
    provider: aiFeedbackProvider,
    sessionResolver,
    sqlite,
  })

  return {
    aiFeedbackRoutes: aiFeedback.routes,
    authHandler: auth.authHandler,
    contentService: createLearnerContentService({
      readModelRepository: learnerReadModelRepository,
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
