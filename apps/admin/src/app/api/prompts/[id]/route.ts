import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { promptTypes, writingPrompts } from "@workspace/database"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getDb } from "@/lib/db"

const updatePromptSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  promptType: z.enum(promptTypes).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const promptId = Number(id)
  if (Number.isNaN(promptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [prompt] = await db
    .select()
    .from(writingPrompts)
    .where(eq(writingPrompts.id, promptId))
    .limit(1)

  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(prompt)
})

export const PUT = withAdminAuth(async (req, context) => {
  const { id } = await context.params
  const promptId = Number(id)
  if (Number.isNaN(promptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updatePromptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const db = getDb()
  const [updated] = await db
    .update(writingPrompts)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(writingPrompts.id, promptId))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(updated)
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const promptId = Number(id)
  if (Number.isNaN(promptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const [deleted] = await db
    .delete(writingPrompts)
    .where(eq(writingPrompts.id, promptId))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
})
