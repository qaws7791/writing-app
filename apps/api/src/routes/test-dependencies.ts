import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  learnerCourseDetailSchema,
  learnerCoursePageSchema,
  learnerLessonSchema,
  learnerProgressPageSchema,
} from "@workspace/contracts/learning/learner-content"
import { createLearnerCursorCodec } from "@workspace/core/learning"
import { createAiFeedbackRoutes } from "@workspace/ai-feedback/http"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { err, ok } from "@workspace/kernel/result"
import { createLearnerIdentityRoutes } from "@workspace/identity/http"
import type { SessionResolver } from "@workspace/identity/sessions"

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

const learnerCursorCodec = createLearnerCursorCodec(
  "test-cursor-signing-secret-with-32-bytes"
)

const version = {
  curriculumVersionId: "c1-v1",
  revision: 1,
} as const

const testCoursePage = learnerCoursePageSchema.parse({
  items: [
    {
      category: "입문자를 위한 코스",
      contentStatus: "active",
      description: "매일 조금씩 쓰는 습관을 만듭니다.",
      id: "c1",
      lessonCount: 3,
      title: "글쓰기 첫걸음 30일",
      version,
      visualKey: "basic-sentence-writing",
    },
  ],
  nextCursor: null,
})

export const testCourseDetail = learnerCourseDetailSchema.parse({
  ...testCoursePage.items[0],
  learning: {
    completedLessons: 0,
    nextLesson: {
      currentStepId: "l1-s1",
      currentStepIndex: 0,
      estimatedMinutes: 5,
      id: "l1",
      title: "좋은 문장이란 무엇인가",
    },
    progressPercent: 0,
    status: "not_started",
    totalLessons: 3,
    version,
  },
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "문장의 기본기",
          contentStatus: "active",
          description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
          estimatedMinutes: 5,
          id: "l1",
          learning: {
            status: "not_started",
            totalSteps: 1,
            version,
          },
          sortOrder: 1,
          title: "좋은 문장이란 무엇인가",
        },
      ],
      sortOrder: 1,
      title: "문장의 기본기",
    },
  ],
})

const testLearnerLesson = learnerLessonSchema.parse({
  category: "문장의 기본기",
  courseId: "c1",
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  id: "l1",
  learning: {
    status: "not_started",
    totalSteps: 1,
    version,
  },
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
  version,
})

const testProgressPage = learnerProgressPageSchema.parse({
  items: [],
  nextCursor: null,
})

export function createTestDependencies(): ApiDependencies {
  const sessionResolver: SessionResolver = {
    async resolveSession(headers) {
      const token = readTestSessionToken(headers)

      return token === "active-token" ? activeSession : null
    },
  }

  return {
    aiFeedbackRoutes: createAiFeedbackRoutes({
      command: {
        async requestFeedback() {
          throwUnexpectedTestDependencyCall("aiFeedbackCommand.requestFeedback")
        },
      },
      session: {
        async resolveLearner(headers) {
          const session = await sessionResolver.resolveSession(headers)
          return session === null
            ? null
            : {
                kind: "active",
                learnerId: learnerIdSchema.parse(session.user.id),
              }
        },
      },
    }),
    contentService: {
      async getCourseDetail({ courseId }) {
        return courseId === "c1"
          ? ok(testCourseDetail)
          : err({ kind: "course-not-found" })
      },
      async getLesson({ lessonId }) {
        return lessonId === "l1"
          ? ok(testLearnerLesson)
          : err({ kind: "lesson-not-found" })
      },
      async listCourseCategories() {
        return ["입문자를 위한 코스"]
      },
      async listCourses() {
        return { items: testCoursePage.items, nextPosition: null }
      },
    },
    learnerCursorCodec,
    learnerTransitionRepository: {
      async completeStep() {
        throwUnexpectedTestDependencyCall(
          "learnerTransitionRepository.completeStep"
        )
      },
      async startLesson() {
        throwUnexpectedTestDependencyCall(
          "learnerTransitionRepository.startLesson"
        )
      },
    },
    identityRoutes: createLearnerIdentityRoutes({
      profileStatsQuery: {
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
      sessionResolver,
    }),
    progressService: {
      async readProgress() {
        return { items: testProgressPage.items, nextPosition: null }
      },
    },
    sessionResolver,
  }
}

function readTestSessionToken(headers: Headers): string | null {
  const cookieToken = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === learnerSessionCookieName)?.[1]

  if (cookieToken !== undefined) {
    return decodeURIComponent(cookieToken)
  }

  return null
}

function throwUnexpectedTestDependencyCall(methodName: string): never {
  throw new Error(`Unexpected test dependency call: ${methodName}`)
}
