import { NextResponse } from "next/server"

import {
  createStepBodySchema,
  parseSessionId,
  sessionIdParamSchema,
  toHttpStatus,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const parsedSessionId = sessionIdParamSchema.safeParse(sessionId)
  if (!parsedSessionId.success) {
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
  return NextResponse.json({ items: result.value.steps })
})

export const POST = withAdminAuth(async (req, context) => {
  const { sessionId } = await context.params
  const parsedSessionId = sessionIdParamSchema.safeParse(sessionId)
  if (!parsedSessionId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createStepBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { createStep } = getAdminRuntime().useCases
  const result = await createStep(
    parseSessionId(parsedSessionId.data),
    parsed.data
  )
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value, { status: 201 })
})
