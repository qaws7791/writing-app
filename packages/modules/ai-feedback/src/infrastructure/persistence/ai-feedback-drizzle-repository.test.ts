import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  createInMemoryWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { ok } from "@workspace/kernel/result"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"

import { createAiFeedbackApplication } from "#ai-feedback/application/ai-feedback-application"
import { createAiFeedbackAttemptId } from "#ai-feedback/domain/ai-feedback-attempt"
import { createDrizzleAiFeedbackRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-drizzle-repository"
import { aiFeedbackAttempts } from "#ai-feedback/infrastructure/persistence/schema"

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
  showScore: true,
  stepId: lessonStepIdSchema.parse("step-2"),
}
const providerResponse = {
  improvements: ["근거를 보강하세요."],
  nextAction: "예시를 추가하세요.",
  score: 80,
  strengths: ["주장이 명확합니다."],
  summary: "좋은 초안입니다.",
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
          async createFeedback() {
            providerCalls += 1
            return ok(providerResponse)
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
          status: "succeeded",
          stepId: "step-2",
          userId: "learner-1",
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
        occurredAt: now,
      })

      for (const attemptNumber of [1, 2, 3]) {
        const reserved = await repository.reserveAttempt({
          ...scope(),
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
          feedback: {
            ...providerResponse,
            scoreRange: [0, 100],
            showScore: true,
          },
          occurredAt: now,
        })
      }

      await expect(
        repository.reserveAttempt({
          ...scope(),
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
          async createFeedback() {
            observer.sqlite.exec("BEGIN IMMEDIATE")
            try {
              lockAcquired = true
              return ok(providerResponse)
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
    ) VALUES ('learner-1', '학습자', 'learner-1@example.test', 1, NULL, 1, 1);
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
