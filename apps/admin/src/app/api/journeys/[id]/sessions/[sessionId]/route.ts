import { NextResponse } from "next/server"
import { z } from "zod"

import { parseSessionId, toHttpStatus } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  order: z.number().int().min(1).optional(),
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
  return NextResponse.json(result.value)
})

export const PUT = withAdminAuth(async (req, context) => {
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

  const parsed = updateSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updateSession } = getUseCases()
  const result = await updateSession(parseSessionId(id), parsed.data)
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
  const id = Number(sessionId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deleteSession } = getUseCases()
  await deleteSession(parseSessionId(id))
  return NextResponse.json({ ok: true })
})
