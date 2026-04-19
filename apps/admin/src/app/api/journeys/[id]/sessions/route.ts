import { NextResponse } from "next/server"
import { z } from "zod"

import { toJourneyId, toHttpStatus } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const createSessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  order: z.number().int().min(1),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { listSessions } = getUseCases()
  const items = (await listSessions(toJourneyId(journeyId)))._unsafeUnwrap()
  return NextResponse.json({ items })
})

export const POST = withAdminAuth(async (req, context) => {
  const { id } = await context.params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { createSession } = getUseCases()
  const result = await createSession(toJourneyId(journeyId), parsed.data)
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value, { status: 201 })
})
