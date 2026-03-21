import { createApiRouter, type ApiRouter } from "../app-variables.js"
import { UnauthorizedError } from "../http/unauthorized-error.js"

export function createSessionRouter(): ApiRouter {
  const router = createApiRouter()

  router.get("/", (context) => {
    const user = context.get("authUser")
    const session = context.get("authSession")

    if (!user || !session) {
      throw new UnauthorizedError("로그인이 필요합니다.")
    }

    return context.json({
      session,
      user,
    })
  })

  return router
}
