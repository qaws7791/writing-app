import { NextResponse } from "next/server"
import { z } from "zod"

import {
  parseSessionId,
  parseStepId,
  stepTypeSchema,
  toHttpStatus,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const updateStepSchema = z.object({
  type: stepTypeSchema.optional(),
  order: z.number().int().min(1).optional(),
  contentJson: z.unknown().optional(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId, stepId } = await context.params
  const sId = Number(sessionId)
  const stId = Number(stepId)
  if (
    !Number.isInteger(sId) ||
    sId <= 0 ||
    !Number.isInteger(stId) ||
    stId <= 0
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { getSessionDetail } = getUseCases()
  const result = await getSessionDetail(parseSessionId(sId))
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  const stepIdValue = parseStepId(stId)
  const step = result.value.steps.find((s) => s.id === stepIdValue)
  if (!step) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(step)
})

export const PUT = withAdminAuth(async (req, context) => {
  const { stepId } = await context.params
  const id = Number(stepId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updateStepSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updateStep } = getUseCases()
  const result = await updateStep(parseStepId(id), parsed.data)
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
  const id = Number(stepId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deleteStep } = getUseCases()
  await deleteStep(parseStepId(id))
  return NextResponse.json({ ok: true })
})
