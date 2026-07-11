import { describe, expect, it } from "vitest"
import { spawnSync } from "node:child_process"

describe("CI workspace 인벤토리", () => {
  it("15개 workspace의 실행 또는 제외 사유를 출력한다", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/ci-workspace-inventory.ts", "test"],
      { encoding: "utf8" }
    )

    expect(result.status).toBe(0)
    expect(result.stdout.match(/^\| `.+` \|/gm)).toHaveLength(15)
    expect(result.stdout).toContain("실행: `test`")
    expect(result.stdout).toContain("제외: `test` 스크립트 없음")
  })
})
