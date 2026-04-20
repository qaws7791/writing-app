import { type NextRequest, NextResponse } from "next/server"
import { toHttpStatus, type DomainError } from "@workspace/core"
import { ZodError } from "zod"

import {
  ADMIN_SESSION_COOKIE,
  type AdminSession,
} from "@/lib/auth/session-token"
import { verifySessionToken } from "@/lib/auth/session"

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
  session: AdminSession
) => Promise<NextResponse> | NextResponse

function isDomainError(error: unknown): error is DomainError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  )
}

function toAdminErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.flatten() }, { status: 422 })
  }

  if (isDomainError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          field: "field" in error ? error.field : undefined,
          message: error.message,
        },
      },
      { status: toHttpStatus(error) }
    )
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "관리자 요청 처리 중 오류가 발생했습니다.",
      },
    },
    { status: 500 }
  )
}

export function withAdminHandler(
  handler: (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
    session: AdminSession
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
    session: AdminSession
  ): Promise<NextResponse> => {
    try {
      return await handler(req, context, session)
    } catch (error) {
      return toAdminErrorResponse(error)
    }
  }
}

export function withAdminAuth(handler: RouteHandler) {
  const wrappedHandler = withAdminHandler(handler)

  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const session = await verifySessionToken(token)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return wrappedHandler(req, context, session)
  }
}
