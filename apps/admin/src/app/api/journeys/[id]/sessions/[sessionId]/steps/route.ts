import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { stepTypes, steps } from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

const createStepSchema = z.object({
  type: z.enum(stepTypes),
  order: z.number().int().min(1),
  contentJson: z.unknown(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const id = Number(sessionId)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const items = await db
    .select()
    .from(steps)
    .where(eq(steps.sessionId, id))
    .orderBy(steps.order)

  return NextResponse.json({ items })
})

export const POST = withAdminAuth(async (req, context) => {
  const { sessionId } = await context.params
  const id = Number(sessionId)
  if (Number.isNaN(id)) {
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

  const db = getDb()
  const [created] = await db
    .insert(steps)
    .values({
      sessionId: id,
      type: parsed.data.type,
      order: parsed.data.order,
      contentJson: parsed.data.contentJson,
    })
    .returning()

  return NextResponse.json(created, { status: 201 })
})
