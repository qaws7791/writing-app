import { describe, expect, it } from "vitest"

import {
  learnerProfileStatsDtoSchema,
  learnerProgressOverviewDtoSchema,
  lessonAvailabilityStatusValues,
} from "#contracts/learning/learner-read-model"

describe("학습자 read model DTO", () => {
  it("profile stats와 progress overview schema를 제공한다", () => {
    expect(lessonAvailabilityStatusValues).toEqual([
      "available",
      "completed",
      "locked",
    ])

    expect(
      learnerProfileStatsDtoSchema.parse({
        completedLessons: 1,
        currentStreakDays: 2,
        lastActiveDate: "2026-06-19",
        progressPercent: 50,
        totalLessons: 2,
      })
    ).toEqual({
      completedLessons: 1,
      currentStreakDays: 2,
      lastActiveDate: "2026-06-19",
      progressPercent: 50,
      totalLessons: 2,
    })

    expect(
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
        user: {
          currentStreakDays: 2,
        },
      })
    ).toEqual({
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
      user: {
        currentStreakDays: 2,
      },
    })
  })

  it("음수 count와 범위를 벗어난 progress percent를 거부한다", () => {
    expect(() =>
      learnerProfileStatsDtoSchema.parse({
        completedLessons: -1,
        currentStreakDays: 0,
        lastActiveDate: null,
        progressPercent: 0,
        totalLessons: 1,
      })
    ).toThrow()

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
        user: {
          currentStreakDays: 0,
        },
      })
    ).toThrow()
  })
})
