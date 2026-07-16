import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { createApp as createHonoApp } from "@workspace/hono/core"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
} from "@workspace/hono/security"
import { createRequestLoggingMiddleware } from "@workspace/logger"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  type ApiDependencies,
  type ApiRequestContext,
} from "@/context/create-request-context"
import { createCorsMiddleware } from "@/middleware/cors.middleware"
import { createRequestContextMiddleware } from "@/middleware/request-context.middleware"
import { registerApiBootstrapRoutes, routes } from "@/routes"
import {
  createLearnerErrorHandler,
  createLearnerErrorResponseMiddleware,
} from "@/http/learner-error-response"

export type { ApiDependencies, ApiRequestContext }
export { createOpenApiDocument } from "@/http/openapi"
export type { ApiOpenApiDocument } from "@/http/openapi"

export function createApp(dependencies: ApiDependencies): OpenAPIHono {
  const app = createHonoApp({
    errorLogger: dependencies.errorLogger,
    middleware: createMiddleware(dependencies),
    routes,
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
      createRequestId: dependencies.requestLoggingRuntime?.createRequestId,
      logRequest: dependencies.requestLogger ?? ignoreRequestLog,
      logSecurityAudit: dependencies.securityAuditLogger,
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
