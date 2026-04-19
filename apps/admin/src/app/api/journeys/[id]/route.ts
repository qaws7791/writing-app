import { NextResponse } from "next/server"
import { z } from "zod"

import {
  journeyCategorySchema,
  parseJourneyId,
  toHttpStatus,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const updateJourneySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: journeyCategorySchema.optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { getJourneyFull } = getUseCases()
  const result = await getJourneyFull(parseJourneyId(numId))
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
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updateJourneySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updateJourney } = getUseCases()
  const result = await updateJourney(parseJourneyId(numId), parsed.data)
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
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deleteJourney } = getUseCases()
  await deleteJourney(parseJourneyId(numId))
  return NextResponse.json({ ok: true })
})
