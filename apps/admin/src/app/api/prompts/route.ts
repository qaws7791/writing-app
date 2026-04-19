import { NextResponse } from "next/server"
import { z } from "zod"

import {
  parsePromptId,
  promptFiltersQuerySchema,
  promptTypeSchema,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const createPromptSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  promptType: promptTypeSchema,
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (req) => {
  const parsed = promptFiltersQuerySchema.safeParse({
    promptType: req.nextUrl.searchParams.get("type") ?? undefined,
    cursor: req.nextUrl.searchParams.get("cursor") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { listPrompts } = getUseCases()
  const page$ = (
    await listPrompts(null, {
      promptType: parsed.data.promptType,
      cursor:
        parsed.data.cursor === undefined
          ? undefined
          : parsePromptId(parsed.data.cursor),
      limit: parsed.data.limit,
    })
  )._unsafeUnwrap()
  return NextResponse.json(page$)
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
