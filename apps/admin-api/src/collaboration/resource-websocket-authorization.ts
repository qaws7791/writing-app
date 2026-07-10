import type { AdminSessionResolver } from "@/auth/admin-session"

export type AuthorizedResourceWebSocket =
  | {
      readonly actorId: string
      readonly kind: "ok"
    }
  | {
      readonly kind: "error"
      readonly response: Response
    }

export async function authorizeResourceWebSocket(input: {
  readonly adminOrigin: string
  readonly request: Request
  readonly sessionResolver: AdminSessionResolver
}): Promise<AuthorizedResourceWebSocket> {
  if (input.request.method !== "GET") {
    return {
      kind: "error",
      response: new Response("GET 요청만 허용됩니다.", { status: 405 }),
    }
  }

  if (new URL(input.request.url).search !== "") {
    return {
      kind: "error",
      response: new Response("WebSocket URL에 query를 사용할 수 없습니다.", {
        status: 400,
      }),
    }
  }

  if (input.request.headers.get("origin") !== input.adminOrigin) {
    return {
      kind: "error",
      response: new Response("허용되지 않은 WebSocket Origin입니다.", {
        status: 403,
      }),
    }
  }

  if (input.request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return {
      kind: "error",
      response: new Response("WebSocket upgrade가 필요합니다.", {
        status: 426,
      }),
    }
  }

  const session = await input.sessionResolver.resolveSession(
    input.request.headers
  )

  return session === null
    ? {
        kind: "error",
        response: new Response("관리자 인증이 필요합니다.", { status: 401 }),
      }
    : { actorId: session.admin.id, kind: "ok" }
}
