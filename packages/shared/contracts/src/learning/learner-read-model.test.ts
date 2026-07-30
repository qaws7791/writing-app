import { describe, expect, it } from "vitest"

import {
  learnerProfileStatsDtoSchema,
  learnerProgressOverviewDtoSchema,
} from "#contracts/learning/learner-read-model"

describe("학습자 profile stats DTO", () => {
  it.each([
    ["마지막 활동일이 있는 경우", "2026-06-19"],
    ["활동 기록이 없는 경우", null],
  ])("%s를 parse한다", (_label, lastActiveDate) => {
    expect(() =>
      learnerProfileStatsDtoSchema.parse({
        completedLessons: 1,
        currentStreakDays: 2,
        lastActiveDate,
        progressPercent: 50,
        totalLessons: 2,
      })
    ).not.toThrow()
  })

  it("음수 완료 레슨 수를 거부한다", () => {
    expect(() =>
      learnerProfileStatsDtoSchema.parse({
        completedLessons: -1,
        currentStreakDays: 0,
        lastActiveDate: null,
        progressPercent: 0,
        totalLessons: 1,
      })
    ).toThrow()
  })
})

describe("학습자 progress overview DTO", () => {
  it("코스별 진행률과 다음 레슨 목록을 parse한다", () => {
    expect(() =>
      learnerProgressOverviewDtoSchema.parse({
        courses: [
          {
            id: "c1",
            lessons: [
              {
                currentStepIndex: null,
                estimatedMinutes: 5,
                id: "l1",
                status: "available",
                title: "좋은 문장이란 무엇인가",
              },
            ],
            nextLessons: [
              {
                courseId: "c1",
                currentStepIndex: null,
                estimatedMinutes: 5,
                id: "l1",
                status: "available",
                title: "좋은 문장이란 무엇인가",
              },
            ],
            progressPercent: 0,
            title: "글쓰기 첫걸음 30일",
            visualKey: "basic-sentence-writing",
          },
        ],
        user: { currentStreakDays: 2 },
      })
    ).not.toThrow()
  })

  it("100을 넘는 progress percent를 거부한다", () => {
    expect(() =>
      learnerProgressOverviewDtoSchema.parse({
        courses: [
          {
            id: "c1",
            lessons: [],
            nextLessons: [],
            progressPercent: 101,
            title: "글쓰기 첫걸음 30일",
            visualKey: "basic-sentence-writing",
          },
        ],
        user: { currentStreakDays: 0 },
      })
    ).toThrow()
  })
})
