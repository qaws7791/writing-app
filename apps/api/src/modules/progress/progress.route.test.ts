import { describe, expect, it } from "vitest"
import {
  courseDetailDtoSchema,
  courseSummaryDtoSchema,
  createLearnerContentService,
  type ContentRepository,
} from "@workspace/core/content"
import {
  createProgressService,
  type ProgressReader,
} from "@workspace/core/learning"

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

describe("플랫폼 API progress route", () => {
  it("첫 미완료 active lesson만 available로 계산하고 이후 lesson은 locked로 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/progress", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      courses: [
        {
          id: "c1",
          lessons: [
            {
              currentStepIndex: 0,
              estimatedMinutes: 5,
              id: "l1",
              status: "completed",
              title: "좋은 문장이란 무엇인가",
            },
            {
              currentStepIndex: 2,
              estimatedMinutes: 10,
              id: "l-new",
              status: "available",
              title: "새 학습 활동 둘러보기",
            },
            {
              currentStepIndex: null,
              estimatedMinutes: 5,
              id: "l2",
              status: "locked",
              title: "한 문장에 한 생각만 담기",
            },
          ],
          nextLessons: [
            {
              courseId: "c1",
              currentStepIndex: 2,
              estimatedMinutes: 10,
              id: "l-new",
              status: "available",
              title: "새 학습 활동 둘러보기",
            },
          ],
          progressPercent: 33,
          title: "글쓰기 첫걸음 30일",
          visualKey: "basic-sentence-writing",
        },
      ],
      user: {
        currentStreakDays: 2,
      },
    })
  })

  it("status=in_progress는 시작했지만 미완료 코스만 반환한다", async () => {
    const app = createApp(createDependenciesWithCompletedCourse())

    const response = await app.request("/progress?status=in_progress", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      courses: [
        expect.objectContaining({
          id: "c1",
          progressPercent: 33,
        }),
      ],
      user: {
        currentStreakDays: 2,
      },
    })
  })

  it("status=completed는 전체 레슨을 완료한 코스만 반환한다", async () => {
    const app = createApp(createDependenciesWithCompletedCourse())

    const response = await app.request("/progress?status=completed", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      courses: [
        expect.objectContaining({
          id: "c2",
          progressPercent: 100,
          title: "완료한 코스",
        }),
      ],
      user: {
        currentStreakDays: 2,
      },
    })
  })
})

function createDependencies(): ApiDependencies {
  return createProgressDependencies()
}

function createDependenciesWithCompletedCourse(): ApiDependencies {
  return createProgressDependencies({
    includeCompletedCourse: true,
  })
}

function createProgressDependencies({
  includeCompletedCourse = false,
}: {
  readonly includeCompletedCourse?: boolean
} = {}): ApiDependencies {
  const contentRepository: ContentRepository = {
    async findCourseDetail(courseId) {
      if (courseId === "c1") {
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
          visualKey: "basic-sentence-writing",
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
      }

      if (includeCompletedCourse && courseId === "c2") {
        return courseDetailDtoSchema.parse({
          category: "표현력",
          description: "완료한 코스입니다.",
          id: "c2",
          lessonCount: 1,
          progress: {
            completedLessons: 1,
            lessons: [
              {
                currentStepIndex: null,
                lessonId: "l4",
                status: "completed",
              },
            ],
            nextLesson: null,
            percentage: 100,
            totalLessons: 1,
          },
          status: "active",
          title: "완료한 코스",
          visualKey: "expression",
          units: [
            {
              id: "u2",
              lessons: [
                {
                  category: "표현력",
                  description: "완료한 레슨입니다.",
                  estimatedMinutes: 5,
                  id: "l4",
                  sortOrder: 1,
                  status: "active",
                  title: "완료한 레슨",
                },
              ],
              sortOrder: 1,
              title: "표현력",
            },
          ],
        })
      }

      return null
    },
    async findLesson() {
      return null
    },
    async listCourses() {
      const courses = [
        courseSummaryDtoSchema.parse({
          category: "입문자를 위한 코스",
          description: "매일 조금씩 쓰는 습관을 만듭니다.",
          id: "c1",
          lessonCount: 3,
          status: "active",
          title: "글쓰기 첫걸음 30일",
          visualKey: "basic-sentence-writing",
        }),
      ]

      if (includeCompletedCourse) {
        courses.push(
          courseSummaryDtoSchema.parse({
            category: "표현력",
            description: "완료한 코스입니다.",
            id: "c2",
            lessonCount: 1,
            status: "active",
            title: "완료한 코스",
            visualKey: "expression",
          })
        )
      }

      return courses
    },
  }
  const progressReader: ProgressReader = {
    async readLearnerProgress() {
      return {
        currentStreakDays: 2,
        lessonProgress: [
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
          ...(includeCompletedCourse
            ? [
                {
                  currentStepIndex: 0,
                  lessonId: "l4",
                  status: "completed" as const,
                },
              ]
            : []),
        ],
      }
    },
  }

  return {
    ...createTestDependencies(),
    contentService: createLearnerContentService({
      contentRepository,
      progressReader,
    }),
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
    progressService: createProgressService({
      contentRepository,
      progressReader,
    }),
    sessionResolver: {
      async resolveSession(headers) {
        return headers
          .get("Cookie")
          ?.includes("learner_session_token=active-token")
          ? activeSession
          : null
      },
    },
  }
}
