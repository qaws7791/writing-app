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
import { registerApiBootstrapRoutes, routes } from "@/routes"
import {
  createLearnerErrorHandler,
  createLearnerErrorResponseMiddleware,
} from "@/http/learner-error-response"
import { createRequestLoggingMiddleware } from "@workspace/http-platform/request-logging"
import { createSecurityAuditRequestObserver } from "@/observability/security-audit-request-observer"

export type { ApiDependencies }

export function createApp(dependencies: ApiDependencies): OpenAPIHono {
  const app = createHonoApp({
    errorLogger: dependencies.errorLogger,
    middleware: createMiddleware(dependencies),
    routes: [
      ...routes,
      ...dependencies.aiFeedbackRoutes,
      ...dependencies.identityRoutes,
      ...dependencies.learningRoutes,
    ],
  })

  app.onError(createLearnerErrorHandler(dependencies.errorLogger))

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
      readActor(context) {
        const session = context.get("activeSession")

        return session === undefined
          ? undefined
          : { id: session.user.id, type: "learner" }
      },
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
