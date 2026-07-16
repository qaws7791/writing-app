import { and, asc, desc, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { lessonStepDtoSchema } from "@workspace/contracts/content"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/content.ids"
import {
  completeLearnerStepBodySchema,
  curriculumVersionIdSchema,
  learnerIdSchema,
} from "@workspace/contracts/learning"
import {
  createInMemoryWritingAppDatabase,
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  authUsers,
  aiFeedbackAttempts,
  courseCurriculumVersions,
  courseUnitVersions,
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonAnswers,
  learnerLessonProgress,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"
import {
  createContentSeedRows,
  readContentSeedData,
} from "@workspace/db/seeds/seed-content"
import { upsertContentSeedRows } from "@workspace/db/seeds/seed"

import { createDrizzleLearnerTransitionRepository } from "#core/modules/learning/infrastructure/persistence/learner-transition-drizzle.repository"

const now = new Date("2026-07-17T09:00:00.000Z")
const userId = learnerIdSchema.parse("user-1")
const versionId = curriculumVersionIdSchema.parse("curriculum:c1:1")

describe("학습자 상태 전이 Drizzle repository", () => {
  it("별도 SQLite 연결의 같은 완료 요청도 한 번만 완료 집계한다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "learner-transition-cas-"))
    const databasePath = join(directory, "learning.sqlite")
    const firstClient = createWritingAppDatabase(databasePath)
    const secondClient = createWritingAppDatabase(databasePath)
    try {
      await seedLearning(firstClient)
      const firstRepository = createDrizzleLearnerTransitionRepository(
        firstClient.db
      )
      const secondRepository = createDrizzleLearnerTransitionRepository(
        secondClient.db
      )
      const command = await startFirstLesson(firstRepository)

      const results = await Promise.all([
        firstRepository.completeStep(command),
        secondRepository.completeStep(command),
      ])

      expect(results).toEqual([
        expect.objectContaining({
          kind: "ok",
          value: expect.objectContaining({ status: "lesson_completed" }),
        }),
        expect.objectContaining({
          kind: "ok",
          value: expect.objectContaining({ status: "lesson_completed" }),
        }),
      ])
      expect(
        firstClient.db
          .select({ completedLessons: learnerActivityDays.completedLessons })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, userId))
          .get()?.completedLessons
      ).toBe(1)
    } finally {
      secondClient.close()
      firstClient.close()
      Bun.gc(true)
      rmSync(directory, {
        force: true,
        maxRetries: 5,
        recursive: true,
        retryDelay: 100,
      })
    }
  })

  it("잠금과 version을 확인하고 시작 상태를 transaction으로 만든다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const repository = createDrizzleLearnerTransitionRepository(client.db)

      await expect(
        repository.startLesson({
          expectedCurriculumVersionId: versionId,
          lessonId: lessonIdSchema.parse("l-new"),
          occurredAt: now,
          userId,
        })
      ).resolves.toMatchObject({
        error: { kind: "lesson-locked" },
        kind: "err",
      })
      await expect(
        repository.completeStep({
          lessonId: lessonIdSchema.parse("l-new"),
          occurredAt: now,
          request: completeLearnerStepBodySchema.parse({
            kind: "acknowledge",
          }),
          stepId: lessonStepIdSchema.parse("l-new-s1"),
          userId,
        })
      ).resolves.toMatchObject({
        error: { kind: "lesson-locked" },
        kind: "err",
      })
      await expect(
        repository.startLesson({
          expectedCurriculumVersionId:
            curriculumVersionIdSchema.parse("c1-v999"),
          lessonId: lessonIdSchema.parse("l1"),
          occurredAt: now,
          userId,
        })
      ).resolves.toMatchObject({
        error: { kind: "curriculum-version-changed" },
        kind: "err",
      })

      const result = await repository.startLesson({
        expectedCurriculumVersionId: versionId,
        lessonId: lessonIdSchema.parse("l1"),
        occurredAt: now,
        userId,
      })

      expect(result).toMatchObject({
        kind: "ok",
        value: {
          completedSteps: 0,
          currentStepId: "l1-s1",
          status: "in_progress",
        },
      })
    } finally {
      client.close()
    }
  })

  it("오답을 저장하지 않고 정답만 한 번 저장해 정확히 한 단계 전진한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const repository = createDrizzleLearnerTransitionRepository(client.db)
      await completeFirstLesson(repository)
      const lessonId = lessonIdSchema.parse("l-new")
      const started = await repository.startLesson({
        expectedCurriculumVersionId: versionId,
        lessonId,
        occurredAt: now,
        userId,
      })
      expect(started.kind).toBe("ok")

      const steps = readInternalSteps(client, lessonId)
      const first = steps[0]
      const second = steps[1]
      expect(first?.type).toBe("MATCH")
      if (first?.type !== "MATCH" || second === undefined) {
        throw new Error("Expected seeded MATCH lesson")
      }
      const solution = first.pairs.map((pair) => {
        if (pair.leftId === undefined || pair.rightId === undefined) {
          throw new Error("Stable pair IDs were not generated")
        }
        return { leftItemId: pair.leftId, rightItemId: pair.rightId }
      })
      const wrongPairs = solution.map((pair, index) => ({
        ...pair,
        rightItemId: solution[(index + 1) % solution.length]?.rightItemId ?? "",
      }))

      await expect(
        repository.completeStep({
          lessonId,
          occurredAt: now,
          request: completeLearnerStepBodySchema.parse({
            answer: { pairs: solution, type: "MATCH" },
            kind: "answer",
          }),
          stepId: lessonStepIdSchema.parse(second.id),
          userId,
        })
      ).resolves.toMatchObject({
        error: { kind: "step-sequence-conflict" },
        kind: "err",
      })

      const wrong = await repository.completeStep({
        lessonId,
        occurredAt: now,
        request: completeLearnerStepBodySchema.parse({
          answer: { pairs: wrongPairs, type: "MATCH" },
          kind: "answer",
        }),
        stepId: lessonStepIdSchema.parse(first.id),
        userId,
      })
      expect(wrong).toMatchObject({ kind: "ok", value: { status: "retry" } })
      expect(readAnswerCount(client, lessonId)).toBe(0)

      const command = {
        lessonId,
        occurredAt: now,
        request: completeLearnerStepBodySchema.parse({
          answer: { pairs: solution, type: "MATCH" },
          kind: "answer",
        }),
        stepId: lessonStepIdSchema.parse(first.id),
        userId,
      }
      const accepted = await repository.completeStep(command)
      const repeated = await repository.completeStep(command)

      expect(accepted).toMatchObject({
        kind: "ok",
        value: {
          learning: { currentStepId: second.id },
          status: "advanced",
        },
      })
      expect(repeated).toMatchObject({
        kind: "ok",
        value: { status: "advanced" },
      })
      expect(readAnswerCount(client, lessonId)).toBe(1)
      expect(
        client.db
          .select({ savedAnswers: learnerActivityDays.savedAnswers })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, userId))
          .get()?.savedAnswers
      ).toBe(1)
    } finally {
      client.close()
    }
  })

  it("마지막 단계 완료와 같은 요청 재시도를 중복 집계하지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const repository = createDrizzleLearnerTransitionRepository(client.db)
      const command = await startFirstLesson(repository)

      const completed = await repository.completeStep(command)
      const repeated = await repository.completeStep(command)

      expect(completed).toMatchObject({
        kind: "ok",
        value: {
          lessonCompletion: { totalSteps: 1 },
          status: "lesson_completed",
        },
      })
      expect(repeated).toMatchObject({
        kind: "ok",
        value: { status: "lesson_completed" },
      })
      expect(
        client.db
          .select({ completedLessons: learnerActivityDays.completedLessons })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, userId))
          .get()?.completedLessons
      ).toBe(1)
    } finally {
      client.close()
    }
  })

  it("AI 성공 feedback 저장과 단계 전진을 같은 transaction에서 확정한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const repository = createDrizzleLearnerTransitionRepository(client.db)
      const command = seedPendingAiFeedbackAttempt(client)

      await expect(
        repository.prepareAiFeedback(command)
      ).resolves.toMatchObject({
        kind: "ok",
        value: { answer: "학습자가 작성한 문장" },
      })
      const result = await repository.completeAiFeedbackStep(command)

      expect(result).toMatchObject({ kind: "ok" })
      expect(
        client.db
          .select({
            resultJson: aiFeedbackAttempts.resultJson,
            status: aiFeedbackAttempts.status,
          })
          .from(aiFeedbackAttempts)
          .where(eq(aiFeedbackAttempts.id, command.attemptId))
          .get()
      ).toEqual({
        resultJson: JSON.stringify(command.feedback),
        status: "succeeded",
      })
      const progress = client.db
        .select({
          currentStepId: learnerLessonProgress.currentStepId,
          status: learnerLessonProgress.status,
        })
        .from(learnerLessonProgress)
        .where(
          and(
            eq(learnerLessonProgress.userId, userId),
            eq(learnerLessonProgress.lessonId, command.lessonId)
          )
        )
        .get()
      expect(
        progress?.status === "completed" ||
          progress?.currentStepId !== command.stepId
      ).toBe(true)
    } finally {
      client.close()
    }
  })
})

