import { NextResponse } from "next/server"

import {
  createPromptBodySchema,
  promptFiltersQuerySchema,
} from "@workspace/core/modules/prompts"
import { parsePromptId } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (req) => {
  const parsed = promptFiltersQuerySchema.safeParse({
    promptType: req.nextUrl.searchParams.get("type") ?? undefined,
    cursor: req.nextUrl.searchParams.get("cursor") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { listPrompts } = getAdminRuntime().useCases
  const result = await listPrompts(null, {
    promptType: parsed.data.promptType,
    cursor:
      parsed.data.cursor === undefined
        ? undefined
        : parsePromptId(parsed.data.cursor),
    limit: parsed.data.limit,
  })
  return result.match(
    (page) => NextResponse.json(page),
    () =>
      NextResponse.json(
        { error: "관리자 요청 처리 중 오류가 발생했습니다." },
        { status: 500 }
      )
  )
})

export const POST = withAdminAuth(async (req) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createPromptBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { createPrompt } = getAdminRuntime().useCases
  const result = await createPrompt(parsed.data)
  return result.match(
    (prompt) => NextResponse.json(prompt, { status: 201 }),
    () =>
      NextResponse.json(
        { error: "관리자 요청 처리 중 오류가 발생했습니다." },
        { status: 500 }
      )
  )
})
