import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearLessonDraftsForUser,
  readLessonDraftText,
  subscribeToLessonDraftText,
  writeLessonDraftText,
} from "@/features/lesson-session/api/lesson-draft-storage"

describe("레슨 초안 저장소", () => {
  beforeEach(() => {
    localStorage.clear()
    window.dispatchEvent(new StorageEvent("storage", { key: null }))
  })

  it("version key로 초안을 저장하고 읽는다", () => {
    expect(writeLessonDraftText("learner-a", "step-versioned", "초안")).toEqual(
      { status: "saved" }
    )

    expect(
      localStorage.getItem(
        "writing-app:lesson-draft:v2:learner-a:step-versioned"
      )
    ).toBe("초안")
    expect(readLessonDraftText("learner-a", "step-versioned")).toBe("초안")
  })

  it("같은 스텝의 초안을 사용자별로 격리한다", () => {
    writeLessonDraftText("learner-a", "shared-step", "A의 초안")

    expect(readLessonDraftText("learner-b", "shared-step")).toBe("")
  })

  it("사용자와 스텝 식별자를 key 경계에서 인코딩한다", () => {
    writeLessonDraftText("learner:a", "step/한글", "인코딩된 초안")

    expect(
      localStorage.getItem(
        "writing-app:lesson-draft:v2:learner%3Aa:step%2F%ED%95%9C%EA%B8%80"
      )
    ).toBe("인코딩된 초안")
  })

  it("현재 사용자만 지우고 다른 사용자 초안은 보존한다", () => {
    writeLessonDraftText("learner-a", "shared-step", "A의 초안")
    writeLessonDraftText("learner-b", "shared-step", "B의 초안")

    clearLessonDraftsForUser("learner-a")

    expect(readLessonDraftText("learner-a", "shared-step")).toBe("")
    expect(readLessonDraftText("learner-b", "shared-step")).toBe("B의 초안")
  })

  it("소유자를 알 수 없는 legacy 초안은 새 사용자에게 승격하지 않는다", () => {
    localStorage.setItem("writing-app:lesson-draft:v1:legacy-step", "이전 초안")
    localStorage.setItem("writing-app-draft-legacy-step", "더 이전 초안")

    expect(readLessonDraftText("learner-b", "legacy-step")).toBe("")
    expect(
      localStorage.getItem("writing-app:lesson-draft:v1:legacy-step")
    ).toBeNull()
    expect(localStorage.getItem("writing-app-draft-legacy-step")).toBeNull()
  })

  it("다른 탭의 storage 변경 후 사용자 namespace 캐시를 갱신한다", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToLessonDraftText(
      "learner-a",
      "shared-step",
      listener
    )
    writeLessonDraftText("learner-a", "shared-step", "이전 초안")
    const key = "writing-app:lesson-draft:v2:learner-a:shared-step"
    localStorage.setItem(key, "다른 탭의 초안")

    window.dispatchEvent(new StorageEvent("storage", { key }))

    expect(readLessonDraftText("learner-a", "shared-step")).toBe(
      "다른 탭의 초안"
    )
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
  })

  it("브라우저 저장소 쓰기가 실패해도 메모리 값으로 계속 동작한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("저장소 사용 불가", "SecurityError")
    })

    expect(
      writeLessonDraftText("learner-a", "step-memory-fallback", "메모리 초안")
    ).toEqual({ status: "unavailable" })
    expect(readLessonDraftText("learner-a", "step-memory-fallback")).toBe(
      "메모리 초안"
    )
  })

  it("저장 용량 초과를 저장소 사용 불가와 구분한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("저장 용량 초과", "QuotaExceededError")
    })

    expect(
      writeLessonDraftText("learner-a", "step-quota", "용량 초과 초안")
    ).toEqual({ status: "quota-exceeded" })
  })

  it("과도한 초안은 서버 입력 상한에 맞춰 제한한다", () => {
    writeLessonDraftText("learner-a", "step-bounded", "가".repeat(30_000))

    expect(readLessonDraftText("learner-a", "step-bounded")).toHaveLength(
      20_000
    )
  })
})
