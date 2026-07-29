import type { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import type { ApiHonoEnv } from "@/middleware/hono-env"
import type { OpenApiDocument } from "@/http/openapi-document"

const openApiDocumentConfig = {
  info: {
    title: "Writing App API",
    version: "0.0.1",
  },
  openapi: "3.1.0",
  servers: [{ description: "Learner API", url: "/api" }],
} as const

const learnerSessionCookieSecurityScheme = {
  in: "cookie",
  name: learnerSessionCookieName,
  type: "apiKey",
} as const

export function createOpenApiDocument(
  app: OpenAPIHono<ApiHonoEnv>
): ApiOpenApiDocument {
  const document = app.getOpenAPI31Document({
    ...openApiDocumentConfig,
    servers: [...openApiDocumentConfig.servers],
  })

  return {
    ...document,
    components: {
      ...document.components,
      securitySchemes: {
        ...document.components?.securitySchemes,
        learnerSessionCookie: learnerSessionCookieSecurityScheme,
      },
    },
    openapi: openApiDocumentConfig.openapi,
    paths: document.paths ?? {},
    servers: [...openApiDocumentConfig.servers],
  }
}

export type ApiOpenApiDocument = OpenApiDocument<{
  readonly learnerSessionCookie: typeof learnerSessionCookieSecurityScheme
}>

export function registerLearnerApiDocumentation(
  app: OpenAPIHono<ApiHonoEnv>,
  options: Readonly<{ enabled: boolean }>
): void {
  if (!options.enabled) return

  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))
  app.get(
    "/docs",
    Scalar({
      pageTitle: "Writing App Learner API",
      spec: { url: "/api/openapi" },
    })
  )
}
