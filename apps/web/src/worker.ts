import type { ExecutionContext } from "@cloudflare/workers-types"
import handler from "vinext/server/fetch-handler"
export default {
  async fetch(
    request: Request,
    env: WebBindings,
    context: ExecutionContext
  ): Promise<Response> {
    const path = new URL(request.url).pathname
    if (
      (path.startsWith("/api/") && path !== "/api/csp-report") ||
      path.startsWith("/assets/content/")
    )
      return env.API.fetch(request)
    return handler.fetch(request, env, context)
  },
}
