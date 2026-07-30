import { describe, expect, it } from "vitest"

import { createConsoleFailureHarness } from "@/shared/test/console-failure-harness"

describe("테스트 콘솔 실패 장치", () => {
  it.each(["error", "warn"] as const)(
    "설치하면 예상하지 않은 console.%s 호출을 오류로 바꾼다",
    (method) => {
      const target = createSilentConsole()
      createConsoleFailureHarness(target).install()

      expect(() => target[method]("콘솔 실패 장치 확인")).toThrow(
        `예상하지 않은 console.${method}: 콘솔 실패 장치 확인`
      )
    }
  )

  it("복원하면 설치 전의 console 함수를 그대로 되돌린다", () => {
    const target = createSilentConsole()
    const { error, warn } = target
    const harness = createConsoleFailureHarness(target)

    harness.install()
    harness.restore()

    expect(target.error).toBe(error)
    expect(target.warn).toBe(warn)
  })

  it("설치와 복원을 반복해도 실패 함수를 원본으로 기억하지 않는다", () => {
    const target = createSilentConsole()
    const { error } = target
    const harness = createConsoleFailureHarness(target)

    harness.install()
    harness.restore()
    harness.install()
    harness.restore()

    expect(target.error).toBe(error)
  })
})

function createSilentConsole(): Pick<Console, "error" | "warn"> {
  return {
    error: function silentError() {},
    warn: function silentWarn() {},
  }
}
