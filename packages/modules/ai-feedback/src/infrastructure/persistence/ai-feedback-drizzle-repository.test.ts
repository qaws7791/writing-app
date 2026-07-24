import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  createInMemoryWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { err, ok } from "@workspace/kernel/result"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"

import { createAiFeedbackApplication } from "#ai-feedback/application/ai-feedback-application"
import { createAiFeedbackMaintenance } from "#ai-feedback/application/ai-feedback-maintenance"
import { createAiFeedbackAttemptId } from "#ai-feedback/domain/ai-feedback-attempt"
import {
  createAsiaSeoulQuotaWindow,
  defaultAiFeedbackDailyQuotaPolicy,
  type AiFeedbackDailyQuotaPolicy,
} from "#ai-feedback/domain/ai-feedback-quota"
import { createDrizzleAiFeedbackRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-drizzle-repository"
import { createDrizzleAiFeedbackMaintenanceRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-maintenance-drizzle-repository"
import {
  aiFeedbackAttempts,
  aiFeedbackGlobalDailyCounters,
  aiFeedbackUserDailyCounters,
} from "#ai-feedback/infrastructure/persistence/schema"

const now = new Date("2026-07-23T01:00:00.000Z")
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
  it("다른 module row를 조회하지 않고 branded scope로 예약·완료·멱등 재생한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      let providerCalls = 0
      const application = createAiFeedbackApplication({
        attemptIdGenerator: {
          next: () => createAiFeedbackAttemptId("attempt-1"),
        },
        clock: { now: () => now },
        provider: {
          ...providerIdentity,
          async createFeedback() {
            providerCalls += 1
            return ok(providerSuccess)
          },
        },
        repository: createDrizzleAiFeedbackRepository(client.db),
        timeoutSignalFactory: {
          create: () => new AbortController().signal,
        },
      })

      const first = await application.requestFeedback(input)
      const replay = await application.requestFeedback(input)

      expect(first.isOk()).toBe(true)
      expect(replay).toEqual(first)
      expect(providerCalls).toBe(1)
      expect(client.db.select().from(aiFeedbackAttempts).all()).toEqual([
        expect.objectContaining({
          courseId: "course-1",
          curriculumVersionId: "version-1",
          lessonId: "lesson-1",
          inputTokenCount: 12,
          model: "gpt-test",
          outputTokenCount: 7,
          promptPolicyVersion: "writing-coach-v1",
          quotaDate: "2026-07-23",
          status: "succeeded",
          stepId: "step-2",
          userId: "learner-1",
        }),
      ])
      expect(
        client.db.select().from(aiFeedbackUserDailyCounters).all()
      ).toEqual([
        expect.objectContaining({
          quotaDate: "2026-07-23",
          requestCount: 1,
          successCount: 1,
          userId: "learner-1",
        }),
      ])
      expect(
        client.db.select().from(aiFeedbackGlobalDailyCounters).all()
      ).toEqual([
        expect.objectContaining({
          quotaDate: "2026-07-23",
          requestCount: 1,
          successCount: 1,
        }),
      ])
    } finally {
      client.close()
    }
  })

  it("pending lease가 있으면 남은 TTL을 Retry-After 초 단위로 반환한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      const repository = createDrizzleAiFeedbackRepository(client.db)
      const reservation = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("attempt-1"),
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60_000),
        idempotencyKey: "first",
        maxCompletedAttempts: 3,
      })
      expect(reservation.isOk()).toBe(true)

      const blocked = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(new Date(now.getTime() + 1_500)),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("attempt-2"),
        createdAt: new Date(now.getTime() + 1_500),
        expiresAt: new Date(now.getTime() + 61_500),
        idempotencyKey: "second",
        maxCompletedAttempts: 3,
      })

      expect(blocked).toEqual(
        ok({
          completedAttempts: 0,
          expiredAttempts: [],
          kind: "in-progress",
          retryAfterSeconds: 59,
        })
      )
    } finally {
      client.close()
    }
  })

  it("succeeded attempt만 quota를 차감하고 한도 뒤 새 예약을 거절한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      const repository = createDrizzleAiFeedbackRepository(client.db)

      const failed = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("attempt-failed"),
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60_000),
        idempotencyKey: "failed",
        maxCompletedAttempts: 3,
      })
      if (failed.isErr() || failed.value.kind !== "reserved") {
        throw new Error("Failed attempt fixture was not reserved")
      }
      await repository.markAttemptFailed({
        attemptId: failed.value.attemptId,
        failureCode: "provider-unavailable",
        latencyMs: 5,
        occurredAt: now,
      })

      for (const attemptNumber of [1, 2, 3]) {
        const reserved = await repository.reserveAttempt({
          ...scope(),
          ...quotaMetadata(now),
          answer: input.answer,
          attemptId: createAiFeedbackAttemptId(`attempt-${attemptNumber}`),
          createdAt: now,
          expiresAt: new Date(now.getTime() + 60_000),
          idempotencyKey: `succeeded-${attemptNumber}`,
          maxCompletedAttempts: 3,
        })
        if (reserved.isErr() || reserved.value.kind !== "reserved") {
          throw new Error("Succeeded attempt fixture was not reserved")
        }
        await repository.markAttemptSucceeded({
          attemptId: reserved.value.attemptId,
          feedback: providerResponse,
          latencyMs: 5,
          occurredAt: now,
        })
      }

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
    } finally {
      client.close()
    }
  })

  it("동일 idempotency key 동시 요청은 provider를 한 번만 호출한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      const started = deferred<void>()
      const release = deferred<void>()
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

      const first = application.requestFeedback(input)
      await started.promise
      const duplicate = await application.requestFeedback(input)

      expect(duplicate).toEqual(
        err({
          kind: "attempt-in-progress",
          remainingAttempts: 3,
          retryAfterSeconds: 60,
        })
      )
      expect(providerCalls).toBe(1)

      release.resolve()
      expect((await first).isOk()).toBe(true)
      expect(providerCalls).toBe(1)
    } finally {
      client.close()
    }
  })

  it("실패는 request에는 남고 success에는 남지 않으며 서울 날짜가 바뀌면 다시 허용한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
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

      expect(await application.requestFeedback(input)).toEqual(
        err({ kind: "provider-unavailable", remainingAttempts: 3 })
      )
      expect(
        await application.requestFeedback({
          ...input,
          idempotencyKey: "request-2",
        })
      ).toEqual(
        err({
          kind: "daily-quota-exceeded",
          remainingAttempts: 3,
          retryAfterSeconds: 50_400,
        })
      )

      currentTime = new Date("2026-07-23T15:00:00.000Z")
      expect(
        await application.requestFeedback({
          ...input,
          idempotencyKey: "request-3",
        })
      ).toEqual(err({ kind: "provider-unavailable", remainingAttempts: 3 }))
      expect(
        client.db.select().from(aiFeedbackUserDailyCounters).all()
      ).toEqual([
        expect.objectContaining({
          quotaDate: "2026-07-23",
          requestCount: 1,
          successCount: 0,
        }),
        expect.objectContaining({
          quotaDate: "2026-07-24",
          requestCount: 1,
          successCount: 0,
        }),
      ])
    } finally {
      client.close()
    }
  })

  it("global request quota는 사용자별 quota와 독립적으로 모든 학습자에 적용한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      const repository = createDrizzleAiFeedbackRepository(client.db)
      const quotaPolicy = {
        globalDailyRequestLimit: 1,
        globalDailySuccessLimit: 1,
        userDailyRequestLimit: 5,
        userDailySuccessLimit: 5,
      } satisfies AiFeedbackDailyQuotaPolicy
      const first = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now, quotaPolicy),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("attempt-global-1"),
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60_000),
        idempotencyKey: "global-1",
        maxCompletedAttempts: 3,
      })
      if (first.isErr() || first.value.kind !== "reserved") {
        throw new Error("Global quota fixture was not reserved")
      }
      await repository.markAttemptFailed({
        attemptId: first.value.attemptId,
        failureCode: "provider-unavailable",
        latencyMs: 5,
        occurredAt: now,
      })

      const blocked = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now, quotaPolicy),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("attempt-global-2"),
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60_000),
        idempotencyKey: "global-2",
        learnerId: learnerIdSchema.parse("learner-2"),
        maxCompletedAttempts: 3,
      })

      expect(blocked).toEqual(
        ok({
          completedAttempts: 0,
          expiredAttempts: [],
          kind: "daily-quota-exceeded",
          retryAfterSeconds: 50_400,
        })
      )
    } finally {
      client.close()
    }
  })

  it("TTL이 지난 다른 scope의 pending은 global success quota를 점유하지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      const repository = createDrizzleAiFeedbackRepository(client.db)
      const quotaPolicy = {
        globalDailyRequestLimit: 5,
        globalDailySuccessLimit: 1,
        userDailyRequestLimit: 5,
        userDailySuccessLimit: 1,
      } satisfies AiFeedbackDailyQuotaPolicy
      const first = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now, quotaPolicy),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("attempt-stale-1"),
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60_000),
        idempotencyKey: "stale-1",
        maxCompletedAttempts: 3,
      })
      expect(first.isOk() && first.value.kind === "reserved").toBe(true)

      const afterTtl = new Date(now.getTime() + 60_001)
      const second = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(afterTtl, quotaPolicy),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("attempt-stale-2"),
        createdAt: afterTtl,
        expiresAt: new Date(afterTtl.getTime() + 60_000),
        idempotencyKey: "stale-2",
        learnerId: learnerIdSchema.parse("learner-2"),
        maxCompletedAttempts: 3,
      })

      expect(second.isOk() && second.value.kind === "reserved").toBe(true)
    } finally {
      client.close()
    }
  })

  it("pending 만료를 exact cutoff와 ID 순서로 한 건씩 처리하고 재실행한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      const repository = createDrizzleAiFeedbackRepository(client.db)
      const cutoff = new Date(now.getTime() + 120_000)
      const staleZ = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("maintenance-z"),
        createdAt: now,
        expiresAt: cutoff,
        idempotencyKey: "maintenance-z",
        maxCompletedAttempts: 3,
      })
      const staleA = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("maintenance-a"),
        createdAt: now,
        expiresAt: cutoff,
        idempotencyKey: "maintenance-a",
        learnerId: learnerIdSchema.parse("learner-2"),
        maxCompletedAttempts: 3,
      })
      const freshCreatedAt = new Date(now.getTime() + 121_000)
      const fresh = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(freshCreatedAt),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("maintenance-fresh"),
        createdAt: freshCreatedAt,
        expiresAt: new Date(now.getTime() + 181_000),
        idempotencyKey: "maintenance-fresh",
        learnerId: learnerIdSchema.parse("learner-3"),
        maxCompletedAttempts: 3,
      })
      expect(staleZ.isOk() && staleZ.value.kind === "reserved").toBe(true)
      expect(staleA.isOk() && staleA.value.kind === "reserved").toBe(true)
      expect(fresh.isOk() && fresh.value.kind === "reserved").toBe(true)

      const maintenance = createAiFeedbackMaintenance({
        clock: { now: () => cutoff },
        repository: createDrizzleAiFeedbackMaintenanceRepository(client.db),
      })
      await expect(
        maintenance.expireStalePending({ batchSize: 1, dryRun: true })
      ).resolves.toEqual(ok({ cutoff, expiredAttempts: 0, matchedAttempts: 1 }))
      await expect(
        maintenance.expireStalePending({ batchSize: 1 })
      ).resolves.toEqual(ok({ cutoff, expiredAttempts: 1, matchedAttempts: 1 }))
      await expect(
        maintenance.expireStalePending({ batchSize: 1 })
      ).resolves.toEqual(ok({ cutoff, expiredAttempts: 1, matchedAttempts: 1 }))
      await expect(
        maintenance.expireStalePending({ batchSize: 1 })
      ).resolves.toEqual(ok({ cutoff, expiredAttempts: 0, matchedAttempts: 0 }))
      expect(
        client.db
          .select({
            failureCode: aiFeedbackAttempts.failureCode,
            id: aiFeedbackAttempts.id,
            status: aiFeedbackAttempts.status,
          })
          .from(aiFeedbackAttempts)
          .all()
      ).toEqual(
        expect.arrayContaining([
          {
            failureCode: "pending-expired",
            id: "maintenance-a",
            status: "expired",
          },
          {
            failureCode: "pending-expired",
            id: "maintenance-z",
            status: "expired",
          },
          {
            failureCode: null,
            id: "maintenance-fresh",
            status: "pending",
          },
        ])
      )
    } finally {
      client.close()
    }
  })

  it("provider 완료와 maintenance 만료가 경쟁해도 먼저 확정된 상태를 덮어쓰지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      const repository = createDrizzleAiFeedbackRepository(client.db)
      const cutoff = new Date(now.getTime() + 60_000)
      const succeeded = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("race-succeeded"),
        createdAt: now,
        expiresAt: cutoff,
        idempotencyKey: "race-succeeded",
        maxCompletedAttempts: 3,
      })
      const expired = await repository.reserveAttempt({
        ...scope(),
        ...quotaMetadata(now),
        answer: input.answer,
        attemptId: createAiFeedbackAttemptId("race-expired"),
        createdAt: now,
        expiresAt: cutoff,
        idempotencyKey: "race-expired",
        learnerId: learnerIdSchema.parse("learner-2"),
        maxCompletedAttempts: 3,
      })
      if (
        succeeded.isErr() ||
        succeeded.value.kind !== "reserved" ||
        expired.isErr() ||
        expired.value.kind !== "reserved"
      ) {
        throw new Error("Race fixture was not reserved")
      }
      await repository.markAttemptSucceeded({
        attemptId: succeeded.value.attemptId,
        feedback: providerResponse,
        latencyMs: 50,
        occurredAt: cutoff,
      })

      const maintenance = createAiFeedbackMaintenance({
        clock: { now: () => cutoff },
        repository: createDrizzleAiFeedbackMaintenanceRepository(client.db),
      })
      await expect(
        maintenance.expireStalePending({ batchSize: 10 })
      ).resolves.toEqual(ok({ cutoff, expiredAttempts: 1, matchedAttempts: 1 }))
      await expect(
        repository.markAttemptSucceeded({
          attemptId: expired.value.attemptId,
          feedback: providerResponse,
          latencyMs: 70,
          occurredAt: new Date(cutoff.getTime() + 10),
        })
      ).resolves.toEqual(ok({ kind: "not-pending" }))
      expect(
        client.db
          .select({
            id: aiFeedbackAttempts.id,
            status: aiFeedbackAttempts.status,
          })
          .from(aiFeedbackAttempts)
          .all()
      ).toEqual(
        expect.arrayContaining([
          { id: "race-expired", status: "expired" },
          { id: "race-succeeded", status: "succeeded" },
        ])
      )
    } finally {
      client.close()
    }
  })

  it("느린 provider 호출 중에는 SQLite write transaction을 열어 두지 않는다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ai-feedback-p6-"))
    const databasePath = join(directory, "feedback.sqlite")
    const client = createWritingAppDatabase(databasePath)
    const observer = createWritingAppDatabase(databasePath)
    try {
      prepareAiFeedbackDatabase(client.sqlite)
      observer.sqlite.exec("PRAGMA busy_timeout = 50")
      let lockAcquired = false
      const application = createAiFeedbackApplication({
        attemptIdGenerator: {
          next: () => createAiFeedbackAttemptId("attempt-lock"),
        },
        clock: { now: () => now },
        provider: {
          ...providerIdentity,
          async createFeedback() {
            observer.sqlite.exec("BEGIN IMMEDIATE")
            try {
              lockAcquired = true
              return ok(providerSuccess)
            } finally {
              observer.sqlite.exec("ROLLBACK")
            }
          },
        },
        repository: createDrizzleAiFeedbackRepository(client.db),
        timeoutSignalFactory: {
          create: () => new AbortController().signal,
        },
      })

      expect((await application.requestFeedback(input)).isOk()).toBe(true)
      expect(lockAcquired).toBe(true)
    } finally {
      observer.close()
      client.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })
})

