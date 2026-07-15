import { describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"

import { assembleAdminRuntime } from "@/admin-runtime"

describe("관리자 API 코어 조립", () => {
  it("종료 요청이 반복되어도 데이터베이스 수명주기를 한 번만 닫는다", () => {
    const closeDatabase = vi.fn()
    const runtime = assembleAdminRuntime(closeDatabase, (close) => ({ close }))

    runtime.close()
    runtime.close()

    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })

  it("조립 중 실패하면 생성한 데이터베이스를 한 번 닫는다", () => {
    const closeDatabase = vi.fn()

    expect(() =>
      assembleAdminRuntime(closeDatabase, () => {
        throw new Error("조립 실패")
      })
    ).toThrow("조립 실패")
    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })

  it("실행 진입점이 저장소 구현을 직접 가져오지 않는다", async () => {
    const source = await readFile(new URL("./main.ts", import.meta.url), "utf8")

    expect(source).not.toContain("Drizzle")
    expect(source).not.toContain("createWritingAppDatabase")
    expect(source).not.toContain("Repository")
    expect(source).toContain("createAdminApiRuntime")
  })
})
