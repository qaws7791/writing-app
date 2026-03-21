import type { HomeApiService } from "../application-services.js"
import { createApiRouter, type ApiRouter } from "../app-variables.js"
import { currentUserId } from "../http/context.js"
import { requireAuth } from "../middleware/require-auth.js"

export function createHomeRouter(homeUseCases: HomeApiService): ApiRouter {
  const router = createApiRouter()

  router.use("*", requireAuth)

  router.get("/", async (context) => {
    const userId = currentUserId(context)
    const home = await homeUseCases.getHome(userId)

    return context.json(home)
  })

  return router
}
