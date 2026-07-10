import { describe, expect, it, vi } from "vitest"

import {
  readLessonDraftText,
  writeLessonDraftText,
} from "@workspace/ui/lib/lesson-draft-storage"

describe("레슨 초안 저장소", () => {
  it("version key로 초안을 저장하고 읽는다", () => {
    writeLessonDraftText("step-versioned", "초안")

    expect(
      localStorage.getItem("writing-app:lesson-draft:v1:step-versioned")
    ).toBe("초안")
    expect(readLessonDraftText("step-versioned")).toBe("초안")
  })

  it("브라우저 저장소 쓰기가 실패해도 메모리 값으로 계속 동작한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("저장소 사용 불가")
    })

    expect(() =>
      writeLessonDraftText("step-memory-fallback", "메모리 초안")
    ).not.toThrow()
    expect(readLessonDraftText("step-memory-fallback")).toBe("메모리 초안")
  })

  it("과도한 초안은 서버 입력 상한에 맞춰 제한한다", () => {
    writeLessonDraftText("step-bounded", "가".repeat(30_000))

    expect(readLessonDraftText("step-bounded")).toHaveLength(20_000)
  })
})
