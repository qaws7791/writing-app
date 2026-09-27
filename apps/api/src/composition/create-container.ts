import {
  createAdminAuthRuntime,
  type AdminAuthRuntime,
} from "@workspace/auth/admin/server"
import type { AuthEmailDeliveryPort } from "@workspace/auth/email/delivery"
import {
  createLearnerAuthRuntime,
  type LearnerAuthIdentity,
  type LearnerAuthIdentityResolver,
  type LearnerAuthRuntime,
} from "@workspace/auth/learner/server"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { ContentModule } from "@workspace/content/module"
import type {
  ContentAssetStoragePort,
  ContentAssetImageProcessorPort,
} from "@workspace/content/ports"
import type { WritingAppDatabaseClient } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { IdentityModule } from "@workspace/identity/module"
import type {
  LearnerDeletionMarkerStorePort,
  AdminSessionResolver,
  SessionResolver,
} from "@workspace/identity/ports"
import type { LearningModule } from "@workspace/learning/module"
import type { LearningLearnerSessionPort } from "@workspace/learning/http"
import {
  createAppLogger,
  type AppLogger,
} from "@workspace/observability/logger"
import type { OperationsModule } from "@workspace/operations/module"
import type { WritingModule } from "@workspace/writing/module"
import type { WritingCheckProvider } from "@workspace/writing/ports"
import type { WritingLearnerSessionPort } from "@workspace/writing/http"
import type {
  ContentAssetId,
  CourseId,
  WritingCheckId,
  WritingId,
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

import {
  createAdminAuthDatabase,
  createLearnerAuthDatabase,
} from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { composeContentModule } from "@/composition/content-module.composition"
import { composeIdentityModule } from "@/composition/identity-module.composition"
import { composeLearningModule } from "@/composition/learning-module.composition"
import { composeOperationsModule } from "@/composition/operations-module.composition"
import { composeWritingModule } from "@/composition/writing-module.composition"
import type { ApiEnv } from "@/config/env"
import { createApiHealthProbe, type ApiHealthProbe } from "@/runtime/api-health"
import { systemClock } from "@/runtime/system-clock"
import {
  createPrefixedIdGenerator,
  uuidGenerator,
} from "@/runtime/uuid-generator"
import { createAdminUserPage } from "@/adapters/identity/admin-user-page"

export type ApiContainer = Readonly<{
  admin: Readonly<{
    authHandler: AdminAuthRuntime["authHandler"]
    sessionResolver: AdminSessionResolver
  }>
  dispose: () => Promise<void>
  health: ApiHealthProbe
  learner: Readonly<{
    authHandler: LearnerAuthRuntime["authHandler"]
    learningSession: LearningLearnerSessionPort
    sessionResolver: SessionResolver
    writingSession: WritingLearnerSessionPort
  }>
  modules: Readonly<{
    content: ContentModule
    identity: IdentityModule
    learning: LearningModule
    operations: OperationsModule
    writing: WritingModule
  }>
  platform: Readonly<{
    clock: Clock
    env: ApiEnv
    idGenerator: IdGenerator<string>
    logger: AppLogger
  }>
}>

export type CreateContainerOptions = Readonly<{
  authEmailDelivery: AuthEmailDeliveryPort
  database: WritingAppDatabaseClient
  deletionMarkerStore: LearnerDeletionMarkerStorePort
  checkProvider: WritingCheckProvider
  imageProcessor: ContentAssetImageProcessorPort
  clock?: Clock
  contentAssetStorage: ContentAssetStoragePort
  idGenerator?: IdGenerator<string>
}>

export async function createContainer(
  env: ApiEnv,
  options: CreateContainerOptions
): Promise<ApiContainer> {
  const logger = createAppLogger({ level: env.logLevel })
  const database = options.database
  const clock = options.clock ?? systemClock
  const idGenerator = options.idGenerator ?? uuidGenerator
  const identityReference = createIdentityModuleReference()
  const adminAuth = createAdminAuthRuntime({
    database: createAdminAuthDatabase(database.db),
    secret: env.adminAuthSecret,
    sessionRevoker: createDrizzleAdminSessionRevoker(database.db),
    webOrigin: env.adminOrigin,
  })

  const courseIdGenerator = createPrefixedIdGenerator<CourseId>(
    "course-",
    idGenerator
  )
  const content = composeContentModule({
    assetIdGenerator: createPrefixedIdGenerator<ContentAssetId>(
      "content-asset-",
      idGenerator
    ),
    assetStorage: options.contentAssetStorage,
    imageProcessor: options.imageProcessor,
    clock,
    courseIdGenerator,
    database: database.db,
  })
  const learning = composeLearningModule({
    clock,
    content: content.application,
    cursorSigningSecret: env.cursorSigningSecret,
    database: database.db,
    readIdentity: identityReference.read,
  })
  const identity = composeIdentityModule({
    adminUserPage: createAdminUserPage(database.sqlite),
    clock,
    cursorSigningSecret: env.cursorSigningSecret,
    database: database.db,
    deletedLearnerRetentionDays: env.deletedLearnerRetentionDays,
    deletionMarkerStore: options.deletionMarkerStore,
    learningReport: learning.reportingQuery,
  })
  identityReference.bind(identity)
  const learnerAuth = createLearnerAuthRuntime({
    database: createLearnerAuthDatabase(database.db),
    emailDelivery: options.authEmailDelivery,
    googleClientId: env.googleClientId,
    googleClientSecret: env.googleClientSecret,
    identityProvisioner: createLearnerIdentityProvisioner(identity),
    secret: env.learnerAuthSecret,
    webOrigin: env.webOrigin,
  })
  const learnerSessionResolver = identity.createLearnerSessionResolver(
    createLearnerAuthenticationPort(learnerAuth.identityResolver)
  )
  const adminSessionResolver = identity.createAdminSessionResolver(
    adminAuth.identityResolver
  )
  const operations = await composeOperationsModule({
    clock,
    database: database.db,
    idGenerator,
    logger,
    reportingDatabase: database.sqlite,
  })
  const writing = composeWritingModule({
    checkIdGenerator: createPrefixedIdGenerator<WritingCheckId>(
      "writing-check-",
      idGenerator
    ),
    clock,
    dailySuccessfulCheckLimit: env.writingDailySuccessfulCheckLimit,
    database: database.db,
    idGenerator: createPrefixedIdGenerator<WritingId>("writing-", idGenerator),
    checkProvider: options.checkProvider,
    publicationIdGenerator: createPrefixedIdGenerator<WritingTaskPublicationId>(
      "writing-pub-",
      idGenerator
    ),
    taskIdGenerator: createPrefixedIdGenerator<WritingTaskId>(
      "writing-task-",
      idGenerator
    ),
  })

  const learnerSession = createLearningLearnerSessionPort(
    learnerSessionResolver
  )
  const health = createApiHealthProbe(database.sqlite)

  return {
    admin: {
      authHandler: adminAuth.authHandler,
      sessionResolver: adminSessionResolver,
    },
    dispose: database.close,
    health,
    learner: {
      authHandler: learnerAuth.authHandler,
      learningSession: learnerSession,
      sessionResolver: learnerSessionResolver,
      writingSession: learnerSession,
    },
    modules: {
      content,
      identity,
      learning,
      operations,
      writing,
    },
    platform: { clock, env, idGenerator, logger },
  }
}

/**
 * identity와 learning은 서로의 조회 포트를 필요로 한다. 조립 순서상 한쪽은 늦게 연결해야
 * 하므로 learning이 identity를 참조로 받고, identity 조립 직후 연결한다.
 */
function createIdentityModuleReference(): Readonly<{
  bind: (identity: IdentityModule) => void
  read: () => IdentityModule
}> {
  let identityModule: IdentityModule | undefined

  return {
    bind(identity) {
      if (identityModule !== undefined) {
        throw new Error("identity module 참조가 이미 연결됐습니다.")
      }
      identityModule = identity
    },
    read() {
      if (identityModule === undefined) {
        throw new Error("identity module 참조가 아직 연결되지 않았습니다.")
      }
      return identityModule
    },
  }
}

function createLearnerIdentityProvisioner(identity: IdentityModule): Readonly<{
  provision: (identity: LearnerAuthIdentity) => Promise<void>
}> {
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

function createLearningLearnerSessionPort(sessionResolver: SessionResolver) {
  return {
    async resolveLearner(headers: Headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      const learnerId = learnerIdSchema.parse(session.user.id)
      if (session.user.status !== "active") {
        return { kind: "inactive" as const, learnerId }
      }
      return {
        kind: "active" as const,
        learnerId,
      }
    },
  }
}
