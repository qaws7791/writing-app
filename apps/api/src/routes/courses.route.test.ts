import { describe, expect, it } from "vitest"
import {
  courseDetailDtoSchema,
  courseSummaryDtoSchema,
} from "@workspace/core/content"

import { createApp, type ApiDependencies } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

const activeSession = {
  user: {
    email: "learner@example.com",
    id: "user-1",
    image: null,
    joinedAt: "2026-06-14T00:00:00.000Z",
    name: "학습자",
    status: "active",
  },
} as const

describe("플랫폼 API courses route", () => {
  it("인증된 사용자가 active course 목록을 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/courses", {
      headers: {
        Authorization: "Bearer active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      courses: [
        {
          id: "c1",
          lessonCount: 3,
          title: "글쓰기 첫걸음 30일",
        },
      ],
    })
  })

  it("인증된 사용자가 course 상세를 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/courses/c1", {
      headers: {
        Authorization: "Bearer active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "c1",
      units: [
        {
          id: "u1",
          lessons: [
            {
              id: "l1",
              estimatedMinutes: 5,
            },
          ],
        },
      ],
    })
  })

  it("course 상세 progress를 현재 학습자 기준으로 반환한다", async () => {
    const app = createApp(
      createCourseDetailDependencies([
        {
          currentStepIndex: 0,
          lessonId: "l1",
          status: "completed",
        },
        {
          currentStepIndex: 2,
          lessonId: "l-new",
          status: "in_progress",
        },
      ])
    )

    const response = await app.request("/courses/c1", {
      headers: {
        Authorization: "Bearer active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "c1",
      progress: {
        completedLessons: 1,
        lessons: [
          {
            currentStepIndex: 0,
            lessonId: "l1",
            status: "completed",
          },
          {
            currentStepIndex: 2,
            lessonId: "l-new",
            status: "available",
          },
          {
            currentStepIndex: null,
            lessonId: "l2",
            status: "locked",
          },
        ],
        nextLesson: {
          currentStepIndex: 2,
          estimatedMinutes: 10,
          id: "l-new",
          status: "available",
          title: "새 학습 활동 둘러보기",
        },
        percentage: 33,
        totalLessons: 3,
      },
    })
  })

  it("모든 lesson을 완료한 course 상세의 nextLesson은 null이다", async () => {
    const app = createApp(
      createCourseDetailDependencies([
        {
          currentStepIndex: 0,
          lessonId: "l1",
          status: "completed",
        },
        {
          currentStepIndex: 2,
          lessonId: "l-new",
          status: "completed",
        },
        {
          currentStepIndex: 0,
          lessonId: "l2",
          status: "completed",
        },
      ])
    )

    const response = await app.request("/courses/c1", {
      headers: {
        Authorization: "Bearer active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      progress: {
        completedLessons: 3,
        nextLesson: null,
        percentage: 100,
        totalLessons: 3,
      },
    })
  })
})

function createCourseDetailDependencies(
  lessonProgress: readonly {
    readonly currentStepIndex: number
    readonly lessonId: string
    readonly status: "completed" | "in_progress"
  }[]
): ApiDependencies {
  return {
    contentRepository: {
      async findCourseDetail(courseId) {
        if (courseId !== "c1") {
          return null
        }

        return courseDetailDtoSchema.parse({
          category: "입문자를 위한 코스",
          description: "매일 조금씩 쓰는 습관을 만듭니다.",
          id: "c1",
          lessonCount: 3,
          progress: {
            completedLessons: 0,
            lessons: [
              {
                currentStepIndex: null,
                lessonId: "l1",
                status: "available",
              },
              {
                currentStepIndex: null,
                lessonId: "l-new",
                status: "locked",
              },
              {
                currentStepIndex: null,
                lessonId: "l2",
                status: "locked",
              },
            ],
            nextLesson: {
              currentStepIndex: null,
              estimatedMinutes: 5,
              id: "l1",
              status: "available",
              title: "좋은 문장이란 무엇인가",
            },
            percentage: 0,
            totalLessons: 3,
          },
          status: "active",
          title: "글쓰기 첫걸음 30일",
          units: [
            {
              id: "u1",
              lessons: [
                {
                  category: "문장의 기본기",
                  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
                  estimatedMinutes: 5,
                  id: "l1",
                  sortOrder: 1,
                  status: "active",
                  title: "좋은 문장이란 무엇인가",
                },
                {
                  category: "문장의 기본기",
                  description: "새 학습 활동을 살펴봅니다.",
                  estimatedMinutes: 10,
                  id: "l-new",
                  sortOrder: 2,
                  status: "active",
                  title: "새 학습 활동 둘러보기",
                },
                {
                  category: "문장의 기본기",
                  description: "한 문장에는 한 생각만 담습니다.",
                  estimatedMinutes: 5,
                  id: "l2",
                  sortOrder: 3,
                  status: "active",
                  title: "한 문장에 한 생각만 담기",
                },
              ],
              sortOrder: 1,
              title: "문장의 기본기",
            },
          ],
        })
      },
      async findLesson() {
        return null
      },
      async listCourses() {
        return [
          courseSummaryDtoSchema.parse({
            category: "입문자를 위한 코스",
            description: "매일 조금씩 쓰는 습관을 만듭니다.",
            id: "c1",
            lessonCount: 3,
            status: "active",
            title: "글쓰기 첫걸음 30일",
          }),
        ]
      },
    },
    profileReader: {
      async readProfileStats() {
        return {
          completedLessons: 1,
          currentStreakDays: 2,
          lastActiveDate: "2026-06-14",
          progressPercent: 33,
          totalLessons: 3,
        }
      },
    },
    progressReader: {
      async readLearnerProgress() {
        return {
          currentStreakDays: 2,
          lessonProgress,
        }
      },
    },
    sessionResolver: {
      async resolveSession(headers) {
        const token = headers.get("Authorization")?.replace(/^Bearer /, "")

        return token === "active-token" ? activeSession : null
      },
    },
  }
}
