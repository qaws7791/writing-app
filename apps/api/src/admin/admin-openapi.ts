import type { OpenAPIHono } from "@hono/zod-openapi"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { ErrorResponseSchema } from "@/http/platform/errors"
import { z } from "@/http/platform/zod"

import type { AdminHonoEnv } from "@/admin/admin-hono-env"

export const adminOpenApiDocumentConfig = {
  info: {
    title: "Writing App Admin API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
} as const

export const adminSessionCookieSecurityScheme = {
  in: "cookie",
  name: adminSessionCookieName,
  type: "apiKey",
} as const

export type AdminApiOpenApiDocument = {
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
  service: z.literal("admin-api"),
})

export function jsonResponse(description: string, schema: z.ZodType) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description,
  }
}

export function eventStreamResponse(description: string) {
  return {
    content: {
      "text/event-stream": {
        schema: z.string(),
      },
    },
    description,
  }
}

export function markdownResponse(description: string) {
  return {
    content: {
      "text/markdown": {
        schema: z.string(),
      },
    },
    description,
  }
}

export function multipartRequestBody<const TSchema extends z.ZodType>(
  schema: TSchema
) {
  return {
    content: {
      "multipart/form-data": {
        schema,
      },
    },
  }
}

export function errorJsonResponse(description: string) {
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
): AdminApiOpenApiDocument {
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
  }
}
