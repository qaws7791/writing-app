import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { stepTypes, steps } from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

const updateStepSchema = z.object({
  type: z.enum(stepTypes).optional(),
  order: z.number().int().min(1).optional(),
  contentJson: z.unknown().optional(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { stepId } = await context.params
  const id = Number(stepId)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [step] = await db.select().from(steps).where(eq(steps.id, id)).limit(1)

  if (!step) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(step)
})

export const PUT = withAdminAuth(async (req, context) => {
  const { stepId } = await context.params
  const id = Number(stepId)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updateStepSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const db = getDb()
  const [updated] = await db
    .update(steps)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(steps.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(updated)
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { stepId } = await context.params
  const id = Number(stepId)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [deleted] = await db.delete(steps).where(eq(steps.id, id)).returning()

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
})
