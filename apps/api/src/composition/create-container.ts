import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  createAdminAuthRuntime,
  type AdminAuthRuntime,
} from "@workspace/auth/admin/server"
import type { AuthEmailDeliveryPort } from "@workspace/auth/email/delivery"
import {
  createInMemoryAuthEmailDelivery,
  type InMemoryAuthEmailDeliveryRecord,
} from "@workspace/auth/email/in-memory"
import { createResendAuthEmailDelivery } from "@workspace/auth/email/resend"
import {
  createLearnerAuthRuntime,
  type LearnerAuthIdentity,
  type LearnerAuthIdentityResolver,
  type LearnerAuthRuntime,
} from "@workspace/auth/learner/server"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { ContentModule } from "@workspace/content/module"
import type { ContentAssetStoragePort } from "@workspace/content/ports"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { IdentityModule } from "@workspace/identity/module"
import type {
  AdminSessionResolver,
  SessionResolver,
} from "@workspace/identity/ports"
import type { LearningModule } from "@workspace/learning/module"
import type { LearningLearnerSessionPort } from "@workspace/learning/http"
import {
  createAppLogger,
  type AppLogger,
} from "@workspace/observability/logger"
import { createRequestLogger } from "@workspace/observability/request-logger"
import { createSecurityAuditLogger } from "@workspace/observability/security-audit-logger"
import type { OperationsModule } from "@workspace/operations/module"
import type { WritingModule } from "@workspace/writing/module"
import type { WritingLearnerSessionPort } from "@workspace/writing/http"
import type {
  ContentAssetId,
  CourseId,
  WritingCheckId,
  WritingId,
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"
import { createS3PrivateObjectStorage } from "@workspace/storage/private-object-storage"

import {
  createAdminAuthDatabase,
  createLearnerAuthDatabase,
} from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { composeContentModule } from "@/composition/content-module.composition"
import {
  createContainerCleanupCoordinator,
  type ContainerCleanupFailure,
} from "@/composition/container-cleanup"
import { composeIdentityModule } from "@/composition/identity-module.composition"
import { composeLearningModule } from "@/composition/learning-module.composition"
import { composeOperationsModule } from "@/composition/operations-module.composition"
import { composeWritingModule } from "@/composition/writing-module.composition"
import type { ApiEnv } from "@/config/env"
import { runApplicationMigrations } from "@/db/migrate"
import { createApiHealthProbe, type ApiHealthProbe } from "@/runtime/api-health"
import { systemClock } from "@/runtime/system-clock"
import { createAdminMcpAccessTokenStore } from "@/mcp/admin/admin-mcp-access-token-store"
import { createAdminMcpAuthentication } from "@/mcp/admin/admin-mcp-auth"
import {
  createAdminMcpRuntime,
  type AdminMcpRuntime,
} from "@/mcp/admin/admin-mcp-runtime"
import {
  createPrefixedIdGenerator,
  uuidGenerator,
} from "@/runtime/uuid-generator"
import {
  createInMemoryDeletionMarkerStore,
  createS3DeletionMarkerStore,
} from "@/adapters/identity/deletion-marker-store"

const defaultLocalAuthMailboxPath = fileURLToPath(
  new URL("../../../../data/local-auth-email.json", import.meta.url)
)

export type ApiContainer = Readonly<{
  admin: Readonly<{
    authHandler: AdminAuthRuntime["authHandler"]
    mcp: AdminMcpRuntime | undefined
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
  authEmailDelivery?: AuthEmailDeliveryPort
  clock?: Clock
  contentAssetStorage?: ContentAssetStoragePort
  idGenerator?: IdGenerator<string>
  localAuthMailboxPath?: string
}>

export async function createContainer(
  env: ApiEnv,
  options: CreateContainerOptions = {}
): Promise<ApiContainer> {
  let logger: AppLogger | undefined
  const cleanup = createContainerCleanupCoordinator({
    onFailure: (failure) => reportCleanupFailure(failure, logger),
  })

  try {
    logger = createAppLogger({ level: env.logLevel, pretty: env.logPretty })
    const flushLogger = onceAsync(() => flushAppLogger(logger as AppLogger))
    cleanup.register("logger", flushLogger)

    const databaseUrl = env.databaseUrl ?? getDefaultDatabaseUrl()
    const database = createWritingAppDatabase(databaseUrl)
    const closeDatabase = onceAsync(database.close)
    cleanup.register("database", closeDatabase)
    runApplicationMigrations(database.sqlite)
    const reportingDatabase = createReadOnlyWritingAppDatabase(databaseUrl)
    cleanup.register("reporting-database", onceAsync(reportingDatabase.close))

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
      assetStore: env.adminAssetStore,
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
      clock,
      database: database.db,
      deletedLearnerRetentionDays: env.deletedLearnerRetentionDays,
      deletionMarkerStore: createDeletionMarkerStore({
        configuration: env.deletionMarkerStore,
        idGenerator,
      }),
      learningReport: learning.reportingQuery,
    })
    identityReference.bind(identity)
    const learnerAuth = createLearnerAuthRuntime({
      database: createLearnerAuthDatabase(database.db),
      emailDelivery:
        options.authEmailDelivery ??
        createAuthEmailDelivery(
          env,
          options.localAuthMailboxPath ?? defaultLocalAuthMailboxPath
        ),
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
    const operations = composeOperationsModule({
      clock,
      database: database.db,
      idGenerator,
      logger,
      reportingDatabase: reportingDatabase.sqlite,
    })
    const writing = composeWritingModule({
      checkIdGenerator: createPrefixedIdGenerator<WritingCheckId>(
        "writing-check-",
        idGenerator
      ),
      clock,
      dailySuccessfulCheckLimit: env.writingDailySuccessfulCheckLimit,
      database: database.db,
      idGenerator: createPrefixedIdGenerator<WritingId>(
        "writing-",
        idGenerator
      ),
      openAi: env.openAi,
      publicationIdGenerator:
        createPrefixedIdGenerator<WritingTaskPublicationId>(
          "writing-pub-",
          idGenerator
        ),
      taskIdGenerator: createPrefixedIdGenerator<WritingTaskId>(
        "writing-task-",
        idGenerator
      ),
    })

    let adminMcp: AdminMcpRuntime | undefined
    if (env.adminMcp !== undefined) {
      const adminMcpConfiguration = env.adminMcp
      const authentication = createAdminMcpAuthentication({
        accessTokenStore: createAdminMcpAccessTokenStore(database.db),
        configuration: adminMcpConfiguration,
        now: clock.now,
      })
      adminMcp = createAdminMcpRuntime({
        authentication,
        configuration: adminMcpConfiguration,
        reportProtocolError() {
          logger?.error(
            { errorClass: "protocol-error" },
            "admin.mcp.protocol_failed"
          )
        },
        requestLogger: createRequestLogger(logger),
        securityAuditLogger: createSecurityAuditLogger(logger),
        tools: {
          adminMcpApprovals: operations.adminMcpApprovals,
          auditTrail: operations.auditTrail,
          content: content.application,
          identity,
          now: clock.now,
          reportUnexpectedError(event) {
            logger?.error(event, "admin.mcp.tool_failed")
          },
          reporting: operations.reporting,
        },
      })
    }
    if (adminMcp !== undefined) {
      cleanup.register("admin-mcp", onceAsync(adminMcp.close))
    }

    const learnerSession = createLearningLearnerSessionPort(
      learnerSessionResolver
    )
    const health = createApiHealthProbe(database.sqlite)

    return {
      admin: {
        authHandler: adminAuth.authHandler,
        mcp: adminMcp,
        sessionResolver: adminSessionResolver,
      },
      dispose: () => disposeContainer(cleanup.dispose),
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
  } catch (cause) {
    await cleanup.dispose()
    throw cause
  }
}

function createDeletionMarkerStore(input: {
  readonly configuration: ApiEnv["deletionMarkerStore"]
  readonly idGenerator: IdGenerator<string>
}) {
  if (input.configuration === undefined) {
    return createInMemoryDeletionMarkerStore()
  }

  const objectStorage = createS3PrivateObjectStorage(input.configuration)
  if (objectStorage.isErr()) {
    throw new Error("private 삭제 marker 저장소 설정이 올바르지 않습니다.")
  }
  return createS3DeletionMarkerStore({
    idGenerator: input.idGenerator,
    objectStorage: objectStorage.value,
    prefix: input.configuration.prefix,
  })
}

function createAuthEmailDelivery(
  environment: Pick<ApiEnv, "authEmail" | "nodeEnv">,
  localAuthMailboxPath: string
): AuthEmailDeliveryPort {
  return environment.authEmail.kind === "resend"
    ? createResendAuthEmailDelivery({
        apiKey: environment.authEmail.apiKey,
        from: environment.authEmail.from,
        replyTo: environment.authEmail.replyTo,
      })
    : createInMemoryAuthEmailDelivery({
        onDelivery:
          environment.nodeEnv === "development"
            ? (delivery) =>
                writeLocalAuthMailbox(delivery, localAuthMailboxPath)
            : undefined,
      })
}

function writeLocalAuthMailbox(
  delivery: InMemoryAuthEmailDeliveryRecord,
  mailboxPath: string
): void {
  mkdirSync(path.dirname(mailboxPath), { recursive: true })
  writeFileSync(
    mailboxPath,
    `${JSON.stringify({ callbackUrl: delivery.callbackUrl, kind: delivery.kind }, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 }
  )
  process.stdout.write(`[local auth] 인증 메일 파일: ${mailboxPath}\n`)
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

function onceAsync(operation: () => Promise<void> | void): () => Promise<void> {
  let promise: Promise<void> | undefined
  return () => {
    promise ??= Promise.resolve().then(operation)
    return promise
  }
}

function flushAppLogger(logger: AppLogger): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.flush((error) => {
      if (error === undefined) resolve()
      else reject(error)
    })
  })
}

async function disposeContainer(
  dispose: () => Promise<readonly ContainerCleanupFailure[]>
): Promise<void> {
  const failures = await dispose()
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.cause),
      "API container resource 정리에 실패했습니다."
    )
  }
}

function reportCleanupFailure(
  failure: ContainerCleanupFailure,
  logger: AppLogger | undefined
): void {
  try {
    logger?.error(
      { error: failure.cause, resource: failure.name },
      "server.container.cleanup_failed"
    )
  } catch {
    // 정리 오류 보고 실패가 원래 초기화 오류를 가리지 않게 한다.
  }
}
