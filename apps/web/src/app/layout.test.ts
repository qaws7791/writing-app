import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const layoutSourcePath = join(import.meta.dirname, "layout.tsx")

describe("루트 레이아웃", () => {
  it("전역 inline style normalizer를 마운트하지 않는다", () => {
    const layoutSource = readFileSync(layoutSourcePath, "utf8")

    expect(layoutSource).not.toContain("InlineStyleAttributeNormalizer")
  })
})
