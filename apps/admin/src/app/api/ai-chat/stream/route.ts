import { buildAdminApiUrl, readAdminApiBaseUrl } from "@/runtime-config"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { adminSessionCookieName } from "@/lib/auth/admin-session-token"

export async function POST(request: Request): Promise<Response> {
  const token = await getServerAdminSessionToken()

  if (token === null) {
    return Response.json(
      {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
      { status: 401 }
    )
  }

  const response = await fetch(
    buildAdminApiUrl(readAdminApiBaseUrl(), "/ai-chat/messages/stream"),
    {
      body: await request.text(),
      headers: {
        "Content-Type": "application/json",
        Cookie: `${adminSessionCookieName}=${encodeURIComponent(token)}`,
      },
      method: "POST",
    }
  )

  return new Response(response.body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type":
        response.headers.get("Content-Type") ??
        "text/event-stream; charset=utf-8",
    },
    status: response.status,
  })
}
