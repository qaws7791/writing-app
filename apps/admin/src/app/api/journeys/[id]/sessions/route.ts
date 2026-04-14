import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { journeySessions } from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

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

  const db = getDb()
  const items = await db
    .select()
    .from(journeySessions)
    .where(eq(journeySessions.journeyId, journeyId))
    .orderBy(journeySessions.order)

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

  const db = getDb()
  const [created] = await db
    .insert(journeySessions)
    .values({ ...parsed.data, journeyId })
    .returning()

  return NextResponse.json(created, { status: 201 })
})
