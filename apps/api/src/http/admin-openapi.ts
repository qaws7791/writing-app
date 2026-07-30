import type { OpenAPIHono } from "@hono/zod-openapi"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { ErrorResponseSchema } from "@workspace/http-platform/errors"
import { jsonResponse, z } from "@workspace/http-platform/openapi"

import type { AdminHonoEnv } from "@/http/admin-hono-env"
import type { OpenApiDocument } from "@/http/openapi-document"

const adminOpenApiDocumentConfig = {
  info: {
    title: "Writing App Admin API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
  servers: [{ description: "Admin API", url: "/" }],
} as const

export const adminRoutePrefix = "/api/admin" as const

const adminSessionCookieSecurityScheme = {
  in: "cookie",
  name: adminSessionCookieName,
  type: "apiKey",
} as const

export const adminHealthResponseSchema = z.strictObject({
  ok: z.boolean(),
  service: z.literal("api"),
})

export const adminReadinessResponseSchema = z.strictObject({
  checks: z.strictObject({ database: z.enum(["ready", "unavailable"]) }),
  impact: z.enum(["database-dependent-requests-unavailable", "none"]),
  ok: z.boolean(),
  service: z.literal("api"),
})

export { jsonResponse } from "@workspace/http-platform/openapi"

function errorJsonResponse(description: string) {
  return jsonResponse(description, ErrorResponseSchema)
}

export function adminAuthenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: errorJsonResponse("관리자 인증이 필요합니다."),
    403: errorJsonResponse("소유자 권한이 필요합니다."),
  }
}

export function createAdminOpenApiDocument(
  app: OpenAPIHono<AdminHonoEnv>
): AdminOpenApiDocument {
  const document = app.getOpenAPI31Document({
    ...adminOpenApiDocumentConfig,
    servers: [...adminOpenApiDocumentConfig.servers],
  })

  return {
    ...document,
    components: {
      ...document.components,
      securitySchemes: {
        ...document.components?.securitySchemes,
        adminSessionCookie: adminSessionCookieSecurityScheme,
      },
    },
    openapi: adminOpenApiDocumentConfig.openapi,
    paths: Object.fromEntries(
      Object.entries(document.paths ?? {}).map(([path, item]) => [
        `${adminRoutePrefix}${path}`,
        item,
      ])
    ),
    servers: [...adminOpenApiDocumentConfig.servers],
  }
}

export type AdminOpenApiDocument = OpenApiDocument<{
  readonly adminSessionCookie: typeof adminSessionCookieSecurityScheme
}>
