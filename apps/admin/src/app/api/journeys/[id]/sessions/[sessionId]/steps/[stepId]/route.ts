import { NextResponse } from "next/server"

import {
  sessionIdParamSchema,
  stepIdParamSchema,
  updateStepBodySchema,
} from "@workspace/core/modules/journeys"
import { parseSessionId, parseStepId } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import {
  parseAdminJsonBody,
  parseAdminRouteParam,
  toAdminResultResponse,
} from "@/lib/api/admin-route"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId, stepId } = await context.params
  const parsedSessionId = parseAdminRouteParam(sessionId, sessionIdParamSchema)
  if (parsedSessionId instanceof NextResponse) {
    return parsedSessionId
  }

  const parsedStepId = parseAdminRouteParam(stepId, stepIdParamSchema)
  if (parsedStepId instanceof NextResponse) {
    return parsedStepId
  }

  const { getSessionDetail } = getAdminRuntime().useCases
  const stepIdValue = parseStepId(parsedStepId)
  return toAdminResultResponse(
    await getSessionDetail(parseSessionId(parsedSessionId)),
    {
      successResponse: (session) => {
        const step = session.steps.find((item) => item.id === stepIdValue)
        if (!step) {
          return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        return NextResponse.json(step)
      },
    }
  )
})

export const PUT = withAdminAuth(async (req, context) => {
  const { stepId } = await context.params
  const parsedStepId = parseAdminRouteParam(stepId, stepIdParamSchema)
  if (parsedStepId instanceof NextResponse) {
    return parsedStepId
  }

  const parsed = await parseAdminJsonBody(req, updateStepBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { updateStep } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await updateStep(parseStepId(parsedStepId), parsed)
  )
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { stepId } = await context.params
  const parsedStepId = parseAdminRouteParam(stepId, stepIdParamSchema)
  if (parsedStepId instanceof NextResponse) {
    return parsedStepId
  }

  const { deleteStep } = getAdminRuntime().useCases
  await deleteStep(parseStepId(parsedStepId))
  return NextResponse.json({ ok: true })
})
