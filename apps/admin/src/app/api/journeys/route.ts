import { count, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  journeyCategories,
  journeys,
  journeySessions,
} from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

const createJourneySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(journeyCategories),
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (req) => {
  const { searchParams } = req.nextUrl
  const category = searchParams.get("category")
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = 20
  const offset = (page - 1) * limit

  const db = getDb()

  const sessionCountSq = db
    .select({
      journeyId: journeySessions.journeyId,
      count: count().as("count"),
    })
    .from(journeySessions)
    .groupBy(journeySessions.journeyId)
    .as("session_counts")

  let query = db
    .select({
      id: journeys.id,
      title: journeys.title,
      description: journeys.description,
      category: journeys.category,
      thumbnailUrl: journeys.thumbnailUrl,
      sessionCount: sessionCountSq.count,
      createdAt: journeys.createdAt,
      updatedAt: journeys.updatedAt,
    })
    .from(journeys)
    .leftJoin(sessionCountSq, eq(journeys.id, sessionCountSq.journeyId))
    .$dynamic()

  if (
    category &&
    journeyCategories.includes(category as (typeof journeyCategories)[number])
  ) {
    query = query.where(
      eq(journeys.category, category as (typeof journeyCategories)[number])
    )
  }

  const items = await query.limit(limit).offset(offset)
  return NextResponse.json({ items, page, limit })
})

export const POST = withAdminAuth(async (req) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createJourneySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const db = getDb()
  const [created] = await db
    .insert(journeys)
    .values({
      ...parsed.data,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    })
    .returning()

  return NextResponse.json(created, { status: 201 })
})
