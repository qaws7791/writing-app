import { describe, expect, it } from "vitest"

import {
  addLearningCalendarDays,
  calculateCurrentStreakDays,
  createLearningActivityDatePolicy,
  groupLearningActivityDatesByUserId,
  isLearningDateKeyInRange,
  toLearningDateKey,
  type LearningDateKey,
} from "#learning/domain/learning-date"

describe("학습 활동일 정책", () => {
  it("플랫폼 학습일은 명시된 학습 시간대를 사용한다", () => {
    expect(toLearningDateKey(new Date("2026-06-14T14:59:59.000Z"))).toBe(
      "2026-06-14"
    )
    expect(toLearningDateKey(new Date("2026-06-14T15:00:00.000Z"))).toBe(
      "2026-06-15"
    )
  })

  it("현재 학습일은 시스템 시간을 직접 읽지 않고 주입된 Clock만 사용한다", () => {
    const policy = createLearningActivityDatePolicy({
      now: () => new Date("2026-06-14T15:00:00.000Z"),
    })

    expect(policy.currentDateKey()).toBe("2026-06-15")
  })

  it("학습 활동일은 UTC instant가 아니라 논리 날짜로 이동한다", () => {
    expect(addLearningCalendarDays(key("2026-12-31"), 1)).toBe("2027-01-01")
    expect(addLearningCalendarDays(key("2026-01-01"), -1)).toBe("2025-12-31")
    expect(addLearningCalendarDays(key("2024-02-28"), 1)).toBe("2024-02-29")
  })

  it("연속 학습일은 정렬된 학습 활동일 키로 결정적으로 계산한다", () => {
    expect(
      calculateCurrentStreakDays([
        key("2026-06-15"),
        key("2026-06-14"),
        key("2026-06-13"),
        key("2026-06-11"),
      ])
    ).toBe(3)
  })

  it("학습 활동일을 사용자별 최신순으로 그룹화한다", () => {
    expect(
      groupLearningActivityDatesByUserId([
        { activityDate: "2026-06-13", userId: "user-1" },
        { activityDate: "2026-06-15", userId: "user-1" },
        { activityDate: "2026-06-14", userId: "user-2" },
      ])
    ).toEqual(
      new Map([
        ["user-1", ["2026-06-15", "2026-06-13"]],
        ["user-2", ["2026-06-14"]],
      ])
    )
  })

  it("학습일 range 비교는 문자열 포맷의 정렬 가능성에만 의존한다", () => {
    expect(
      isLearningDateKeyInRange(key("2026-06-14"), {
        end: key("2026-06-15"),
        start: key("2026-06-13"),
      })
    ).toBe(true)
    expect(
      isLearningDateKeyInRange(key("2026-06-12"), {
        end: key("2026-06-15"),
        start: key("2026-06-13"),
      })
    ).toBe(false)
  })
})

function key(value: string): LearningDateKey {
  return value as LearningDateKey
}
