import { adminAiChatMessageRequestSchema } from "@workspace/contracts/operations/admin-ai-chat"

import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import {
  readAdminWebOrigin,
  readServerApiBaseUrl,
} from "@/server/env/admin-runtime-config"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { buildApiUrl } from "@/shared/config/api-base-url"

const maximumRequestBodyBytes = 64 * 1024

export async function handleAdminAiChatStream(
  request: Request
): Promise<Response> {
  const adminWebOrigin = readAdminWebOrigin()

  if (request.headers.get("Origin") !== adminWebOrigin) {
    return errorResponse("FORBIDDEN_ORIGIN", "Forbidden", 403)
  }

  const token = await getServerAdminSessionToken()
  if (token === null) {
    return errorResponse("UNAUTHORIZED", "Unauthorized", 401)
  }

  const requestBody = await request.text()
  if (
    new TextEncoder().encode(requestBody).byteLength > maximumRequestBodyBytes
  ) {
    return errorResponse("PAYLOAD_TOO_LARGE", "Payload Too Large", 413)
  }

  const parsedBody = parseRequestBody(requestBody)
  if (!parsedBody.success) {
    return errorResponse("INVALID_REQUEST", "Invalid Request", 400)
  }

  const response = await fetch(
    buildApiUrl(readServerApiBaseUrl(), "/api/admin/ai-chat/messages/stream"),
    {
      body: JSON.stringify(parsedBody.data),
      headers: {
        "Content-Type": "application/json",
        Cookie: `${adminSessionCookieName}=${encodeURIComponent(token)}`,
        Origin: adminWebOrigin,
        ...(request.headers.has("x-forwarded-for")
          ? {
              "X-Forwarded-For":
                request.headers.get("x-forwarded-for") ?? "unknown",
            }
          : {}),
      },
      method: "POST",
      signal: request.signal,
    }
  )

  return new Response(response.body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type":
        response.headers.get("Content-Type") ??
        "text/event-stream; charset=utf-8",
      ...(response.headers.has("Retry-After")
        ? { "Retry-After": response.headers.get("Retry-After") ?? "1" }
        : {}),
    },
    status: response.status,
  })
}

function parseRequestBody(body: string) {
  try {
    return adminAiChatMessageRequestSchema.safeParse(
      JSON.parse(body) as unknown
    )
  } catch {
    return { success: false as const }
  }
}

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ code, message }, { status })
}
