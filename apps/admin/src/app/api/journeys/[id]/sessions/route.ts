import { NextResponse } from "next/server"

import {
  createSessionBodySchema,
  journeyIdParamSchema,
} from "@workspace/core/modules/journeys"
import { parseJourneyId } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import {
  parseAdminJsonBody,
  parseAdminRouteParam,
  toAdminResultResponse,
} from "@/lib/api/admin-route"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedJourneyId = parseAdminRouteParam(id, journeyIdParamSchema)
  if (parsedJourneyId instanceof NextResponse) {
    return parsedJourneyId
  }

  const { listSessions } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await listSessions(parseJourneyId(parsedJourneyId)),
    {
      mapData: (items) => ({ items }),
    }
  )
})

export const POST = withAdminAuth(async (req, context) => {
  const { id } = await context.params
  const parsedJourneyId = parseAdminRouteParam(id, journeyIdParamSchema)
  if (parsedJourneyId instanceof NextResponse) {
    return parsedJourneyId
  }

  const parsed = await parseAdminJsonBody(req, createSessionBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { createSession } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await createSession(parseJourneyId(parsedJourneyId), parsed),
    {
      status: 201,
    }
  )
})
