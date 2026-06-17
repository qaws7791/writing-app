import {
  courseDetailDtoSchema,
  courseSummaryDtoSchema,
  lessonDtoSchema,
  type ContentRepository,
} from "@workspace/core/content"
import { readBearerToken } from "@workspace/core/auth"

import type { ApiDependencies } from "@/app"

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

export function createTestDependencies(): ApiDependencies {
  return {
    contentRepository,
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
    sessionResolver: {
      async resolveSession(headers) {
        const token = readTestSessionToken(headers)

        return token === "active-token" ? activeSession : null
      },
    },
  }
}

function readTestSessionToken(headers: Headers): string | null {
  const cookieToken = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === "kwep_session")?.[1]

  if (cookieToken !== undefined) {
    return decodeURIComponent(cookieToken)
  }

  return readBearerToken(headers.get("Authorization"))
}

const contentRepository: ContentRepository = {
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
          ],
          sortOrder: 1,
          title: "문장의 기본기",
        },
      ],
    })
  },
  async findLesson(lessonId) {
    if (lessonId !== "l1") {
      return null
    }

    return lessonDtoSchema.parse({
      category: "문장의 기본기",
      courseId: "c1",
      description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
      estimatedMinutes: 5,
      id: "l1",
      steps: [
        {
          body: "좋은 문장은 한 가지 의미를 분명히 전달합니다.",
          guide: "좋은 문장의 기준을 읽습니다.",
          id: "l1-s1",
          sortOrder: 1,
          title: "명료성의 원칙",
          type: "READING",
        },
      ],
      summary: ["좋은 문장은 모호하지 않다"],
      title: "좋은 문장이란 무엇인가",
      unitId: "u1",
    })
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
        visualKey: "basic-sentence-writing",
      }),
    ]
  },
}
