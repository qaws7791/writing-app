import { describe, expect, it } from "vitest"

import { validateSeed } from "#content/infrastructure/persistence/content-seed"

describe("validateSeed", () => {
  it("기본 시드를 로드하고 정규화한다", async () => {
    await expect(validateSeed()).resolves.toBeUndefined()
  })
})
