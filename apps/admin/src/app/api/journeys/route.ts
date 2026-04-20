import { NextResponse } from "next/server"

import {
  createJourneyBodySchema,
  journeyFiltersQuerySchema,
} from "@workspace/core/modules/journeys"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (req) => {
  const parsedFilters = journeyFiltersQuerySchema.safeParse({
    category: req.nextUrl.searchParams.get("category") ?? undefined,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
  })

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.flatten() },
      { status: 422 }
    )
  }

  const { listJourneys } = getAdminRuntime().useCases
  const result = await listJourneys(parsedFilters.data)
  return result.match(
    (items) => NextResponse.json({ items }),
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

  const parsed = createJourneyBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { createJourney } = getAdminRuntime().useCases
  const result = await createJourney(parsed.data)
  return result.match(
    (journey) => NextResponse.json(journey, { status: 201 }),
    () =>
      NextResponse.json(
        { error: "관리자 요청 처리 중 오류가 발생했습니다." },
        { status: 500 }
      )
  )
})
