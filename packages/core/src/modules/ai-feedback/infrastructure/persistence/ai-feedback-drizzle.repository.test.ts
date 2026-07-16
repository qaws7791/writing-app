import { describe, expect, it } from "vitest"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "#core/modules/content/domain/content.ids"
import { learnerIdSchema } from "#core/modules/learning/domain/learning.ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { createDrizzleAiFeedbackRepository } from "#core/modules/ai-feedback/infrastructure/persistence/ai-feedback-drizzle.repository"
import { createAiFeedbackAttemptCoordinator } from "#core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { defaultAiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import {
  aiFeedbackAttempts,
  authUsers,
  learnerCourseProgress,
} from "@workspace/db/schema"
import { createCurriculumVersionId } from "@workspace/db/content/curriculum-version-id"
import type { ContentSeedRows } from "@workspace/db/seeds/seed-content"
import { upsertContentSeedRows } from "@workspace/db/seeds/seed"
import { err, ok } from "#core/shared/result"
import type { AiFeedbackPayload } from "#core/modules/ai-feedback/domain/ai-feedback.dto"
import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"

const now = new Date("2026-06-14T10:30:00.000Z")
const learnerId = learnerIdSchema.parse("user-1")
const lessonId = lessonIdSchema.parse("l-ai")
const stepId = lessonStepIdSchema.parse("l-ai-s2")
let attemptSequence = 0

describe("AI 피드백 repository", () => {
  it("SQLite transaction의 50개 동시 요청에서도 provider 호출을 하나의 in-flight 예약으로 제한한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedFeedbackBaseline(client)
      const feedbackRepository = createDrizzleAiFeedbackRepository(client.db)
      let providerCalls = 0
      const coordinator = createAiFeedbackAttemptCoordinator({
        attemptPolicy: defaultAiFeedbackAttemptPolicy,
        createAttemptId: createSequence("parallel"),
        feedbackRepository,
        provider: {
          async createFeedback() {
            providerCalls += 1
            await Promise.resolve()
            return ok(feedbackPayload)
          },
        },
      })

      await Promise.all(
        Array.from({ length: 50 }, (_, index) =>
          coordinator.createAttempt(command(`parallel-${index}`), context)
        )
      )

      expect(providerCalls).toBe(1)
      expect(
        client.db
          .select()
          .from(aiFeedbackAttempts)
          .all()
          .filter((attempt) => attempt.status === "succeeded")
      ).toHaveLength(1)
    } finally {
      client.close()
    }
  })

  it("동일 idempotency key의 성공 재시도는 저장 결과를 재사용하고 provider를 중복 호출하지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedFeedbackBaseline(client)
      let providerCalls = 0
      const coordinator = createCoordinator(client, {
        onProviderCall() {
          providerCalls += 1
        },
      })

      const first = await coordinator.createAttempt(
        command("same-key"),
        context
      )
      const retried = await coordinator.createAttempt(
        command("same-key"),
        context
      )

      expect(retried).toEqual(first)
      expect(providerCalls).toBe(1)
      expect(client.db.select().from(aiFeedbackAttempts).all()).toHaveLength(1)
    } finally {
      client.close()
    }
  })

  it("provider 실패를 failed로 전이해 slot을 즉시 반환한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedFeedbackBaseline(client)
      const failedCoordinator = createCoordinator(client, {
        providerResult: err({ kind: "provider-unavailable" }),
      })

      await expect(
        failedCoordinator.createAttempt(command("failed-key"), context)
      ).resolves.toMatchObject({ kind: "err" })

      await expect(
        createCoordinator(client).createAttempt(command("new-key"), context)
      ).resolves.toMatchObject({
        kind: "ok",
        value: { remainingAttempts: 2 },
      })

      expect(
        client.db
          .select({
            attemptNumber: aiFeedbackAttempts.attemptNumber,
            status: aiFeedbackAttempts.status,
          })
          .from(aiFeedbackAttempts)
          .all()
      ).toEqual([
        { attemptNumber: 1, status: "failed" },
        { attemptNumber: 1, status: "succeeded" },
      ])
    } finally {
      client.close()
    }
  })

  it("성공 attempt 3회 이후에는 새 provider 호출을 거절한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedFeedbackBaseline(client)
      let providerCalls = 0
      const coordinator = createCoordinator(client, {
        onProviderCall() {
          providerCalls += 1
        },
      })

      for (const key of ["first", "second", "third"]) {
        await expect(
          coordinator.createAttempt(command(key), context)
        ).resolves.toMatchObject({ kind: "ok" })
      }
      await expect(
        coordinator.createAttempt(command("fourth"), context)
      ).resolves.toEqual({
        error: { kind: "attempt-limit-exceeded", remainingAttempts: 0 },
        kind: "err",
      })

      expect(providerCalls).toBe(3)
    } finally {
      client.close()
    }
  })

  it("만료된 pending attempt를 expired로 전이하고 같은 slot을 다시 예약한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedFeedbackBaseline(client)
      const repository = createDrizzleAiFeedbackRepository(client.db)
      await repository.reserveAttempt({
        ...command("stale"),
        attemptId: "attempt-stale",
        expiresAt: new Date(now.getTime() + 100),
        maxCompletedAttempts: 3,
      })

      const reservation = await repository.reserveAttempt({
        ...command("replacement", new Date(now.getTime() + 101)),
        attemptId: "attempt-replacement",
        expiresAt: new Date(now.getTime() + 201),
        maxCompletedAttempts: 3,
      })

      expect(reservation).toMatchObject({
        attemptNumber: 1,
        expiredAttempts: [{ attemptId: "attempt-stale", attemptNumber: 1 }],
        kind: "reserved",
      })
      expect(
        client.db
          .select({ status: aiFeedbackAttempts.status })
          .from(aiFeedbackAttempts)
          .all()
      ).toEqual([{ status: "expired" }, { status: "pending" }])
    } finally {
      client.close()
    }
  })

  it("attempt를 학습자에게 고정된 커리큘럼 버전 범위로 저장한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedFeedbackBaseline(client)
      await createCoordinator(client).createAttempt(
        command("versioned"),
        context
      )

      expect(client.db.select().from(aiFeedbackAttempts).all()).toEqual([
        expect.objectContaining({
          courseId: "c-ai",
          curriculumVersionId: createCurriculumVersionId("c-ai", 1),
          attemptNumber: 1,
          resultJson: JSON.stringify(feedbackPayload),
          status: "succeeded",
        }),
      ])
    } finally {
      client.close()
    }
  })
})

