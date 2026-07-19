import { describe, expect, it } from "vitest"

describe("테스트 콘솔 실패 장치", () => {
  it.each(["error", "warn"] as const)(
    "예상하지 않은 console.%s 호출을 테스트 실패로 바꾼다",
    (method) => {
      expect(() => console[method]("콘솔 실패 장치 확인")).toThrow(
        `예상하지 않은 console.${method}: 콘솔 실패 장치 확인`
      )
    }
  )
})
