import type { OpenAPIHono } from "@hono/zod-openapi"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { learnerApiErrorSchema } from "@workspace/contracts/learning"
import { z } from "@workspace/hono/zod"

export const openApiDocumentConfig = {
  info: {
    title: "Writing App API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
} as const

export const learnerSessionCookieSecurityScheme = {
  in: "cookie",
  name: learnerSessionCookieName,
  type: "apiKey",
} as const

export type ApiOpenApiDocument = {
  readonly components: {
    readonly securitySchemes: {
      readonly learnerSessionCookie: typeof learnerSessionCookieSecurityScheme
    }
  }
  readonly info: {
    readonly title: string
    readonly version: string
  }
  readonly openapi: string
  readonly paths?: unknown
}

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

export function authenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: jsonResponse("인증이 필요합니다.", learnerApiErrorSchema),
    403: jsonResponse("계정을 사용할 수 없습니다.", learnerApiErrorSchema),
  }
}

export function createOpenApiDocument(app: OpenAPIHono): ApiOpenApiDocument {
  const document = app.getOpenAPI31Document(openApiDocumentConfig)

  return {
    ...document,
    components: {
      ...document.components,
      securitySchemes: {
        ...document.components?.securitySchemes,
        learnerSessionCookie: learnerSessionCookieSecurityScheme,
      },
    },
  }
}