async function startFirstLesson(
  repository: ReturnType<typeof createDrizzleLearnerTransitionRepository>
) {
  const lessonId = lessonIdSchema.parse("l1")
  const started = await repository.startLesson({
    expectedCurriculumVersionId: versionId,
    lessonId,
    occurredAt: now,
    userId,
  })
  if (started.kind === "err" || started.value.status !== "in_progress") {
    throw new Error("First lesson was not started")
  }
  return {
    lessonId,
    occurredAt: now,
    request: completeLearnerStepBodySchema.parse({ kind: "acknowledge" }),
    stepId: lessonStepIdSchema.parse(started.value.currentStepId),
    userId,
  }
}

async function completeFirstLesson(
  repository: ReturnType<typeof createDrizzleLearnerTransitionRepository>
) {
  const result = await repository.completeStep(
    await startFirstLesson(repository)
  )
  if (result.kind === "err" || result.value.status !== "lesson_completed") {
    throw new Error("First lesson was not completed")
  }
}

function readInternalSteps(
  client: WritingAppDatabaseClient,
  lessonId: ReturnType<typeof lessonIdSchema.parse>
) {
  return client.db
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, versionId),
        eq(lessonStepVersions.lessonId, lessonId)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()
    .map((row) => {
      const content = JSON.parse(row.contentJson) as { readonly type?: unknown }
      const { type: _type, ...fields } = content
      return lessonStepDtoSchema.parse({
        ...fields,
        id: row.id,
        sortOrder: row.sortOrder,
        type: row.type,
      })
    })
}

