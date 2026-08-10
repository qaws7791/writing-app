import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { aLearner } from "@workspace/identity/test-fixtures"
import { err, ok, type Result } from "@workspace/kernel/result"

import { createAiFeedbackApplication } from "#ai-feedback/application/ai-feedback-application"
import { createAiFeedbackAttemptId } from "#ai-feedback/domain/ai-feedback-attempt"
import {
  createAsiaSeoulQuotaWindow,
  defaultAiFeedbackDailyQuotaPolicy,
  type AiFeedbackDailyQuotaPolicy,
} from "#ai-feedback/domain/ai-feedback-quota"
import { createDrizzleAiFeedbackRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-drizzle-repository"
import { aiFeedbackUserDailyCounters } from "#ai-feedback/infrastructure/persistence/schema"

type InMemoryDatabaseClient = ReturnType<
  typeof createInMemoryWritingAppDatabase
>
type AiFeedbackRepository = ReturnType<typeof createDrizzleAiFeedbackRepository>

const now = new Date("2026-07-23T01:00:00.000Z")
const nextSeoulDate = new Date("2026-07-23T15:00:00.000Z")
const input = {
  answer: "학습자가 저장한 답변",
  courseId: courseIdSchema.parse("course-1"),
  curriculumVersionId: curriculumVersionIdSchema.parse("version-1"),
  focus: "명확성",
  idempotencyKey: "request-1",
  learnerId: learnerIdSchema.parse("learner-1"),
  lessonId: lessonIdSchema.parse("lesson-1"),
  lessonTitle: "좋은 문장",
  stepId: lessonStepIdSchema.parse("step-2"),
}
const providerResponse = {
  improvements: ["근거를 보강하세요."],
  nextAction: "예시를 추가하세요.",
  strengths: ["주장이 명확합니다."],
  summary: "좋은 초안입니다.",
} as const
const providerSuccess = {
  feedback: providerResponse,
  usage: { inputTokens: 12, outputTokens: 7 },
} as const
const providerIdentity = {
  model: "gpt-test",
  provider: "openai",
} as const

describe("AI feedback Drizzle repository", () => {
  it("동일 idempotency key는 pending 중 중복 실행을 막고 성공 뒤 결과를 재생한다", async () => {
    await withAiFeedbackDatabase(async (client) => {
      const started = deferred()
      const release = deferred()
      let attemptSequence = 0
      let providerCalls = 0
      const application = createAiFeedbackApplication({
        attemptIdGenerator: {
          next: () => createAiFeedbackAttemptId(`attempt-${++attemptSequence}`),
        },
        clock: { now: () => now },
        provider: {
          ...providerIdentity,
          async createFeedback() {
            providerCalls += 1
            started.resolve()
            await release.promise
            return ok(providerSuccess)
          },
        },
        repository: createDrizzleAiFeedbackRepository(client.db),
        timeoutSignalFactory: {
          create: () => new AbortController().signal,
        },
      })

      const pendingFirstRequest = application.requestFeedback(input)
      await started.promise
      const duplicateWhilePending = await application.requestFeedback(input)
      release.resolve()
      const first = await pendingFirstRequest
      const replay = await application.requestFeedback(input)

      expect({ duplicateWhilePending, first, providerCalls, replay }).toEqual({
        duplicateWhilePending: err({
          kind: "attempt-in-progress",
          remainingAttempts: 3,
          retryAfterSeconds: 60,
        }),
        first: ok({ ...providerResponse, remainingAttempts: 2 }),
        providerCalls: 1,
        replay: ok({ ...providerResponse, remainingAttempts: 2 }),
      })
    })
  })

  it("실패 attempt는 성공 한도를 차감하지 않고 세 번째 성공 뒤 새 예약을 거절한다", async () => {
    await withAiFeedbackDatabase(async (client) => {
      const repository = createDrizzleAiFeedbackRepository(client.db)
      await failAttempt(repository, "attempt-failed", "failed")
      await succeedAttempt(repository, "attempt-1", "succeeded-1")
      await succeedAttempt(repository, "attempt-2", "succeeded-2")
      await succeedAttempt(repository, "attempt-3", "succeeded-3")

      await expect(
        repository.reserveAttempt({
          ...scope(),
          ...quotaMetadata(now),
          answer: input.answer,
          attemptId: createAiFeedbackAttemptId("attempt-4"),
          createdAt: now,
          expiresAt: new Date(now.getTime() + 60_000),
          idempotencyKey: "over-limit",
          maxCompletedAttempts: 3,
        })
      ).resolves.toEqual(
        ok({
          completedAttempts: 3,
          expiredAttempts: [],
          kind: "limit-exceeded",
        })
      )
    })
  })

  it("실패도 서울 날짜별 request quota에 남고 다음 서울 날짜에 다시 허용한다", async () => {
    await withAiFeedbackDatabase(async (client) => {
      let attemptSequence = 0
      let currentTime = now
      const application = createAiFeedbackApplication({
        attemptIdGenerator: {
          next: () => createAiFeedbackAttemptId(`attempt-${++attemptSequence}`),
        },
        clock: { now: () => currentTime },
        dailyQuotaPolicy: {
          ...defaultAiFeedbackDailyQuotaPolicy,
          userDailyRequestLimit: 1,
          userDailySuccessLimit: 1,
        },
        provider: {
          ...providerIdentity,
          async createFeedback() {
            return err({ kind: "provider-unavailable" })
          },
        },
        repository: createDrizzleAiFeedbackRepository(client.db),
        timeoutSignalFactory: {
          create: () => new AbortController().signal,
        },
      })

      const firstFailure = await application.requestFeedback(input)
      const blockedSameDay = await application.requestFeedback({
        ...input,
        idempotencyKey: "request-2",
      })
      currentTime = nextSeoulDate
      const nextDayFailure = await application.requestFeedback({
        ...input,
        idempotencyKey: "request-3",
      })
      const counters = client.db
        .select({
          quotaDate: aiFeedbackUserDailyCounters.quotaDate,
          requestCount: aiFeedbackUserDailyCounters.requestCount,
          successCount: aiFeedbackUserDailyCounters.successCount,
        })
        .from(aiFeedbackUserDailyCounters)
        .orderBy(aiFeedbackUserDailyCounters.quotaDate)
        .all()

      expect({
        blockedSameDay,
        counters,
        firstFailure,
        nextDayFailure,
      }).toEqual({
        blockedSameDay: err({
          kind: "daily-quota-exceeded",
          remainingAttempts: 3,
          retryAfterSeconds: 50_400,
        }),
        counters: [
          { quotaDate: "2026-07-23", requestCount: 1, successCount: 0 },
          { quotaDate: "2026-07-24", requestCount: 1, successCount: 0 },
        ],
        firstFailure: err({
          kind: "provider-unavailable",
          remainingAttempts: 3,
        }),
        nextDayFailure: err({
          kind: "provider-unavailable",
          remainingAttempts: 3,
        }),
      })
    })
  })
})

async function withAiFeedbackDatabase(
  run: (client: InMemoryDatabaseClient) => Promise<void>
): Promise<void> {
  const client = createInMemoryWritingAppDatabase()
  try {
    prepareAiFeedbackDatabase(client.sqlite)
    await run(client)
  } finally {
    client.close()
  }
}

function prepareAiFeedbackDatabase(sqlite: WritingAppSqlite): void {
  runCurrentTestMigration(sqlite)
  aLearner(sqlite, { id: "learner-1", name: "학습자" })
  aPublishedCourse(sqlite, { stepId: "step-2" })
}

async function failAttempt(
  repository: AiFeedbackRepository,
  attemptIdValue: string,
  idempotencyKey: string
): Promise<void> {
  const attemptId = createAiFeedbackAttemptId(attemptIdValue)
  unwrap(
    await repository.reserveAttempt({
      ...scope(),
      ...quotaMetadata(now),
      answer: input.answer,
      attemptId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 60_000),
      idempotencyKey,
      maxCompletedAttempts: 3,
    })
  )
  unwrap(
    await repository.markAttemptFailed({
      attemptId,
      failureCode: "provider-unavailable",
      latencyMs: 5,
      occurredAt: now,
    })
  )
}

