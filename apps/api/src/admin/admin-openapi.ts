import type { OpenAPIHono } from "@hono/zod-openapi"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { ErrorResponseSchema } from "@workspace/http-platform/errors"
import {
  eventStreamResponse,
  jsonResponse,
  markdownResponse,
} from "@workspace/http-platform/openapi"
import { z } from "@workspace/http-platform/zod"

import type { AdminHonoEnv } from "@/admin/admin-hono-env"

const adminOpenApiDocumentConfig = {
  info: {
    title: "Writing App Admin API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
} as const

export const adminRoutePrefix = "/api/admin" as const

const adminSessionCookieSecurityScheme = {
  in: "cookie",
  name: adminSessionCookieName,
  type: "apiKey",
} as const

export type AdminOpenApiDocument = {
  readonly components: {
    readonly securitySchemes: {
      readonly adminSessionCookie: typeof adminSessionCookieSecurityScheme
    }
  }
  readonly info: {
    readonly title: string
    readonly version: string
  }
  readonly openapi: string
  readonly paths?: unknown
}

export const adminHealthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.literal("api"),
})

export const adminReadinessResponseSchema = z.object({
  checks: z.object({ database: z.enum(["ready", "unavailable"]) }),
  impact: z.enum(["database-dependent-requests-unavailable", "none"]),
  ok: z.boolean(),
  service: z.literal("api"),
})

export {
  eventStreamResponse,
  jsonResponse,
  markdownResponse,
} from "@workspace/http-platform/openapi"

function errorJsonResponse(description: string) {
  return jsonResponse(description, ErrorResponseSchema)
}

export function adminAuthenticatedResponses(
  successResponse:
    | ReturnType<typeof eventStreamResponse>
    | ReturnType<typeof jsonResponse>
    | ReturnType<typeof markdownResponse>
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
  const document = app.getOpenAPI31Document(adminOpenApiDocumentConfig)

  return {
    ...document,
    components: {
      ...document.components,
      securitySchemes: {
        ...document.components?.securitySchemes,
        adminSessionCookie: adminSessionCookieSecurityScheme,
      },
    },
    paths: Object.fromEntries(
      Object.entries(document.paths ?? {}).map(([path, item]) => [
        `${adminRoutePrefix}${path}`,
        item,
      ])
    ),
  }
}
