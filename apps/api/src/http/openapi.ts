import type { OpenAPIHono } from "@hono/zod-openapi"
import { learnerAccountStatusSchema } from "@workspace/contracts/status"
import { ErrorResponseSchema } from "@workspace/hono/errors"
import { z } from "@workspace/hono/zod"

export const openApiDocumentConfig = {
  info: {
    title: "Writing App API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
} as const

export const bearerAuthSecurityScheme = {
  scheme: "bearer",
  type: "http",
} as const

export type ApiOpenApiDocument = {
  readonly components: {
    readonly securitySchemes: {
      readonly bearerAuth: typeof bearerAuthSecurityScheme
    }
  }
  readonly info: {
    readonly title: string
    readonly version: string
  }
  readonly openapi: string
  readonly paths?: unknown
}

export const learnerUserSchema = z.object({
  email: z.string(),
  id: z.string(),
  image: z.string().nullable(),
  joinedAt: z.string().datetime(),
  name: z.string(),
  status: learnerAccountStatusSchema,
})

export const savedResponseSchema = z.object({
  saved: z.boolean(),
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

export function authenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: jsonResponse("인증이 필요합니다.", ErrorResponseSchema),
    403: jsonResponse("계정을 사용할 수 없습니다.", ErrorResponseSchema),
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
        bearerAuth: bearerAuthSecurityScheme,
      },
    },
  }
}
