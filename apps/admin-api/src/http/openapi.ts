import type { OpenAPIHono } from "@hono/zod-openapi"
import { ErrorResponseSchema } from "@workspace/hono/errors"
import { z } from "@workspace/hono/zod"

export const openApiDocumentConfig = {
  info: {
    title: "Writing App Admin API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
} as const

export const adminSessionCookieSecurityScheme = {
  in: "cookie",
  name: "writing-app-admin.session_token",
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

export function adminAuthenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: jsonResponse("관리자 인증이 필요합니다.", ErrorResponseSchema),
    403: jsonResponse("소유자 권한이 필요합니다.", ErrorResponseSchema),
  }
}

export function createOpenApiDocument(
  app: OpenAPIHono
): AdminApiOpenApiDocument {
  const document = app.getOpenAPI31Document(openApiDocumentConfig)

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
