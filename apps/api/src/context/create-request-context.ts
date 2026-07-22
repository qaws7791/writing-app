import type { SessionResolver } from "@workspace/identity/sessions"
import type { AiFeedbackHttpRouteGroup } from "@workspace/ai-feedback/http"
import type {
  LearnerContentService,
  LearnerCursorCodec,
  LearnerTransitionRepository,
  ProgressService,
} from "@workspace/core/learning"
import type { InternalErrorLogger } from "@workspace/http-platform/errors"
import type { RequestLoggingRuntime } from "@workspace/http-platform/request-logging"
import type { RequestLogger } from "@workspace/observability/request-logger"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"
import type { HttpRequestContext } from "@workspace/http-platform/context"

import type { LearnerContractErrorLogger } from "@/http/learner-response"

export type ApiDependencies = {
  readonly aiFeedbackRoutes: AiFeedbackHttpRouteGroup
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly contentService: LearnerContentService
  readonly contractErrorLogger?: LearnerContractErrorLogger
  readonly deploymentVersion?: string
  readonly errorLogger?: InternalErrorLogger
  readonly learnerCursorCodec: LearnerCursorCodec
  readonly learnerTransitionRepository: Pick<
    LearnerTransitionRepository,
    "completeStep" | "startLesson"
  >
  readonly identityRoutes: readonly {
    readonly handler: unknown
    readonly route: import("@workspace/http-platform/core").AnyRouteConfig
  }[]
  readonly now?: () => Date
  readonly progressService: ProgressService
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly securityAuditLogger?: SecurityAuditLogger
  readonly sessionResolver: SessionResolver
  readonly webOrigin?: string
}

export type ApiRequestContext = HttpRequestContext<
  Omit<ApiDependencies, "now"> & {
    readonly deploymentVersion: string
    readonly now: () => Date
  }
>

export function createRequestContext(
  dependencies: ApiDependencies
): ApiRequestContext {
  return {
    ...dependencies,
    deploymentVersion: dependencies.deploymentVersion ?? "local",
    now: dependencies.now ?? (() => new Date()),
  }
}
