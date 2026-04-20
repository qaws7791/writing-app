import { NextResponse } from "next/server"

import {
  sessionIdParamSchema,
  updateSessionBodySchema,
} from "@workspace/core/modules/journeys"
import { parseSessionId, toHttpStatus } from "@workspace/core"

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
  return NextResponse.json(result.value)
})

export const PUT = withAdminAuth(async (req, context) => {
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

  const parsed = updateSessionBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updateSession } = getAdminRuntime().useCases
  const result = await updateSession(
    parseSessionId(parsedSessionId.data),
    parsed.data
  )
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value)
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const parsedSessionId = sessionIdParamSchema.safeParse(sessionId)
  if (!parsedSessionId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deleteSession } = getAdminRuntime().useCases
  await deleteSession(parseSessionId(parsedSessionId.data))
  return NextResponse.json({ ok: true })
})