const context = { focus: "명확성", lessonTitle: "AI 피드백 레슨" }
const feedbackPayload: AiFeedbackPayload = {
  improvements: ["근거를 더 붙이세요."],
  nextAction: "예시 한 문장을 추가하세요.",
  score: 84,
  scoreRange: [0, 100],
  showScore: true,
  strengths: ["핵심 문장이 앞에 있습니다."],
  summary: "의도가 분명합니다.",
}

function command(idempotencyKey: string, occurredAt = now) {
  return {
    answer: "문장을 명확하게 고쳤습니다.",
    idempotencyKey,
    lessonId,
    occurredAt,
    stepId,
    userId: learnerId,
  }
}

function createCoordinator(
  client: WritingAppDatabaseClient,
  options: {
    readonly onProviderCall?: () => void
    readonly providerResult?: Awaited<
      ReturnType<AiFeedbackProvider["createFeedback"]>
    >
  } = {}
) {
  return createAiFeedbackAttemptCoordinator({
    attemptPolicy: defaultAiFeedbackAttemptPolicy,
    createAttemptId: () => `attempt-${++attemptSequence}`,
    feedbackRepository: createDrizzleAiFeedbackRepository(client.db),
    provider: {
      async createFeedback() {
        options.onProviderCall?.()
        return options.providerResult ?? ok(feedbackPayload)
      },
    },
  })
}

function createSequence(prefix: string): () => string {
  let sequence = 0
  return () => `${prefix}-${++sequence}`
}

function seedFeedbackBaseline(client: WritingAppDatabaseClient): void {
  runBaselineMigration(client.sqlite)
  client.db
    .insert(authUsers)
    .values({
      createdAt: now,
      email: "learner@example.com",
      emailVerified: true,
      id: "user-1",
      image: null,
      name: "학습자",
      updatedAt: now,
    })
    .run()
  const rows: ContentSeedRows = {
    courses: [
      {
        category: "입문자를 위한 코스",
        description: "매일 조금씩 씁니다.",
        id: "c-ai",
        sortOrder: 1,
        status: "active",
        title: "AI 코칭 코스",
        visualKey: "basic-sentence-writing",
      },
    ],
    lessons: [
      {
        category: "문장",
        courseId: "c-ai",
        description: "AI 피드백을 받습니다.",
        estimatedMinutes: 5,
        id: "l-ai",
        sortOrder: 1,
        status: "active",
        summaryJson: JSON.stringify(["AI 피드백"]),
        title: "AI 피드백 레슨",
        unitId: "u-ai",
      },
    ],
    steps: [
      {
        contentJson: JSON.stringify({ min: 1, prompt: "문장을 쓰세요." }),
        id: "l-ai-s1",
        lessonId: "l-ai",
        sortOrder: 1,
        status: "active",
        type: "WRITE",
      },
      {
        contentJson: JSON.stringify({
          allowRetry: true,
          feedback: "기본 피드백",
          focus: "명확성",
          score: 80,
          scoreMax: 100,
          showScore: true,
          target: "l-ai-s1",
        }),
        id: "l-ai-s2",
        lessonId: "l-ai",
        sortOrder: 2,
        status: "active",
        type: "AI_FEEDBACK",
      },
    ],
    units: [
      {
        courseId: "c-ai",
        id: "u-ai",
        sortOrder: 1,
        status: "active",
        title: "AI 코칭 유닛",
      },
    ],
  }
  client.db.transaction((transaction) => {
    upsertContentSeedRows(transaction, rows)
  })
  const curriculumVersionId = createCurriculumVersionId("c-ai", 1)
  client.db
    .insert(learnerCourseProgress)
    .values({
      courseId: "c-ai",
      curriculumVersionId,
      lastActivityAt: now,
      startedAt: now,
      status: "in_progress",
      updatedAt: now,
      userId: "user-1",
    })
    .run()
}
