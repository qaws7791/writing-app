import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { createApp as createHonoApp } from "@workspace/http-platform/core"
import type { InternalErrorLogger } from "@workspace/http-platform/errors"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import type { AdminSessionResolver } from "@workspace/identity/sessions"
import {
  adminHealthRoute,
  createAdminSessionRoute,
} from "@/admin/admin-foundation.routes"
import type { AdminHonoEnv } from "@/admin/admin-hono-env"
import { createAdminOpenApiDocument } from "@/admin/admin-openapi"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import {
  createRequestLoggingMiddleware,
  type RequestLoggingRuntime,
} from "@workspace/http-platform/request-logging"
import { createSecurityAuditRequestObserver } from "@/observability/security-audit-request-observer"
import type { RequestLogger } from "@workspace/observability/request-logger"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"

export type AdminAppDependencies = {
  readonly adminOrigin?: string
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly capabilityRoutes?: AdminRouteGroup
  readonly errorLogger?: InternalErrorLogger
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly securityAuditLogger?: SecurityAuditLogger
  readonly sessionResolver: AdminSessionResolver
}

export function createAdminApp(
  dependencies: AdminAppDependencies
): OpenAPIHono<AdminHonoEnv> {
  const app = createHonoApp({
    errorLogger: dependencies.errorLogger,
    middleware: createAdminMiddleware(dependencies),
    routes: [
      adminHealthRoute,
      createAdminSessionRoute(dependencies.sessionResolver),
      ...(dependencies.capabilityRoutes ?? []),
    ],
  }) as OpenAPIHono<AdminHonoEnv>

  if (dependencies.authHandler !== undefined) {
    const authHandler = dependencies.authHandler

    app.on(["GET", "POST"], "/auth/*", async (context) => {
      const request = await enforcePasswordChangeSessionRevocation(
        context.req.raw
      )

      return authHandler(request).then(withPrivateNoStore)
    })
  }

  app.get("/openapi", (context) =>
    context.json(createAdminOpenApiDocument(app))
  )

  return app
}

async function enforcePasswordChangeSessionRevocation(
  request: Request
): Promise<Request> {
  if (
    request.method !== "POST" ||
    !isAdminPasswordChangePath(new URL(request.url).pathname)
  ) {
    return request
  }

  let body: unknown
  try {
    body = await request.clone().json()
  } catch {
    return request
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return request
  }

  return new Request(request, {
    body: JSON.stringify({
      ...body,
      revokeOtherSessions: true,
    }),
  })
}

function isAdminPasswordChangePath(path: string): boolean {
  return (
    path === "/auth/change-password" ||
    path === "/api/admin/auth/change-password"
  )
}

function createAdminMiddleware(
  dependencies: AdminAppDependencies
): readonly MiddlewareHandler[] {
  const middleware: MiddlewareHandler[] = []

  if (dependencies.requestLogger !== undefined) {
    middleware.push(
      createRequestLoggingMiddleware({
        audience: "admin",
        createRequestId: dependencies.requestLoggingRuntime?.createRequestId,
        logRequest: dependencies.requestLogger,
        observeRequest: createSecurityAuditRequestObserver(
          dependencies.securityAuditLogger
        ),
        readActor(context) {
          const session = context.get("activeAdminSession")

          return session === undefined
            ? undefined
            : {
                id: session.admin.id,
                role: session.admin.role,
                type: "admin",
              }
        },
        readMonotonicTimeMs:
          dependencies.requestLoggingRuntime?.readMonotonicTimeMs,
      })
    )
  }

  const adminOrigin =
    dependencies.adminOrigin ?? localRuntimeDefaults.adminWebOrigin

  middleware.push(
    cors({
      allowHeaders: ["Authorization", "Content-Type", "If-Match"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      exposeHeaders: ["Content-Disposition", "ETag", "Retry-After"],
      origin: adminOrigin,
    }),
    createRequestBodyLimitMiddleware({ maxSize: 6 * 1024 * 1024 }),
    createTrustedOriginMiddleware({ trustedOrigin: adminOrigin })
  )

  return middleware
}
