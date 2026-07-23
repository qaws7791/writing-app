import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { createApp as createHonoApp } from "@workspace/http-platform/core"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
} from "@workspace/http-platform/security"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import type { ApiDependencies } from "@/context/create-request-context"
import { createCorsMiddleware } from "@/middleware/cors.middleware"
import { createRequestContextMiddleware } from "@/middleware/request-context.middleware"
import { createApiFoundationRoutes, registerApiBootstrapRoutes } from "@/routes"
import {
  createLearnerErrorHandler,
  createLearnerErrorResponseMiddleware,
} from "@/http/learner-error-response"
import { createRequestLoggingMiddleware } from "@workspace/http-platform/request-logging"
import { createSecurityAuditRequestObserver } from "@/observability/security-audit-request-observer"

export type { ApiDependencies }

export function createLearnerApp(dependencies: ApiDependencies): OpenAPIHono {
  const app = createHonoApp({
    errorLogger: dependencies.errorLogger,
    middleware: createMiddleware(dependencies),
    routes: [
      ...createApiFoundationRoutes(dependencies),
      ...dependencies.aiFeedbackRoutes,
      ...dependencies.identityRoutes,
      ...dependencies.learningRoutes,
    ],
  })

  app.onError(
    createLearnerErrorHandler(
      dependencies.errorLogger,
      dependencies.requestLoggingRuntime?.createRequestId
    )
  )

  registerApiBootstrapRoutes(app, dependencies)

  return app
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
    createLearnerErrorResponseMiddleware()
  )

  const webOrigin =
    dependencies.webOrigin ?? localRuntimeDefaults.learnerWebOrigin

  middleware.push(
    createCorsMiddleware(dependencies),
    createRequestBodyLimitMiddleware(),
    createTrustedOriginMiddleware({ trustedOrigin: webOrigin })
  )

  return middleware
}

function ignoreRequestLog(): void {}
