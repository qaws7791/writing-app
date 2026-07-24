import type { InternalErrorLogger } from "@workspace/http-platform/errors"
import type { RequestLoggingRuntime } from "@workspace/http-platform/app"
import type { RequestLogger } from "@workspace/observability/request-logger"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"
import type { HttpRequestContext } from "@workspace/http-platform/app"

import type { LearnerContractErrorLogger } from "@/http/learner-response"

export type ApiDependencies = {
  readonly contractErrorLogger?: LearnerContractErrorLogger
  readonly deploymentVersion?: string
  readonly errorLogger?: InternalErrorLogger
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly securityAuditLogger?: SecurityAuditLogger
  readonly webOrigin?: string
}

export type ApiRequestContext = HttpRequestContext<{
  readonly contractErrorLogger?: LearnerContractErrorLogger
  readonly deploymentVersion: string
}>

export function createRequestContext(
  dependencies: ApiDependencies
): ApiRequestContext {
  return {
    contractErrorLogger: dependencies.contractErrorLogger,
    deploymentVersion: dependencies.deploymentVersion ?? "local",
  }
}
