import type { SessionResolver } from "@workspace/core/auth"
import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type { LearnerContentService } from "@workspace/core/content"
import type {
  LearningService,
  ProfileReader,
  ProgressService,
} from "@workspace/core/learning"
import type {
  RequestLogger,
  RequestLoggingRuntime,
  SecurityAuditLogger,
} from "@workspace/logger"
import type { InternalErrorLogger } from "@workspace/hono/errors"

export type ApiDependencies = {
  readonly aiFeedbackService: AiFeedbackService
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly contentService: LearnerContentService
  readonly errorLogger?: InternalErrorLogger
  readonly learningService: LearningService
  readonly now?: () => Date
  readonly profileReader: ProfileReader
  readonly progressService: ProgressService
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly securityAuditLogger?: SecurityAuditLogger
  readonly sessionResolver: SessionResolver
  readonly webOrigin?: string
}

export type ApiRequestContext = Omit<ApiDependencies, "now"> & {
  readonly now: () => Date
}

export function createRequestContext(
  dependencies: ApiDependencies
): ApiRequestContext {
  return {
    ...dependencies,
    now: dependencies.now ?? (() => new Date()),
  }
}
