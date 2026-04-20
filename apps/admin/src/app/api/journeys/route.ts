import { NextResponse } from "next/server"

import {
  createJourneyBodySchema,
  journeyFiltersQuerySchema,
} from "@workspace/core"

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
  const items = (await listJourneys(parsedFilters.data))._unsafeUnwrap()
  return NextResponse.json({ items })
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
  const journey = (await createJourney(parsed.data))._unsafeUnwrap()
  return NextResponse.json(journey, { status: 201 })
})
