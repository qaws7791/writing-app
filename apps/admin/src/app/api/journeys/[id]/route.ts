import { NextResponse } from "next/server"

import {
  journeyIdParamSchema,
  updateJourneyBodySchema,
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

  const { getJourneyFull } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await getJourneyFull(parseJourneyId(parsedJourneyId))
  )
})

export const PUT = withAdminAuth(async (req, context) => {
  const { id } = await context.params
  const parsedJourneyId = parseAdminRouteParam(id, journeyIdParamSchema)
  if (parsedJourneyId instanceof NextResponse) {
    return parsedJourneyId
  }

  const parsed = await parseAdminJsonBody(req, updateJourneyBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { updateJourney } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await updateJourney(parseJourneyId(parsedJourneyId), parsed)
  )
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedJourneyId = parseAdminRouteParam(id, journeyIdParamSchema)
  if (parsedJourneyId instanceof NextResponse) {
    return parsedJourneyId
  }

  const { deleteJourney } = getAdminRuntime().useCases
  await deleteJourney(parseJourneyId(parsedJourneyId))
  return NextResponse.json({ ok: true })
})
