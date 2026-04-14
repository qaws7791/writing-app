import { type NextRequest, NextResponse } from "next/server"

import {
  ADMIN_SESSION_COOKIE,
  type AdminSession,
  verifySessionToken,
} from "./session"

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
  session: AdminSession
) => Promise<NextResponse> | NextResponse

export function withAdminAuth(handler: RouteHandler) {
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
    return handler(req, context, session)
  }
}
