import type {
  Env,
  ErrorHandler,
  MiddlewareHandler,
  NotFoundHandler,
} from "hono"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ValidationError } from "@workspace/core"

// ── Types ──

type PathMiddleware<TEnv extends Env> = {
  handler: MiddlewareHandler<TEnv>
  path: string
}

type MiddlewareConfig<TEnv extends Env> =
  | MiddlewareHandler<TEnv>
  | PathMiddleware<TEnv>

type OpenAPIDocumentConfig = {
  description?: string
  servers?: Array<{ description?: string; url: string }>
  title: string
  version: string
}

type CreateAppOptions<TEnv extends Env> = {
  errorHandler?: ErrorHandler<TEnv>
  globalMiddleware?: MiddlewareConfig<TEnv>[]
  notFound?: NotFoundHandler<TEnv>
  openapi?: OpenAPIDocumentConfig
  routes?: OpenAPIHono<TEnv>[]
}

// ── Helpers ──

function isPathMiddleware<TEnv extends Env>(
  entry: MiddlewareConfig<TEnv>
): entry is PathMiddleware<TEnv> {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "handler" in entry &&
    "path" in entry
  )
}

// ── Factory ──

/**
 * OpenAPIHono 앱을 선언적으로 초기화하는 팩토리 함수.
 *
 * @example
 * ```ts
 * const app = createApp<AppEnv>({
 *   globalMiddleware: [
 *     cors(),
 *     { path: "/api/*", handler: logger() },
 *   ],
 *   routes: [getHealth, getSession],
 *   errorHandler: (error, c) => c.json({ error: error.message }, 500),
 *   notFound: (c) => c.json({ error: "not found" }, 404),
 *   openapi: { title: "My API", version: "1.0.0" },
 * })
 * ```
 */
export function createApp<TEnv extends Env = Env>(
  options: CreateAppOptions<TEnv> = {} as CreateAppOptions<TEnv>
): OpenAPIHono<TEnv> {
  const {
    errorHandler,
    globalMiddleware = [],
    notFound,
    openapi,
    routes = [],
  } = options

  const app = new OpenAPIHono<TEnv>({
    defaultHook: (result) => {
      if (result.success) return
      const details = result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map(String).join("."),
      }))
      throw new ValidationError("유효하지 않은 요청입니다.", details)
    },
  })

  for (const entry of globalMiddleware) {
    if (isPathMiddleware(entry)) {
      app.use(entry.path, entry.handler)
    } else {
      app.use("*", entry)
    }
  }

  if (errorHandler) {
    app.onError(errorHandler)
  }

  for (const route of routes) {
    app.route("/", route)
  }

  if (notFound) {
    app.notFound(notFound)
  }

  if (openapi) {
    const documentConfig = {
      info: {
        ...(openapi.description && { description: openapi.description }),
        title: openapi.title,
        version: openapi.version,
      },
      openapi: "3.0.0" as const,
      ...(openapi.servers?.length && { servers: openapi.servers }),
    }

    app.get("/openapi.json", (c) => {
      return c.json(app.getOpenAPIDocument(documentConfig))
    })
  }

  return app
}

export type { CreateAppOptions, MiddlewareConfig, OpenAPIDocumentConfig }
