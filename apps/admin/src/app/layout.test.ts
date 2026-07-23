import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const layoutSourcePath = join(import.meta.dirname, "layout.tsx")

describe("어드민 루트 레이아웃", () => {
  it("nonce를 전달하는 Zod jitless bootstrap을 hydration 전에 실행한다", () => {
    const layoutSource = readFileSync(layoutSourcePath, "utf8")

    expect(layoutSource).toContain('id="admin-zod-jitless"')
    expect(layoutSource).toContain("<head>")
    expect(layoutSource).toContain("dangerouslySetInnerHTML")
    expect(layoutSource).toContain("suppressHydrationWarning")
    expect(layoutSource).toContain("{ nonce }")
    expect(layoutSource).toContain("zodJitlessBootstrapScript")
  })
})
