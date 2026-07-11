import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@/auth/admin-session"

export type AuthorizedResourceWebSocket =
  | {
      readonly actorId: string
      readonly kind: "ok"
      readonly sessionExpiresAt: Date
    }
  | {
      readonly kind: "error"
      readonly reason: ResourceWebSocketAuthorizationRejectionReason
      readonly response: Response
    }

export type ResourceWebSocketAuthorizationRejectionReason =
  | "invalid-method"
  | "origin-mismatch"
  | "query-not-allowed"
  | "session-expired"
  | "session-missing"
  | "upgrade-missing"

export async function authorizeResourceWebSocket(input: {
  readonly adminOrigin: string
  readonly now?: () => Date
  readonly request: Request
  readonly sessionResolver: AdminSessionResolver
}): Promise<AuthorizedResourceWebSocket> {
  if (input.request.method !== "GET") {
    return {
      kind: "error",
      reason: "invalid-method",
      response: new Response("GET 요청만 허용됩니다.", { status: 405 }),
    }
  }

  if (new URL(input.request.url).search !== "") {
    return {
      kind: "error",
      reason: "query-not-allowed",
      response: new Response("WebSocket URL에 query를 사용할 수 없습니다.", {
        status: 400,
      }),
    }
  }

  if (input.request.headers.get("origin") !== input.adminOrigin) {
    return {
      kind: "error",
      reason: "origin-mismatch",
      response: new Response("허용되지 않은 WebSocket Origin입니다.", {
        status: 403,
      }),
    }
  }

  if (input.request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return {
      kind: "error",
      reason: "upgrade-missing",
      response: new Response("WebSocket upgrade가 필요합니다.", {
        status: 426,
      }),
    }
  }

  const session = await input.sessionResolver.resolveSession(
    input.request.headers
  )

  if (session === null) {
    return {
      kind: "error",
      reason: "session-missing",
      response: new Response("관리자 인증이 필요합니다.", { status: 401 }),
    }
  }

  if (
    session[adminSessionExpiresAt].getTime() <=
    (input.now?.() ?? new Date()).getTime()
  ) {
    return {
      kind: "error",
      reason: "session-expired",
      response: new Response("관리자 세션이 만료되었습니다.", { status: 401 }),
    }
  }

  return {
    actorId: session.admin.id,
    kind: "ok",
    sessionExpiresAt: session[adminSessionExpiresAt],
  }
}
