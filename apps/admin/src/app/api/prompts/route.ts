import { NextResponse } from "next/server"
import { z } from "zod"

import { promptTypeSchema } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const createPromptSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  promptType: promptTypeSchema,
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (req) => {
  const { searchParams } = req.nextUrl
  const type = searchParams.get("type")
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = 20

  const filters =
    type && promptTypeSchema.safeParse(type).success
      ? {
          promptType: promptTypeSchema.parse(type),
          cursor: (page - 1) * limit > 0 ? (page - 1) * limit : undefined,
          limit,
        }
      : {
          limit,
          cursor: (page - 1) * limit > 0 ? (page - 1) * limit : undefined,
        }

  const { listPrompts } = getUseCases()
  const page$ = (await listPrompts(null, filters))._unsafeUnwrap()
  return NextResponse.json({ items: page$.items, page, limit })
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

  const { createPrompt } = getUseCases()
  const prompt = (await createPrompt(parsed.data))._unsafeUnwrap()
  return NextResponse.json(prompt, { status: 201 })
})
