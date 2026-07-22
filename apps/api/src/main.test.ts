import { describe, expect, it, vi } from "vitest"

const { serve } = vi.hoisted(() => ({ serve: vi.fn() }))

vi.mock("bun", async (importOriginal) => ({
  ...(await importOriginal<typeof import("bun")>()),
  serve,
}))

describe("API main module", () => {
  it("factory를 import해도 process와 server를 시작하지 않는다", async () => {
    const module = await import("@/main")

    expect(module.startApiServer).toBeTypeOf("function")
    expect(serve).not.toHaveBeenCalled()
  }, 15_000)
})
