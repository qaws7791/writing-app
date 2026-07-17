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
  curriculumVersionIdSchema,
  learnerIdSchema,
  learnerStepSubmissionSchema,
} from "@workspace/contracts/learning/step-data"
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

import { createDrizzleLearnerTransitionRepository } from "@/adapters/learning/learner-transition-drizzle.repository"

const now = new Date("2026-07-17T09:00:00.000Z")
const userId = learnerIdSchema.parse("user-1")
const versionId = curriculumVersionIdSchema.parse("curriculum:c1:1")

describe("학습자 상태 전이 Drizzle repository", () => {
  it("별도 SQLite 연결의 같은 시작 요청을 unique conflict 뒤 같은 상태로 수렴시킨다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "learner-start-cas-"))
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
      const command = {
        expectedCurriculumVersionId: versionId,
        lessonId: lessonIdSchema.parse("l1"),
        occurredAt: now,
        userId,
      }

      const results = await Promise.all([
        firstRepository.startLesson(command),
        secondRepository.startLesson(command),
      ])

      expect(results).toEqual([
        expect.objectContaining({
          kind: "ok",
          value: expect.objectContaining({
            currentStepId: "l1-s1",
            status: "in_progress",
          }),
        }),
        expect.objectContaining({
          kind: "ok",
          value: expect.objectContaining({
            currentStepId: "l1-s1",
            status: "in_progress",
          }),
        }),
      ])
      const state = readLearnerTransitionState(firstClient)
      expect(state.courseProgress).toHaveLength(1)
      expect(state.lessonProgress).toHaveLength(1)
      expect(state.activityDays).toEqual([
        expect.objectContaining({
          completedLessons: 0,
          savedAnswers: 0,
          userId,
        }),
      ])
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

  it("시작 activity 저장이 실패하면 course와 lesson 시작을 함께 rollback한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const unchangedState = readLearnerTransitionState(client)
      client.sqlite.exec(`
        CREATE TRIGGER fail_start_activity
        BEFORE INSERT ON learner_activity_days
        BEGIN
          SELECT RAISE(ABORT, 'injected start activity failure');
        END;
      `)
      const repository = createDrizzleLearnerTransitionRepository(client.db)

      await expect(
        repository.startLesson({
          expectedCurriculumVersionId: versionId,
          lessonId: lessonIdSchema.parse("l1"),
          occurredAt: now,
          userId,
        })
      ).rejects.toThrow("injected start activity failure")
      expect(readLearnerTransitionState(client)).toEqual(unchangedState)
    } finally {
      client.close()
    }
  })

  it("시작 replay는 progress를 중복하지 않고 활동 시각만 갱신한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const repository = createDrizzleLearnerTransitionRepository(client.db)
      const command = {
        expectedCurriculumVersionId: versionId,
        lessonId: lessonIdSchema.parse("l1"),
        occurredAt: now,
        userId,
      }
      const replayedAt = new Date(now.getTime() + 60_000)

      const started = await repository.startLesson(command)
      const replayed = await repository.startLesson({
        ...command,
        occurredAt: replayedAt,
      })

      expect(replayed).toEqual(started)
      const state = readLearnerTransitionState(client)
      expect(state.courseProgress).toEqual([
        expect.objectContaining({
          lastActivityAt: replayedAt,
          startedAt: now,
          updatedAt: replayedAt,
        }),
      ])
      expect(state.lessonProgress).toEqual([
        expect.objectContaining({ startedAt: now, updatedAt: now }),
      ])
      expect(state.activityDays).toEqual([
        expect.objectContaining({
          completedLessons: 0,
          firstActivityAt: now,
          lastActivityAt: replayedAt,
          savedAnswers: 0,
        }),
      ])
    } finally {
      client.close()
    }
  })

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
          value: expect.objectContaining({ kind: "lesson-completed" }),
        }),
        expect.objectContaining({
          kind: "ok",
          value: expect.objectContaining({ kind: "lesson-completed" }),
        }),
      ])
      expect(
        firstClient.db
          .select({
            completedLessons: learnerActivityDays.completedLessons,
            savedAnswers: learnerActivityDays.savedAnswers,
          })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, userId))
          .get()
      ).toEqual({ completedLessons: 1, savedAnswers: 0 })
      expect(
        firstClient.db
          .select({ status: learnerLessonProgress.status })
          .from(learnerLessonProgress)
          .where(
            and(
              eq(learnerLessonProgress.userId, userId),
              eq(learnerLessonProgress.lessonId, command.lessonId)
            )
          )
          .all()
      ).toEqual([{ status: "completed" }])
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
      const unchangedState = readLearnerTransitionState(client)

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
          completion: { kind: "acknowledge" },
          lessonId: lessonIdSchema.parse("l-new"),
          occurredAt: now,
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
      expect(readLearnerTransitionState(client)).toEqual(unchangedState)

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
      expect(readLearnerTransitionState(client)).toMatchObject({
        activityDays: [{ completedLessons: 0, savedAnswers: 0 }],
        courseProgress: [
          {
            courseId: "c1",
            curriculumVersionId: versionId,
            status: "in_progress",
            userId,
          },
        ],
        lessonAnswers: [],
        lessonProgress: [
          {
            currentStepId: "l1-s1",
            lessonId: "l1",
            status: "in_progress",
            userId,
          },
        ],
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
      const unchangedState = readLearnerTransitionState(client)

      await expect(
        repository.completeStep({
          completion: {
            kind: "answer",
            submission: learnerStepSubmissionSchema.parse({
              pairs: solution,
              type: "MATCH",
            }),
          },
          lessonId,
          occurredAt: now,
          stepId: lessonStepIdSchema.parse(second.id),
          userId,
        })
      ).resolves.toMatchObject({
        error: { kind: "step-sequence-conflict" },
        kind: "err",
      })
      expect(readLearnerTransitionState(client)).toEqual(unchangedState)

      const wrong = await repository.completeStep({
        completion: {
          kind: "answer",
          submission: learnerStepSubmissionSchema.parse({
            pairs: wrongPairs,
            type: "MATCH",
          }),
        },
        lessonId,
        occurredAt: now,
        stepId: lessonStepIdSchema.parse(first.id),
        userId,
      })
      expect(wrong).toMatchObject({ kind: "ok", value: { kind: "retry" } })
      expect(readLearnerTransitionState(client)).toEqual(unchangedState)

      const command = {
        completion: {
          kind: "answer" as const,
          submission: learnerStepSubmissionSchema.parse({
            pairs: solution,
            type: "MATCH",
          }),
        },
        lessonId,
        occurredAt: now,
        stepId: lessonStepIdSchema.parse(first.id),
        userId,
      }
      const accepted = await repository.completeStep(command)
      const repeated = await repository.completeStep(command)

      expect(accepted).toMatchObject({
        kind: "ok",
        value: {
          kind: "advanced",
          learning: { currentStepId: second.id },
        },
      })
      expect(repeated).toMatchObject({
        kind: "ok",
        value: { kind: "advanced" },
      })
      expect(readAnswerCount(client, lessonId)).toBe(1)
      expect(
        client.db
          .select({
            currentStepId: learnerLessonProgress.currentStepId,
            status: learnerLessonProgress.status,
          })
          .from(learnerLessonProgress)
          .where(
            and(
              eq(learnerLessonProgress.userId, userId),
              eq(learnerLessonProgress.lessonId, lessonId)
            )
          )
          .get()
      ).toEqual({ currentStepId: second.id, status: "in_progress" })
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
          kind: "lesson-completed",
          lessonCompletion: { totalSteps: 1 },
        },
      })
      expect(repeated).toMatchObject({
        kind: "ok",
        value: { kind: "lesson-completed" },
      })
      expect(repeated).toEqual(completed)
      expect(completed).toMatchObject({
        kind: "ok",
        value: {
          courseLearning: {
            completedLessons: 1,
            nextLesson: { id: "l-new" },
            status: "in_progress",
          },
        },
      })
      expect(
        client.db
          .select({
            completedAt: learnerLessonProgress.completedAt,
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
      ).toEqual({ completedAt: now, status: "completed" })
      expect(
        client.db
          .select({
            completedLessons: learnerActivityDays.completedLessons,
            savedAnswers: learnerActivityDays.savedAnswers,
          })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, userId))
          .get()
      ).toEqual({ completedLessons: 1, savedAnswers: 0 })
    } finally {
      client.close()
    }
  })

  it("마지막 레슨 effect 실패는 rollback하고 재시도에서 코스와 활동을 한 번 확정한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const finalLessonId = lessonIdSchema.parse("l13")
      const fixture = seedProgressBeforeLesson(client, {
        curriculumVersionId: versionId,
        lessonId: finalLessonId,
      })
      client.db
        .insert(learnerActivityDays)
        .values({
          activityDate: "2026-07-17",
          completedLessons: fixture.precedingLessonCount,
          firstActivityAt: now,
          lastActivityAt: now,
          savedAnswers: 0,
          userId,
        })
        .run()
      const repository = createDrizzleLearnerTransitionRepository(client.db)
      await expect(
        repository.startLesson({
          expectedCurriculumVersionId: versionId,
          lessonId: finalLessonId,
          occurredAt: now,
          userId,
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { currentStepId: "l13-s1", status: "in_progress" },
      })
      await repository.completeStep({
        completion: { kind: "acknowledge" },
        lessonId: finalLessonId,
        occurredAt: now,
        stepId: lessonStepIdSchema.parse("l13-s1"),
        userId,
      })
      await repository.completeStep({
        completion: {
          kind: "answer",
          submission: learnerStepSubmissionSchema.parse({
            selectedOptionId: "b",
            type: "MULTIPLE_CHOICE",
          }),
        },
        lessonId: finalLessonId,
        occurredAt: now,
        stepId: lessonStepIdSchema.parse("l13-s2"),
        userId,
      })

      const finalCommand = {
        completion: {
          kind: "answer" as const,
          submission: learnerStepSubmissionSchema.parse({
            text: "하루 10분 글쓰기로 달라진 세 가지 경험을 정리했습니다.",
            type: "WRITE",
          }),
        },
        lessonId: finalLessonId,
        occurredAt: now,
        stepId: lessonStepIdSchema.parse("l13-s3"),
        userId,
      }
      const unchangedState = readLearnerTransitionState(client)
      client.sqlite.exec(`
        CREATE TRIGGER fail_complete_step_activity
        BEFORE UPDATE ON learner_activity_days
        BEGIN
          SELECT RAISE(ABORT, 'injected complete step activity failure');
        END;
      `)

      await expect(repository.completeStep(finalCommand)).rejects.toThrow(
        "injected complete step activity failure"
      )
      expect(readLearnerTransitionState(client)).toEqual(unchangedState)
      client.sqlite.exec("DROP TRIGGER fail_complete_step_activity")

      const completed = await repository.completeStep(finalCommand)
      const replayed = await repository.completeStep(finalCommand)

      expect(completed).toMatchObject({
        kind: "ok",
        value: {
          courseLearning: {
            completedAt: now.toISOString(),
            completedLessons: 10,
            nextLesson: null,
            progressPercent: 100,
            status: "completed",
            totalLessons: 10,
          },
          kind: "lesson-completed",
        },
      })
      expect(replayed).toMatchObject({
        kind: "ok",
        value: { evaluation: null, kind: "lesson-completed" },
      })
      expect(
        client.db
          .select({
            completedAt: learnerCourseProgress.completedAt,
            status: learnerCourseProgress.status,
          })
          .from(learnerCourseProgress)
          .where(eq(learnerCourseProgress.userId, userId))
          .get()
      ).toEqual({ completedAt: now, status: "completed" })
      expect(
        client.db
          .select({
            completedLessons: learnerActivityDays.completedLessons,
            savedAnswers: learnerActivityDays.savedAnswers,
          })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, userId))
          .get()
      ).toEqual({ completedLessons: 10, savedAnswers: 2 })
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
      const repeated = await repository.completeAiFeedbackStep(command)

      expect(result).toMatchObject({ kind: "ok" })
      expect(repeated).toEqual(result)
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
      expect(progress).toEqual({
        currentStepId: "l6-s5",
        status: "in_progress",
      })
      expect(
        client.db
          .select({
            completedLessons: learnerActivityDays.completedLessons,
            savedAnswers: learnerActivityDays.savedAnswers,
          })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, userId))
          .get()
      ).toEqual({ completedLessons: 0, savedAnswers: 0 })
    } finally {
      client.close()
    }
  })

  it("AI finalize의 학습 진행 저장이 실패하면 feedback과 진행을 함께 rollback한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    try {
      await seedLearning(client)
      const repository = createDrizzleLearnerTransitionRepository(client.db)
      const command = seedPendingAiFeedbackAttempt(client)
      const attemptBefore = readAiFeedbackAttempt(client, command.attemptId)
      const learningBefore = readLearnerTransitionState(client)
      client.sqlite.exec(`
        CREATE TRIGGER fail_ai_feedback_learning_advance
        BEFORE UPDATE ON learner_lesson_progress
        BEGIN
          SELECT RAISE(ABORT, 'injected AI finalize failure');
        END;
      `)

      await expect(repository.completeAiFeedbackStep(command)).rejects.toThrow(
        "injected AI finalize failure"
      )

      expect(readAiFeedbackAttempt(client, command.attemptId)).toEqual(
        attemptBefore
      )
      expect(readLearnerTransitionState(client)).toEqual(learningBefore)
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
    completion: { kind: "acknowledge" as const },
    lessonId,
    occurredAt: now,
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
  if (result.kind === "err" || result.value.kind !== "lesson-completed") {
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

function readLearnerTransitionState(client: WritingAppDatabaseClient) {
  return {
    activityDays: client.db.select().from(learnerActivityDays).all(),
    courseProgress: client.db.select().from(learnerCourseProgress).all(),
    lessonAnswers: client.db.select().from(learnerLessonAnswers).all(),
    lessonProgress: client.db.select().from(learnerLessonProgress).all(),
  }
}

function readAiFeedbackAttempt(
  client: WritingAppDatabaseClient,
  attemptId: string
) {
  return client.db
    .select()
    .from(aiFeedbackAttempts)
    .where(eq(aiFeedbackAttempts.id, attemptId))
    .get()
}

function seedProgressBeforeLesson(
  client: WritingAppDatabaseClient,
  input: {
    readonly curriculumVersionId: string
    readonly lessonId: string
  }
) {
  const version = client.db
    .select({ courseId: courseCurriculumVersions.courseId })
    .from(courseCurriculumVersions)
    .where(eq(courseCurriculumVersions.id, input.curriculumVersionId))
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
        eq(lessonVersions.curriculumVersionId, input.curriculumVersionId),
        eq(lessonVersions.status, "active")
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder), asc(lessonVersions.sortOrder))
    .all()
  const targetIndex = lessons.findIndex(
    (lesson) => lesson.id === input.lessonId
  )
  if (targetIndex < 0) throw new Error("Target lesson not found")

  client.db
    .insert(learnerCourseProgress)
    .values({
      completedAt: null,
      courseId: version.courseId,
      curriculumVersionId: input.curriculumVersionId,
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
          eq(lessonStepVersions.curriculumVersionId, input.curriculumVersionId),
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
        curriculumVersionId: input.curriculumVersionId,
        currentStepId: lastStep.id,
        lessonId: lesson.id,
        startedAt: now,
        status: "completed",
        updatedAt: now,
        userId,
      })
      .run()
  }

  return {
    courseId: version.courseId,
    precedingLessonCount: targetIndex,
  }
}

function seedPendingAiFeedbackAttempt(client: WritingAppDatabaseClient) {
  const aiStep = client.db
    .select()
    .from(lessonStepVersions)
    .where(eq(lessonStepVersions.type, "AI_FEEDBACK"))
    .get()
  if (aiStep === undefined) throw new Error("Seeded AI feedback step not found")
  const fixture = seedProgressBeforeLesson(client, {
    curriculumVersionId: aiStep.curriculumVersionId,
    lessonId: aiStep.lessonId,
  })
  client.db
    .insert(learnerLessonProgress)
    .values({
      completedAt: null,
      courseId: fixture.courseId,
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
      courseId: fixture.courseId,
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
      courseId: fixture.courseId,
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
