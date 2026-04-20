import { NextResponse } from "next/server"

import {
  sessionIdParamSchema,
  updateSessionBodySchema,
} from "@workspace/core/modules/journeys"
import { parseSessionId } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import {
  parseAdminJsonBody,
  parseAdminRouteParam,
  toAdminResultResponse,
} from "@/lib/api/admin-route"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const parsedSessionId = parseAdminRouteParam(sessionId, sessionIdParamSchema)
  if (parsedSessionId instanceof NextResponse) {
    return parsedSessionId
  }

  const { getSessionDetail } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await getSessionDetail(parseSessionId(parsedSessionId))
  )
})

export const PUT = withAdminAuth(async (req, context) => {
  const { sessionId } = await context.params
  const parsedSessionId = parseAdminRouteParam(sessionId, sessionIdParamSchema)
  if (parsedSessionId instanceof NextResponse) {
    return parsedSessionId
  }

  const parsed = await parseAdminJsonBody(req, updateSessionBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { updateSession } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await updateSession(parseSessionId(parsedSessionId), parsed)
  )
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const parsedSessionId = parseAdminRouteParam(sessionId, sessionIdParamSchema)
  if (parsedSessionId instanceof NextResponse) {
    return parsedSessionId
  }

  const { deleteSession } = getAdminRuntime().useCases
  await deleteSession(parseSessionId(parsedSessionId))
  return NextResponse.json({ ok: true })
})
