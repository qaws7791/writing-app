import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { journeySessions } from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  order: z.number().int().min(1).optional(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const id = Number(sessionId)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [session] = await db
    .select()
    .from(journeySessions)
    .where(eq(journeySessions.id, id))
    .limit(1)

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(session)
})

export const PUT = withAdminAuth(async (req, context) => {
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

  const parsed = updateSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const db = getDb()
  const [updated] = await db
    .update(journeySessions)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(journeySessions.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(updated)
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { sessionId } = await context.params
  const id = Number(sessionId)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [deleted] = await db
    .delete(journeySessions)
    .where(eq(journeySessions.id, id))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
})
