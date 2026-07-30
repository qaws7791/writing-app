import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  learnerCourseDetailSchema,
  learnerCoursePageSchema,
  learnerLessonSchema,
  learnerProgressPageSchema,
} from "@workspace/contracts/learning/learner-content"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type { SessionResolver } from "@workspace/identity/ports"
import type { LearningApplication } from "@workspace/learning/ports"
import { createLearnerCursorCodec } from "@workspace/learning/http"
import { err, ok } from "@workspace/kernel/result"

import { registerLearnerContractRoutes } from "@/composition/create-app"
import { createLearnerApp, type ApiDependencies } from "@/http/learner-app"
import { registerAuthProxy } from "@/http/auth-proxy"
import { registerLearnerApiDocumentation } from "@/http/openapi"

type LearnerProfileStats = Readonly<{
  completedLessons: number
  currentStreakDays: number
  lastActiveDate: string | null
  progressPercent: number
  totalLessons: number
}>

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
      cover: null,
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
  drafts: [],
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
const defaultProfileStats: LearnerProfileStats = {
  completedLessons: 1,
  currentStreakDays: 2,
  lastActiveDate: "2026-06-14",
  progressPercent: 33,
  totalLessons: 3,
}

export function createTestLearnerApp(
  input: {
    readonly authHandler?: (request: Request) => Promise<Response>
    readonly health?: { readonly isDatabaseReady: () => boolean }
    readonly profileStats?: LearnerProfileStats
    readonly runtime?: ApiDependencies
    readonly sessionResolver?: SessionResolver
    readonly submitStep?: LearningApplication["submitStep"]
  } = {}
) {
  const sessionResolver = input.sessionResolver ?? createTestSessionResolver()
  const learningSession = createLearningSession(sessionResolver)
  const profileStats = input.profileStats ?? defaultProfileStats
  const app = createLearnerApp(input.runtime ?? {})

  registerLearnerContractRoutes(app, {
    health: input.health ?? { isDatabaseReady: () => true },
    identity: {
      application: {
        async changeLearnerDisplayName(command) {
          return ok({
            deletedAt: null,
            displayName: command.displayName.trim(),
            status: "active",
            userId: command.userId,
          })
        },
      },
      profileStatsQuery: {
        async readProfileStats() {
          return profileStats
        },
      },
      sessionResolver,
    },
    learning: {
      application: createTestLearningApplication(input.submitStep),
      cursor: createLearnerCursorCodec(
        "test-cursor-signing-secret-with-32-bytes"
      ),
      session: learningSession,
    },
  })
  registerAuthProxy(app, input.authHandler)
  registerLearnerApiDocumentation(app, { enabled: true })

  return app
}

function createTestLearningApplication(
  submitStep: LearningApplication["submitStep"] | undefined
): LearningApplication {
  return {
    async readCourseCatalog() {
      return { items: coursePage.items, nextPosition: null }
    },
    async readCourseCategories() {
      return ["입문자를 위한 코스"]
    },
    async readCourseDetail({ courseId }) {
      return courseId === "c1"
        ? ok(courseDetail)
        : err({ kind: "course-not-found" })
    },
    async readLearnerHome() {
      return { items: progressPage.items, nextPosition: null }
    },
    async readLesson({ lessonId }) {
      return lessonId === "l1" ? ok(lesson) : err({ kind: "lesson-not-found" })
    },
    requestAiFeedback: async () =>
      err({ kind: "provider-unavailable", remainingAttempts: 1 }),
    saveStepDraft: async () => {
      throw new Error("Unexpected test fixture call: saveStepDraft")
    },
    startLesson: async () => {
      throw new Error("Unexpected test fixture call: startLesson")
    },
    submitStep:
      submitStep ??
      (async () => {
        throw new Error("Unexpected test fixture call: submitStep")
      }),
  }
}

function createLearningSession(sessionResolver: SessionResolver) {
  return {
    async resolveLearner(headers: Headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      const learnerId = learnerIdSchema.parse(session.user.id)
      return session.user.status === "active"
        ? { kind: "active" as const, learnerId }
        : { kind: "inactive" as const, learnerId }
    },
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
