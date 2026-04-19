import { NextResponse } from "next/server"
import { z } from "zod"

import { parseSessionId, stepTypeSchema, toHttpStatus } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const createStepSchema = z.object({
  type: stepTypeSchema,
  order: z.number().int().min(1),
  contentJson: z.unknown(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const id = Number(sessionId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { getSessionDetail } = getUseCases()
  const result = await getSessionDetail(parseSessionId(id))
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json({ items: result.value.steps })
})

export const POST = withAdminAuth(async (req, context) => {
  const { sessionId } = await context.params
  const id = Number(sessionId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createStepSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { createStep } = getUseCases()
  const result = await createStep(parseSessionId(id), parsed.data)
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value, { status: 201 })
})