async function succeedAttempt(
  repository: AiFeedbackRepository,
  attemptIdValue: string,
  idempotencyKey: string
): Promise<void> {
  const attemptId = createAiFeedbackAttemptId(attemptIdValue)
  unwrap(
    await repository.reserveAttempt({
      ...scope(),
      ...quotaMetadata(now),
      answer: input.answer,
      attemptId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 60_000),
      idempotencyKey,
      maxCompletedAttempts: 3,
    })
  )
  unwrap(
    await repository.markAttemptSucceeded({
      attemptId,
      feedback: providerResponse,
      latencyMs: 5,
      occurredAt: now,
    })
  )
}

function scope() {
  return {
    courseId: input.courseId,
    curriculumVersionId: input.curriculumVersionId,
    learnerId: input.learnerId,
    lessonId: input.lessonId,
    stepId: input.stepId,
  }
}

function quotaMetadata(
  createdAt: Date,
  quotaPolicy: AiFeedbackDailyQuotaPolicy = defaultAiFeedbackDailyQuotaPolicy
) {
  const quotaWindow = createAsiaSeoulQuotaWindow(createdAt)
  return {
    model: providerIdentity.model,
    promptPolicyVersion: "writing-coach-v1",
    quotaDate: quotaWindow.date,
    quotaPolicy,
    quotaRetryAfterSeconds: quotaWindow.retryAfterSeconds,
  }
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function unwrap<T, E>(result: Result<T, E>): T {
  return result.match(
    (value) => value,
    () => {
      throw new Error("Fixture operation failed")
    }
  )
}
