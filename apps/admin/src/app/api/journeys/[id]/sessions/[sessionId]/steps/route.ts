import { NextResponse } from "next/server"

import {
  createStepBodySchema,
  sessionIdParamSchema,
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
    await getSessionDetail(parseSessionId(parsedSessionId)),
    {
      mapData: (session) => ({ items: session.steps }),
    }
  )
})

export const POST = withAdminAuth(async (req, context) => {
  const { sessionId } = await context.params
  const parsedSessionId = parseAdminRouteParam(sessionId, sessionIdParamSchema)
  if (parsedSessionId instanceof NextResponse) {
    return parsedSessionId
  }

  const parsed = await parseAdminJsonBody(req, createStepBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { createStep } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await createStep(parseSessionId(parsedSessionId), parsed),
    {
      status: 201,
    }
  )
})
