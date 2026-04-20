import { NextResponse } from "next/server"

import {
  createSessionBodySchema,
  journeyIdParamSchema,
} from "@workspace/core/modules/journeys"
import { parseJourneyId, toHttpStatus } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedJourneyId = journeyIdParamSchema.safeParse(id)
  if (!parsedJourneyId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { listSessions } = getAdminRuntime().useCases
  const result = await listSessions(parseJourneyId(parsedJourneyId.data))
  return result.match(
    (items) => NextResponse.json({ items }),
    () =>
      NextResponse.json(
        { error: "관리자 요청 처리 중 오류가 발생했습니다." },
        { status: 500 }
      )
  )
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
