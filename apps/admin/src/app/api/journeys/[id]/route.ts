import { eq, inArray } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  journeyCategories,
  journeys,
  journeySessions,
  steps,
} from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

const updateJourneySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(journeyCategories).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [journey] = await db
    .select()
    .from(journeys)
    .where(eq(journeys.id, journeyId))
    .limit(1)

  if (!journey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const sessions = await db
    .select()
    .from(journeySessions)
    .where(eq(journeySessions.journeyId, journeyId))
    .orderBy(journeySessions.order)

  const sessionIds = sessions.map((s) => s.id)
  const allSteps =
    sessionIds.length > 0
      ? await db
          .select()
          .from(steps)
          .where(inArray(steps.sessionId, sessionIds))
          .orderBy(steps.order)
      : []

  const sessionsWithSteps = sessions.map((session) => ({
    ...session,
    steps: allSteps.filter((s) => s.sessionId === session.id),
  }))

  return NextResponse.json({ ...journey, sessions: sessionsWithSteps })
})

export const PUT = withAdminAuth(async (req, context) => {
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

  const parsed = updateJourneySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const db = getDb()
  const [updated] = await db
    .update(journeys)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(journeys.id, journeyId))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(updated)
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const journeyId = Number(id)
  if (Number.isNaN(journeyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [deleted] = await db
    .delete(journeys)
    .where(eq(journeys.id, journeyId))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
})
