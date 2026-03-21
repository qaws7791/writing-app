import { createApiRouter, type ApiRouter } from "../app-variables.js"

export function createAuthRouter(
  authHandler: (request: Request) => Promise<Response>
): ApiRouter {
  const router = createApiRouter()

  router.on(["GET", "POST"], "/*", (context) => authHandler(context.req.raw))

  return router
}
