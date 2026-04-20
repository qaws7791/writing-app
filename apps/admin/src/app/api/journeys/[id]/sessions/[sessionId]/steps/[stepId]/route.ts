import { NextResponse } from "next/server"

import {
  parseSessionId,
  parseStepId,
  sessionIdParamSchema,
  stepIdParamSchema,
  toHttpStatus,
  updateStepBodySchema,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId, stepId } = await context.params
  const parsedSessionId = sessionIdParamSchema.safeParse(sessionId)
  const parsedStepId = stepIdParamSchema.safeParse(stepId)

  if (!parsedSessionId.success || !parsedStepId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { getSessionDetail } = getAdminRuntime().useCases
  const result = await getSessionDetail(parseSessionId(parsedSessionId.data))
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  const stepIdValue = parseStepId(parsedStepId.data)
  const step = result.value.steps.find((s) => s.id === stepIdValue)
  if (!step) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(step)
})

export const PUT = withAdminAuth(async (req, context) => {
  const { stepId } = await context.params
  const parsedStepId = stepIdParamSchema.safeParse(stepId)
  if (!parsedStepId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updateStepBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updateStep } = getAdminRuntime().useCases
  const result = await updateStep(parseStepId(parsedStepId.data), parsed.data)
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value)
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { stepId } = await context.params
  const parsedStepId = stepIdParamSchema.safeParse(stepId)
  if (!parsedStepId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deleteStep } = getAdminRuntime().useCases
  await deleteStep(parseStepId(parsedStepId.data))
  return NextResponse.json({ ok: true })
})
