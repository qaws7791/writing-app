import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { createApp as createHonoApp } from "@workspace/http-platform/app"
import { createApiErrorResponseMiddleware } from "@workspace/http-platform/errors"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
} from "@workspace/http-platform/security"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import type { ApiDependencies } from "@/context/create-request-context"
import type { ApiHonoEnv } from "@/context/hono-env"
import { createRequestContextMiddleware } from "@/middleware/request-context.middleware"
import { createRequestLoggingMiddleware } from "@workspace/http-platform/app"
import { createSecurityAuditRequestObserver } from "@/observability/security-audit-request-observer"

export type { ApiDependencies }

export function createLearnerApp(
  dependencies: ApiDependencies
): OpenAPIHono<ApiHonoEnv> {
  return createHonoApp<ApiHonoEnv>({
    errorLogger: dependencies.errorLogger,
    middleware: createMiddleware(dependencies),
  })
}

function createMiddleware(
  dependencies: ApiDependencies
): readonly MiddlewareHandler[] {
  const middleware: MiddlewareHandler[] = [
    createRequestContextMiddleware(dependencies),
  ]

  middleware.push(
    createRequestLoggingMiddleware({
      audience: "learner",
      createRequestId: dependencies.requestLoggingRuntime?.createRequestId,
      logRequest: dependencies.requestLogger ?? ignoreRequestLog,
      observeRequest: createSecurityAuditRequestObserver(
        dependencies.securityAuditLogger
      ),
      readMonotonicTimeMs:
        dependencies.requestLoggingRuntime?.readMonotonicTimeMs,
    }),
    createApiErrorResponseMiddleware({
      exclude: isLearnerHealthPath,
    })
  )

  const webOrigin =
    dependencies.webOrigin ?? localRuntimeDefaults.learnerWebOrigin

  middleware.push(
    createRequestBodyLimitMiddleware(),
    createTrustedOriginMiddleware({ trustedOrigin: webOrigin })
  )

  return middleware
}

function ignoreRequestLog(): void {}

function isLearnerHealthPath(path: string): boolean {
  return path === "/health" || path === "/api/health"
}
