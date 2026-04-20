import { NextResponse } from "next/server"

import {
  parseJourneyId,
  journeyIdParamSchema,
  toHttpStatus,
  updateJourneyBodySchema,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedJourneyId = journeyIdParamSchema.safeParse(id)
  if (!parsedJourneyId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { getJourneyFull } = getAdminRuntime().useCases
  const result = await getJourneyFull(parseJourneyId(parsedJourneyId.data))
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value)
})

export const PUT = withAdminAuth(async (req, context) => {
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

  const parsed = updateJourneyBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updateJourney } = getAdminRuntime().useCases
  const result = await updateJourney(
    parseJourneyId(parsedJourneyId.data),
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
  const { id } = await context.params
  const parsedJourneyId = journeyIdParamSchema.safeParse(id)
  if (!parsedJourneyId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deleteJourney } = getAdminRuntime().useCases
  await deleteJourney(parseJourneyId(parsedJourneyId.data))
  return NextResponse.json({ ok: true })
})