function prepareAiFeedbackDatabase(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  runCurrentTestMigration(sqlite)
  sqlite.exec(`
    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES
      ('learner-1', '학습자', 'learner-1@example.test', 1, NULL, 1, 1),
      ('learner-2', '학습자 2', 'learner-2@example.test', 1, NULL, 1, 1),
      ('learner-3', '학습자 3', 'learner-3@example.test', 1, NULL, 1, 1);
    INSERT INTO courses (
      id, status, sort_order, published_curriculum_version_id, created_at
    ) VALUES ('course-1', 'active', 1, NULL, 1);
    INSERT INTO course_curriculum_versions (
      id, course_id, revision, edit_version, status, title, description,
      category, visual_key, created_at, updated_at, published_at
    ) VALUES (
      'version-1', 'course-1', 1, 0, 'draft', '코스', '설명',
      '기초', 'basic-sentence-writing', 1, 1, NULL
    );
    INSERT INTO course_unit_versions (
      curriculum_version_id, id, title, status, sort_order
    ) VALUES ('version-1', 'unit-1', '단원', 'active', 1);
    INSERT INTO lesson_versions (
      curriculum_version_id, id, unit_id, title, description, category,
      summary_json, estimated_minutes, status, sort_order
    ) VALUES (
      'version-1', 'lesson-1', 'unit-1', '레슨', NULL, NULL,
      '[]', 5, 'active', 1
    );
    INSERT INTO lesson_step_versions (
      curriculum_version_id, id, lesson_id, type, content_json, status, sort_order
    ) VALUES (
      'version-1', 'step-2', 'lesson-1', 'AI_FEEDBACK', '{}', 'active', 1
    );
    UPDATE course_curriculum_versions
    SET status = 'published', published_at = 1
    WHERE id = 'version-1';
    UPDATE courses
    SET published_curriculum_version_id = 'version-1'
    WHERE id = 'course-1';
  `)
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

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}
