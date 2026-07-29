import type { OpenAPIHono } from "@hono/zod-openapi"
import { withPrivateNoStore } from "@workspace/http-platform/security"

import type { ApiHonoEnv } from "@/middleware/hono-env"

export function registerAuthProxy(
  app: OpenAPIHono<ApiHonoEnv>,
  authHandler: ((request: Request) => Promise<Response>) | undefined
): void {
  if (authHandler === undefined) {
    return
  }

  app.get("/auth/sign-in/google", (context) => {
    return redirectGoogleSignIn(context.req.raw, authHandler)
  })
  app.on(["GET", "POST"], "/auth/*", (context, next) => {
    if (context.req.path === "/auth/session") return next()
    return authHandler(context.req.raw).then(withPrivateNoStore)
  })
}

async function redirectGoogleSignIn(
  request: Request,
  authHandler: (request: Request) => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url)
  const signInUrl = new URL("/api/auth/sign-in/social", url)
  const response = await authHandler(
    new Request(signInUrl, {
      body: JSON.stringify({
        callbackURL: url.searchParams.get("callbackURL") ?? undefined,
        provider: "google",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  )

  if (!response.ok) {
    return withPrivateNoStore(response)
  }

  const body = (await response.json()) as { readonly url?: unknown }

  if (typeof body.url !== "string") {
    return withPrivateNoStore(response)
  }

  return withPrivateNoStore(Response.redirect(body.url, 302))
}
