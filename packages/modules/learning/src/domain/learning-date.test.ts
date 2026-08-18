import { describe, expect, it } from "vitest"

import {
  buildRecentCadenceDays,
  toLearningDateKey,
} from "#learning/domain/learning-date"

describe("buildRecentCadenceDays", () => {
  it("오늘을 끝으로 5일을 휴식·학습·오늘 상태로 채운다", () => {
    const today = toLearningDateKey(new Date("2026-08-18T12:00:00+09:00"))

    expect(
      buildRecentCadenceDays(
        [
          toLearningDateKey(new Date("2026-08-17T12:00:00+09:00")),
          toLearningDateKey(new Date("2026-08-14T12:00:00+09:00")),
        ],
        today
      )
    ).toEqual([
      { date: "2026-08-14", label: "금", state: "practiced" },
      { date: "2026-08-15", label: "토", state: "rest" },
      { date: "2026-08-16", label: "일", state: "rest" },
      { date: "2026-08-17", label: "월", state: "practiced" },
      { date: "2026-08-18", label: "화", state: "today" },
    ])
  })

  it("오늘 학습했으면 오늘 칸을 practiced로 둔다", () => {
    const today = toLearningDateKey(new Date("2026-08-18T12:00:00+09:00"))

    expect(buildRecentCadenceDays([today], today).at(-1)).toEqual({
      date: "2026-08-18",
      label: "화",
      state: "practiced",
    })
  })
})
