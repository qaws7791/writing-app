import {
  buildAdminApiUrl,
  readAdminApiBaseUrl,
  readAdminWebOrigin,
} from "@/runtime-config"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { adminSessionCookieName } from "@/lib/auth/admin-session-token"

export async function POST(request: Request): Promise<Response> {
  const adminWebOrigin = readAdminWebOrigin()

  if (request.headers.get("Origin") !== adminWebOrigin) {
    return Response.json(
      {
        code: "FORBIDDEN_ORIGIN",
        message: "Forbidden",
      },
      { status: 403 }
    )
  }

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

  const requestBody = await request.text()

  if (new TextEncoder().encode(requestBody).byteLength > 64 * 1024) {
    return Response.json(
      {
        code: "PAYLOAD_TOO_LARGE",
        message: "Payload Too Large",
      },
      { status: 413 }
    )
  }

  const response = await fetch(
    buildAdminApiUrl(readAdminApiBaseUrl(), "/ai-chat/messages/stream"),
    {
      body: requestBody,
      headers: {
        "Content-Type": "application/json",
        Cookie: `${adminSessionCookieName}=${encodeURIComponent(token)}`,
        Origin: adminWebOrigin,
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
