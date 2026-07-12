import { describe, expect, it } from "vitest"

import { resolveSafeInternalPath } from "#ui/lib/safe-navigation-path"

describe("내부 이동 경로", () => {
  it("같은 출처의 절대 경로만 허용한다", () => {
    const resolve = (candidate: string) =>
      resolveSafeInternalPath({
        blockedPathnames: ["/login"],
        candidate,
        defaultPath: "/",
      })

    expect(resolve("/courses?status=active#list")).toBe(
      "/courses?status=active#list"
    )
    expect(resolve("//evil.example")).toBe("/")
    expect(resolve("/\\evil.example")).toBe("/")
    expect(resolve("https://evil.example")).toBe("/")
    expect(resolve("/login/again")).toBe("/")
  })
})
