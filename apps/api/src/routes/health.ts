import { createApiRouter, type ApiRouter } from "../app-variables.js"

export function createHealthRouter(sqliteVersion: string): ApiRouter {
  const router = createApiRouter()

  router.get("/", (context) =>
    context.json({
      sqliteVersion,
      status: "ok",
    })
  )

  return router
}
