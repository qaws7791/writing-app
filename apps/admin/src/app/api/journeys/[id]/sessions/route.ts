import { NextResponse } from "next/server"

import {
  createSessionBodySchema,
  journeyIdParamSchema,
  parseJourneyId,
  toHttpStatus,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedJourneyId = journeyIdParamSchema.safeParse(id)
  if (!parsedJourneyId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { listSessions } = getAdminRuntime().useCases
  const items = (
    await listSessions(parseJourneyId(parsedJourneyId.data))
  )._unsafeUnwrap()
  return NextResponse.json({ items })
})

export const POST = withAdminAuth(async (req, context) => {
  const { id } = await context.params
  const parsedJourneyId = journeyIdParamSchema.safeParse(id)
  if (!parsedJourneyId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createSessionBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { createSession } = getAdminRuntime().useCases
  const result = await createSession(
    parseJourneyId(parsedJourneyId.data),
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