function readAnswerCount(
  client: WritingAppDatabaseClient,
  lessonId: ReturnType<typeof lessonIdSchema.parse>
) {
  return client.db
    .select({ stepId: learnerLessonAnswers.stepId })
    .from(learnerLessonAnswers)
    .where(
      and(
        eq(learnerLessonAnswers.userId, userId),
        eq(learnerLessonAnswers.lessonId, lessonId)
      )
    )
    .all().length
}

function seedPendingAiFeedbackAttempt(client: WritingAppDatabaseClient) {
  const aiStep = client.db
    .select()
    .from(lessonStepVersions)
    .where(eq(lessonStepVersions.type, "AI_FEEDBACK"))
    .get()
  if (aiStep === undefined) throw new Error("Seeded AI feedback step not found")
  const version = client.db
    .select({ courseId: courseCurriculumVersions.courseId })
    .from(courseCurriculumVersions)
    .where(eq(courseCurriculumVersions.id, aiStep.curriculumVersionId))
    .get()
  if (version === undefined) throw new Error("Curriculum version not found")
  const lessons = client.db
    .select({ id: lessonVersions.id })
    .from(lessonVersions)
    .innerJoin(
      courseUnitVersions,
      and(
        eq(
          courseUnitVersions.curriculumVersionId,
          lessonVersions.curriculumVersionId
        ),
        eq(courseUnitVersions.id, lessonVersions.unitId)
      )
    )
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, aiStep.curriculumVersionId),
        eq(lessonVersions.status, "active")
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder), asc(lessonVersions.sortOrder))
    .all()
  const targetIndex = lessons.findIndex(
    (lesson) => lesson.id === aiStep.lessonId
  )
  if (targetIndex < 0) throw new Error("AI feedback lesson not found")

  client.db
    .insert(learnerCourseProgress)
    .values({
      completedAt: null,
      courseId: version.courseId,
      curriculumVersionId: aiStep.curriculumVersionId,
      lastActivityAt: now,
      startedAt: now,
      status: "in_progress",
      updatedAt: now,
      userId,
    })
    .run()
  for (const lesson of lessons.slice(0, targetIndex)) {
    const lastStep = client.db
      .select({ id: lessonStepVersions.id })
      .from(lessonStepVersions)
      .where(
        and(
          eq(
            lessonStepVersions.curriculumVersionId,
            aiStep.curriculumVersionId
          ),
          eq(lessonStepVersions.lessonId, lesson.id)
        )
      )
      .orderBy(desc(lessonStepVersions.sortOrder))
      .get()
    if (lastStep === undefined) throw new Error("Prior lesson step not found")
    client.db
      .insert(learnerLessonProgress)
      .values({
        completedAt: now,
        courseId: version.courseId,
        curriculumVersionId: aiStep.curriculumVersionId,
        currentStepId: lastStep.id,
        lessonId: lesson.id,
        startedAt: now,
        status: "completed",
        updatedAt: now,
        userId,
      })
      .run()
  }
  client.db
    .insert(learnerLessonProgress)
    .values({
      completedAt: null,
      courseId: version.courseId,
      curriculumVersionId: aiStep.curriculumVersionId,
      currentStepId: aiStep.id,
      lessonId: aiStep.lessonId,
      startedAt: now,
      status: "in_progress",
      updatedAt: now,
      userId,
    })
    .run()
  const aiContent = JSON.parse(aiStep.contentJson) as {
    readonly focus?: unknown
    readonly target?: unknown
  }
  if (typeof aiContent.target !== "string") {
    throw new Error("AI feedback target not found")
  }
  client.db
    .insert(learnerLessonAnswers)
    .values({
      answerJson: JSON.stringify({
        text: "학습자가 작성한 문장",
        type: "WRITE",
      }),
      answeredAt: now,
      courseId: version.courseId,
      curriculumVersionId: aiStep.curriculumVersionId,
      lessonId: aiStep.lessonId,
      stepId: aiContent.target,
      updatedAt: now,
      userId,
    })
    .run()
  client.db
    .insert(aiFeedbackAttempts)
    .values({
      answerText: "학습자가 작성한 문장",
      attemptNumber: 1,
      courseId: version.courseId,
      createdAt: now,
      curriculumVersionId: aiStep.curriculumVersionId,
      expiresAt: new Date(now.getTime() + 60_000),
      id: "attempt-1",
      idempotencyKey: "feedback-1",
      lessonId: aiStep.lessonId,
      resultJson: null,
      status: "pending",
      stepId: aiStep.id,
      updatedAt: now,
      userId,
    })
    .run()
  return {
    attemptId: "attempt-1",
    feedback: {
      improvements: ["근거를 보강하세요."],
      nextAction: "예시를 추가하세요.",
      score: 80,
      scoreRange: [0, 100] as [number, number],
      showScore: true,
      strengths: ["주장이 명확합니다."],
      summary: "좋은 초안입니다.",
    },
    lessonId: lessonIdSchema.parse(aiStep.lessonId),
    occurredAt: now,
    stepId: lessonStepIdSchema.parse(aiStep.id),
    userId,
  }
}

async function seedLearning(client: WritingAppDatabaseClient): Promise<void> {
  runBaselineMigration(client.sqlite)
  client.db
    .insert(authUsers)
    .values({
      createdAt: now,
      email: "learner@example.com",
      emailVerified: true,
      id: userId,
      image: null,
      name: "학습자",
      updatedAt: now,
    })
    .run()
  const rows = createContentSeedRows(await readContentSeedData())
  client.db.transaction((transaction) =>
    upsertContentSeedRows(transaction, rows)
  )
}
