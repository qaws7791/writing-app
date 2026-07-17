import type { OpenAPIHono } from "@hono/zod-openapi"
import { withPrivateNoStore } from "@/http/platform/security"

export function registerAuthProxy(
  app: OpenAPIHono,
  authHandler: ((request: Request) => Promise<Response>) | undefined
): void {
  if (authHandler === undefined) {
    return
  }

  app.get("/api/auth/sign-in/google", (context) => {
    return redirectGoogleSignIn(context.req.raw, authHandler)
  })
  app.on(["GET", "POST"], "/api/auth/*", (context) => {
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
