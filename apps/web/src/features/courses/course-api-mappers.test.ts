import { describe, expect, it } from "vitest"

import {
  mapCourseDetail,
  mapCourseList,
  mapProgress,
} from "@/features/courses/course-api-mappers"

describe("코스 API mapper", () => {
  it("API 코스 목록 응답을 내부 코스 요약으로 변환한다", () => {
    expect(
      mapCourseList({
        courses: [
          {
            category: "입문자를 위한 코스",
            description: "매일 조금씩 쓰는 습관을 만듭니다.",
            id: "c1",
            lessonCount: 10,
            status: "active",
            title: "글쓰기 첫걸음 30일",
          },
        ],
      })
    ).toEqual([
      {
        category: "입문자를 위한 코스",
        description: "매일 조금씩 쓰는 습관을 만듭니다.",
        id: "c1",
        lessonCount: 10,
        status: "active",
        title: "글쓰기 첫걸음 30일",
      },
    ])
  })

  it("API 코스 상세 응답의 progress와 unit 구조를 유지한다", () => {
    expect(
      mapCourseDetail({
        category: "입문자를 위한 코스",
        description: "매일 조금씩 쓰는 습관을 만듭니다.",
        id: "c1",
        lessonCount: 10,
        progress: {
          completedLessons: 1,
          lessons: [
            {
              currentStepIndex: 0,
              lessonId: "l1",
              status: "completed",
            },
          ],
          nextLesson: null,
          percentage: 10,
          totalLessons: 10,
        },
        status: "active",
        title: "글쓰기 첫걸음 30일",
        units: [
          {
            id: "u1",
            lessons: [
              {
                category: "문장의 기본기",
                description: "문장을 살펴봅니다.",
                estimatedMinutes: 5,
                id: "l1",
                sortOrder: 1,
                status: "active",
                title: "좋은 문장이란 무엇인가",
              },
            ],
            sortOrder: 1,
            title: "문장의 기본기",
          },
        ],
      })
    ).toMatchObject({
      id: "c1",
      progress: {
        completedLessons: 1,
        lessons: [
          {
            currentStepIndex: 0,
            lessonId: "l1",
            status: "completed",
          },
        ],
        nextLesson: null,
        totalLessons: 10,
      },
      progressPercent: 10,
      units: [
        {
          id: "u1",
          lessons: [
            {
              estimatedMinutes: 5,
              id: "l1",
              title: "좋은 문장이란 무엇인가",
            },
          ],
        },
      ],
    })
  })

  it("API 진행 응답을 홈 화면 모델로 변환한다", () => {
    expect(
      mapProgress({
        courses: [
          {
            id: "c1",
            lessons: [
              {
                currentStepIndex: 1,
                estimatedMinutes: 5,
                id: "l1",
                status: "completed",
                title: "좋은 문장이란 무엇인가",
              },
              {
                currentStepIndex: null,
                estimatedMinutes: 7,
                id: "l2",
                status: "available",
                title: "짧게 쓰기",
              },
            ],
            nextLessons: [
              {
                courseId: "c1",
                currentStepIndex: null,
                estimatedMinutes: 7,
                id: "l2",
                status: "available",
                title: "짧게 쓰기",
              },
            ],
            progressPercent: 50,
            title: "글쓰기 첫걸음 30일",
          },
        ],
        user: {
          currentStreakDays: 3,
        },
      })
    ).toMatchObject({
      courses: [
        {
          id: "c1",
          nextLessons: [
            {
              currentStepIndex: null,
              id: "l2",
              status: "available",
            },
          ],
          progressPercent: 50,
        },
      ],
      currentStreakDays: 3,
    })
  })
})
