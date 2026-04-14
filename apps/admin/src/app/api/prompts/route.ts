import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { promptTypes, writingPrompts } from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

const createPromptSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  promptType: z.enum(promptTypes),
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (req) => {
  const { searchParams } = req.nextUrl
  const type = searchParams.get("type")
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = 20
  const offset = (page - 1) * limit

  const db = getDb()

  let query = db.select().from(writingPrompts).$dynamic()

  if (type && promptTypes.includes(type as (typeof promptTypes)[number])) {
    query = query.where(
      eq(writingPrompts.promptType, type as (typeof promptTypes)[number])
    )
  }

  const items = await query
    .orderBy(writingPrompts.createdAt)
    .limit(limit)
    .offset(offset)

  return NextResponse.json({ items, page, limit })
})

export const POST = withAdminAuth(async (req) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createPromptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const db = getDb()
  const [created] = await db
    .insert(writingPrompts)
    .values({
      ...parsed.data,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    })
    .returning()

  return NextResponse.json(created, { status: 201 })
})
