import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  learnerCourseDetailSchema,
  learnerCoursePageSchema,
  learnerLessonSchema,
  learnerProgressPageSchema,
} from "@workspace/contracts/learning/learner-content"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { createAiFeedbackRoutes } from "@workspace/ai-feedback/http"
import { createLearnerIdentityRoutes } from "@workspace/identity/http"
import type { SessionResolver } from "@workspace/identity/sessions"
import type { LearningApplication } from "@workspace/learning/application"
import {
  createLearnerCursorCodec,
  createLearningRoutes,
} from "@workspace/learning/http"
import type { LearningQueries } from "@workspace/learning/queries"
import { err, ok } from "@workspace/kernel/result"

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

const version = { curriculumVersionId: "c1-v1", revision: 1 } as const
const coursePage = learnerCoursePageSchema.parse({
  items: [
    {
      category: "입문자를 위한 코스",
      contentStatus: "active",
      description: "매일 조금씩 쓰는 습관을 만듭니다.",
      id: "c1",
      lessonCount: 1,
      title: "글쓰기 첫걸음 30일",
      version,
      visualKey: "basic-sentence-writing",
    },
  ],
  nextCursor: null,
})
const courseDetail = learnerCourseDetailSchema.parse({
  ...coursePage.items[0],
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
    totalLessons: 1,
    version,
  },
  units: [],
})
const lesson = learnerLessonSchema.parse({
  category: "문장의 기본기",
  courseId: "c1",
  description: "명료한 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  id: "l1",
  learning: { status: "not_started", totalSteps: 1, version },
  steps: [
    {
      body: "좋은 문장은 의미를 분명히 전달합니다.",
      guide: "기준을 읽습니다.",
      id: "l1-s1",
      sortOrder: 1,
      title: "명료성의 원칙",
      type: "READING",
    },
  ],
  summary: [],
  title: "좋은 문장이란 무엇인가",
  unitId: "u1",
  version,
})
const progressPage = learnerProgressPageSchema.parse({
  items: [],
  nextCursor: null,
})

export function createTestDependencies(
  input: {
    readonly completeStep?: LearningApplication["completeStep"]
    readonly sessionResolver?: SessionResolver
  } = {}
): ApiDependencies {
  const sessionResolver = input.sessionResolver ?? createTestSessionResolver()
  const application: LearningApplication = {
    answerStep: async () => {
      throw new Error("Unexpected test dependency call: answerStep")
    },
    completeStep:
      input.completeStep ??
      (async () => {
        throw new Error("Unexpected test dependency call: completeStep")
      }),
    requestAiFeedback: async () =>
      err({ kind: "provider-unavailable", remainingAttempts: 1 }),
    startLesson: async () => {
      throw new Error("Unexpected test dependency call: startLesson")
    },
  }
  const queries: LearningQueries = {
    content: {
      async getCourseDetail({ courseId }) {
        return courseId === "c1"
          ? ok(courseDetail)
          : err({ kind: "course-not-found" })
      },
      async getLesson({ lessonId }) {
        return lessonId === "l1"
          ? ok(lesson)
          : err({ kind: "lesson-not-found" })
      },
      async listCourseCategories() {
        return ["입문자를 위한 코스"]
      },
      async listCourses() {
        return { items: coursePage.items, nextPosition: null }
      },
    },
    progress: {
      async readProgress() {
        return { items: progressPage.items, nextPosition: null }
      },
    },
  }
  const learningSession = {
    async resolveLearner(headers: Headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      if (session.user.status !== "active") return { kind: "inactive" as const }
      return {
        kind: "active" as const,
        learnerId: learnerIdSchema.parse(session.user.id),
      }
    },
  }

  return {
    aiFeedbackRoutes: createAiFeedbackRoutes({
      command: {
        async requestFeedback() {
          throw new Error("Unexpected test dependency call: AI feedback")
        },
      },
      session: learningSession,
    }),
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
    learningRoutes: createLearningRoutes({
      application,
      cursor: createLearnerCursorCodec(
        "test-cursor-signing-secret-with-32-bytes"
      ),
      queries,
      session: learningSession,
    }),
    sessionResolver,
  }
}

function createTestSessionResolver(): SessionResolver {
  return {
    async resolveSession(headers) {
      return readTestSessionToken(headers) === "active-token"
        ? activeSession
        : null
    },
  }
}

function readTestSessionToken(headers: Headers): string | null {
  const token = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === learnerSessionCookieName)?.[1]
  return token === undefined ? null : decodeURIComponent(token)
}
