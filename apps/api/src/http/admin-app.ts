import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { createApp as createHonoApp } from "@workspace/http-platform/app"
import type { InternalErrorLogger } from "@workspace/http-platform/errors"
import { createApiErrorResponseMiddleware } from "@workspace/http-platform/errors"
import {
  createRequestBodyLimitMiddleware,
  createTrustedOriginMiddleware,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import type { AdminHonoEnv } from "@/http/admin-hono-env"
import { createAdminOpenApiDocument } from "@/http/admin-openapi"
import {
  createRequestLoggingMiddleware,
  type RequestLoggingRuntime,
} from "@workspace/http-platform/app"
import { createSecurityAuditRequestObserver } from "@/observability/security-audit-request-observer"
import type { RequestLogger } from "@workspace/observability/request-logger"
import type { SecurityAuditLogger } from "@workspace/observability/security-audit-logger"

export type AdminAppDependencies = {
  readonly adminOrigin?: string
  readonly auditMiddleware?: MiddlewareHandler<AdminHonoEnv>
  readonly errorLogger?: InternalErrorLogger
  readonly requestLogger?: RequestLogger
  readonly requestLoggingRuntime?: RequestLoggingRuntime
  readonly securityAuditLogger?: SecurityAuditLogger
}

export function createAdminApp(
  dependencies: AdminAppDependencies
): OpenAPIHono<AdminHonoEnv> {
  return createHonoApp<AdminHonoEnv>({
    errorLogger: dependencies.errorLogger,
    middleware: createAdminMiddleware(dependencies),
  })
}

export function registerAdminAuthRoutes(
  app: OpenAPIHono<AdminHonoEnv>,
  authHandler: ((request: Request) => Promise<Response>) | undefined
): void {
  if (authHandler === undefined) return

  app.on(["GET", "POST"], "/auth/*", async (context) => {
    const request = await enforcePasswordChangeSessionRevocation(
      context.req.raw
    )
    return authHandler(request).then(withPrivateNoStore)
  })
}

export function registerAdminApiDocumentation(
  app: OpenAPIHono<AdminHonoEnv>,
  options: Readonly<{ enabled: boolean }>
): void {
  if (!options.enabled) return

  app.get("/openapi", (context) =>
    context.json(createAdminOpenApiDocument(app))
  )
  app.get(
    "/docs",
    Scalar({
      pageTitle: "Writing App Admin API",
      spec: { url: "/api/admin/openapi" },
    })
  )
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

  middleware.push(
    createRequestLoggingMiddleware({
      audience: "admin",
      createRequestId: dependencies.requestLoggingRuntime?.createRequestId,
      logRequest: dependencies.requestLogger ?? ignoreRequestLog,
      observeRequest: createSecurityAuditRequestObserver(
        dependencies.securityAuditLogger
      ),
      readMonotonicTimeMs:
        dependencies.requestLoggingRuntime?.readMonotonicTimeMs,
    }),
    createApiErrorResponseMiddleware({
      exclude: isAdminHealthPath,
    })
  )

  const adminOrigin =
    dependencies.adminOrigin ?? localRuntimeDefaults.adminWebOrigin

  middleware.push(
    createRequestBodyLimitMiddleware({ maxSize: 6 * 1024 * 1024 }),
    createTrustedOriginMiddleware({ trustedOrigin: adminOrigin })
  )

  if (dependencies.auditMiddleware !== undefined) {
    middleware.push(dependencies.auditMiddleware)
  }

  return middleware
}

function ignoreRequestLog(): void {}

function isAdminHealthPath(path: string): boolean {
  return path === "/health" || path === "/api/admin/health"
}
