import { describe, expect, it } from "vitest"

import { toUserId } from "../../../shared/brand/index"
import { makeGetHomeUseCase } from "./get-home"

describe("makeGetHomeUseCase", () => {
  it("returns the first sentence loop entry points", async () => {
    const getHome = makeGetHomeUseCase({})
    const result = await getHome(toUserId("user-1"))

    expect(result.isOk()).toBe(true)

    const snapshot = result._unsafeUnwrap()
    expect(snapshot.startActions).toHaveLength(3)
    expect(snapshot.startActions.map((action) => action.id)).toEqual([
      "photo",
      "manual",
      "garden",
    ])
    expect(snapshot.recentWork).toBeNull()
    expect(snapshot.garden).toEqual({
      cardCount: 0,
      sentenceCount: 0,
    })
  })
})
