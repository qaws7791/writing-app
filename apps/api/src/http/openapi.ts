import type { OpenAPIHono } from "@hono/zod-openapi"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

const openApiDocumentConfig = {
  info: {
    title: "Writing App API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
} as const

const learnerSessionCookieSecurityScheme = {
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

export { jsonResponse } from "@workspace/http-platform/openapi"

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
