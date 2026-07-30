import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import { aLearner } from "@workspace/identity/test-fixtures"

import type { LearningContentQueryPort } from "#learning/application/ports/learning-ports"
import type { LearningCurriculum } from "#learning/domain/learning-types"
import { createDrizzleLearningReadRepository } from "#learning/infrastructure/persistence/learning-read-drizzle-repository"
import { createDrizzleLearnerTransitionRepository } from "#learning/infrastructure/persistence/learning-transition-drizzle-repository"
import {
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerStepDraftAnswerJsonMaxBytes,
  learnerStepDrafts,
} from "#learning/infrastructure/persistence/schema"

type LearningFixture = Readonly<{
  content: LearningContentQueryPort
  database: WritingAppDatabaseClient
}>

const learnerId = learnerIdSchema.parse("learner-1")
const courseId = courseIdSchema.parse("course-1")
const curriculumVersionId = curriculumVersionIdSchema.parse("curriculum-1")
const unitId = unitIdSchema.parse("unit-1")
const firstLessonId = lessonIdSchema.parse("lesson-1")
const secondLessonId = lessonIdSchema.parse("lesson-2")
const firstStepId = lessonStepIdSchema.parse("step-1")
const secondStepId = lessonStepIdSchema.parse("step-2")
const occurredAt = new Date("2026-07-22T15:00:00.000Z")
const presentationSecret = "presentation-secret-at-least-32-bytes"

const curriculum: LearningCurriculum = {
  category: "기초",
  contentStatus: "active",
  courseId,
  coverAssetId: null,
  curriculumVersionId,
  description: "설명",
  lessons: [
    {
      category: "기초",
      description: "첫 레슨",
      estimatedMinutes: 5,
      id: firstLessonId,
      sortOrder: 1,
      status: "active",
      steps: [
        {
          body: "본문",
          guide: "읽기",
          id: firstStepId,
          sortOrder: 1,
          title: "첫 단계",
          type: "READING",
        },
      ],
      summary: ["요약"],
      title: "첫 레슨",
      unitId,
      unitSortOrder: 1,
    },
    {
      category: "기초",
      description: "둘째 레슨",
      estimatedMinutes: 5,
      id: secondLessonId,
      sortOrder: 2,
      status: "active",
      steps: [
        {
          body: "본문 2",
          guide: "읽기",
          id: secondStepId,
          sortOrder: 1,
          title: "둘째 단계",
          type: "READING",
        },
      ],
      summary: [],
      title: "둘째 레슨",
      unitId,
      unitSortOrder: 1,
    },
  ],
  revision: 1,
  title: "학습 코스",
  units: [{ id: unitId, sortOrder: 1, status: "active", title: "단원" }],
  visualKey: "basic-sentence-writing",
}

const firstCurriculumLesson = curriculum.lessons[0]
const secondCurriculumLesson = curriculum.lessons[1]
if (
  firstCurriculumLesson === undefined ||
  secondCurriculumLesson === undefined
) {
  throw new Error("Draft repository test curriculum requires two lessons")
}

const writingCurriculum: LearningCurriculum = {
  ...curriculum,
  lessons: [
    {
      ...firstCurriculumLesson,
      steps: [
        {
          id: firstStepId,
          min: 1,
          sortOrder: 1,
          type: "WRITE",
        },
      ],
    },
    secondCurriculumLesson,
  ],
}

const startFirstLesson = {
  expectedCurriculumVersionId: curriculumVersionId,
  lessonId: firstLessonId,
  occurredAt,
  userId: learnerId,
}

describe("learning SQLite repositories", () => {
  it("content port와 learning table만으로 course·lesson projection을 읽는다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createReadRepository(fixture)

      const courses = await repository.listCourses({ limit: 20 })
      const detail = await repository.findCourseDetail({
        courseId,
        userId: learnerId,
      })
      const lesson = await repository.findLesson({
        lessonId: firstLessonId,
        userId: learnerId,
      })

      expect(courses.items).toEqual([
        expect.objectContaining({ id: courseId, lessonCount: 2 }),
      ])
      expect(detail?.learning.status).toBe("not_started")
      expect(lesson).toMatchObject({
        kind: "found",
        value: { id: firstLessonId, steps: [{ id: firstStepId }] },
      })
    })
  })

  it("스텝이 없는 레슨 조회는 lesson-not-found와 동일하게 not-found다", async () => {
    await withLearningDatabase(
      async (fixture) => {
        const repository = createReadRepository(fixture)

        await expect(
          repository.findLesson({
            lessonId: firstLessonId,
            userId: learnerId,
          })
        ).resolves.toEqual({ kind: "not-found" })
      },
      {
        ...curriculum,
        lessons: [
          { ...firstCurriculumLesson, steps: [] },
          secondCurriculumLesson,
        ],
      }
    )
  })

  it("start와 complete를 한 transaction에 반영하고 commit event intent를 반환한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      const started = await repository.startLesson(startFirstLesson, curriculum)
      const completed = await repository.completeStep(
        {
          completion: { kind: "acknowledge" },
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        curriculum
      )

      expect(started.isOk() && started.value.status).toBe("in_progress")
      expect(completed.isOk() && completed.value.kind).toBe("lesson-completed")
      expect(
        fixture.database.db
          .select({ status: learnerLessonProgress.status })
          .from(learnerLessonProgress)
          .get()
      ).toEqual({ status: "completed" })
    })
  })

  it("현재 단계와 다른 완료 요청은 conflict이며 어떤 row도 변경하지 않는다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, curriculum)
      const before = readState(fixture.database)

      const result = await repository.completeStep(
        {
          completion: { kind: "acknowledge" },
          lessonId: firstLessonId,
          occurredAt,
          stepId: secondStepId,
          userId: learnerId,
        },
        curriculum
      )

      expect(result.isErr() && result.error.kind).toBe("step-sequence-conflict")
      expect(readState(fixture.database)).toEqual(before)
    })
  })

  it("transaction 마지막 activity write가 실패하면 start 전체를 rollback한다", async () => {
    await withLearningDatabase(async (fixture) => {
      fixture.database.sqlite.exec(`
        CREATE TRIGGER fail_learning_activity
        BEFORE INSERT ON learner_activity_days
        BEGIN
          SELECT RAISE(ABORT, 'injected learning activity failure');
        END;
      `)
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )

      await expect(
        repository.startLesson(startFirstLesson, curriculum)
      ).rejects.toThrow("injected learning activity failure")
      expect(readState(fixture.database)).toEqual({
        activity: [],
        course: [],
        lesson: [],
      })
    })
  })

  it("중복 완료 replay는 완료 집계와 event를 중복하지 않는다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, curriculum)
      const command = {
        completion: { kind: "acknowledge" as const },
        lessonId: firstLessonId,
        occurredAt,
        stepId: firstStepId,
        userId: learnerId,
      }
      const first = await repository.completeStep(command, curriculum)
      const replay = await repository.completeStep(command, curriculum)

      expect(first.isOk() && first.value.kind).toBe("lesson-completed")
      expect(replay.isOk() && replay.value.kind).toBe("lesson-completed")
      expect(
        fixture.database.db
          .select({ completedLessons: learnerActivityDays.completedLessons })
          .from(learnerActivityDays)
          .where(eq(learnerActivityDays.userId, learnerId))
          .get()
      ).toEqual({ completedLessons: 1 })
    })
  })

  it("draft를 생성·갱신하고 stale version을 원본 변경 없이 거절한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)

      const created = await repository.saveStepDraft(
        {
          answer: { text: "첫 초안", type: "WRITE" },
          expectedCurriculumVersionId: curriculumVersionId,
          expectedVersion: null,
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )
      const updatedAt = new Date("2026-07-22T15:01:00.000Z")
      const updated = await repository.saveStepDraft(
        {
          answer: { text: "갱신한 초안", type: "WRITE" },
          expectedCurriculumVersionId: curriculumVersionId,
          expectedVersion: 0,
          lessonId: firstLessonId,
          occurredAt: updatedAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )
      const stale = await repository.saveStepDraft(
        {
          answer: { text: "뒤늦은 초안", type: "WRITE" },
          expectedCurriculumVersionId: curriculumVersionId,
          expectedVersion: 0,
          lessonId: firstLessonId,
          occurredAt: new Date("2026-07-22T15:02:00.000Z"),
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )
      const restarted = await repository.startLesson(
        startFirstLesson,
        writingCurriculum
      )
      const lesson = await createReadRepository(fixture).findLesson({
        lessonId: firstLessonId,
        userId: learnerId,
      })

      expect(created.isOk() && created.value.version).toBe(0)
      expect(updated.isOk() && updated.value.version).toBe(1)
      expect(stale.isErr() && stale.error).toMatchObject({
        currentVersion: 1,
        kind: "step-draft-version-conflict",
      })
      expect(restarted.isOk() && restarted.value.drafts).toEqual([
        {
          answer: { text: "갱신한 초안", type: "WRITE" },
          stepId: firstStepId,
          updatedAt: updatedAt.toISOString(),
          version: 1,
        },
      ])
      expect(lesson.kind === "found" ? lesson.value.drafts : undefined).toEqual(
        restarted.isOk() ? restarted.value.drafts : []
      )
    }, writingCurriculum)
  })

  it("다른 사용자·잠긴 lesson·다른 curriculum revision의 draft를 거절한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)
      const command = {
        answer: { text: "초안", type: "WRITE" as const },
        expectedCurriculumVersionId: curriculumVersionId,
        expectedVersion: null,
        lessonId: firstLessonId,
        occurredAt,
        stepId: firstStepId,
        userId: learnerId,
      }

      const otherUser = await repository.saveStepDraft(
        { ...command, userId: learnerIdSchema.parse("learner-2") },
        writingCurriculum
      )
      const lockedLesson = await repository.saveStepDraft(
        { ...command, lessonId: secondLessonId, stepId: secondStepId },
        writingCurriculum
      )
      const changedRevision = await repository.saveStepDraft(
        {
          ...command,
          expectedCurriculumVersionId:
            curriculumVersionIdSchema.parse("curriculum-other"),
        },
        writingCurriculum
      )

      expect(otherUser.isErr() && otherUser.error.kind).toBe("lesson-locked")
      expect(lockedLesson.isErr() && lockedLesson.error.kind).toBe(
        "lesson-locked"
      )
      expect(changedRevision.isErr() && changedRevision.error.kind).toBe(
        "curriculum-version-changed"
      )
      expect(
        fixture.database.db.select().from(learnerStepDrafts).all()
      ).toEqual([])
    }, writingCurriculum)
  })

  it("정답 제출 성공 transaction에서 answer 저장과 draft 삭제를 함께 commit한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)
      await repository.saveStepDraft(
        {
          answer: { text: "제출할 초안", type: "WRITE" },
          expectedCurriculumVersionId: curriculumVersionId,
          expectedVersion: null,
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )

      const completed = await repository.completeStep(
        {
          completion: {
            kind: "answer",
            submission: { text: "제출할 답안", type: "WRITE" },
          },
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )

      expect(completed.isOk() && completed.value.kind).toBe("lesson-completed")
      expect(
        fixture.database.db.select().from(learnerLessonAnswers).all()
      ).toHaveLength(1)
      expect(
        fixture.database.db.select().from(learnerStepDrafts).all()
      ).toHaveLength(0)
    }, writingCurriculum)
  })

  it("제출 transaction 후반 실패 시 answer와 draft 삭제를 함께 rollback한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)
      await repository.saveStepDraft(
        {
          answer: { text: "보존할 초안", type: "WRITE" },
          expectedCurriculumVersionId: curriculumVersionId,
          expectedVersion: null,
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )
      fixture.database.sqlite.exec(`
        CREATE TRIGGER fail_answer_activity
        BEFORE UPDATE ON learner_activity_days
        BEGIN
          SELECT RAISE(ABORT, 'injected answer activity failure');
        END;
      `)

      await expect(
        repository.completeStep(
          {
            completion: {
              kind: "answer",
              submission: { text: "제출할 답안", type: "WRITE" },
            },
            lessonId: firstLessonId,
            occurredAt,
            stepId: firstStepId,
            userId: learnerId,
          },
          writingCurriculum
        )
      ).rejects.toThrow("injected answer activity failure")

      expect(
        fixture.database.db.select().from(learnerLessonAnswers).all()
      ).toHaveLength(0)
      expect(
        fixture.database.db.select().from(learnerStepDrafts).all()
      ).toMatchObject([
        {
          answerJson: JSON.stringify({ text: "보존할 초안", type: "WRITE" }),
          version: 0,
        },
      ])
    }, writingCurriculum)
  })

  it("음수 draft version을 migration 제약으로 거절한다", async () => {
    await withLearningDatabase(async (fixture) => {
      await startedDraftScope(fixture)

      expect(() =>
        insertDraftRow(fixture, {
          answerJson: aDraftAnswerJson(64),
          version: -1,
        })
      ).toThrow()
    }, writingCurriculum)
  })

  it("answer_json이 상한 byte와 같으면 migration 제약을 통과한다", async () => {
    await withLearningDatabase(async (fixture) => {
      await startedDraftScope(fixture)

      insertDraftRow(fixture, {
        answerJson: aDraftAnswerJson(learnerStepDraftAnswerJsonMaxBytes),
        version: 0,
      })

      expect(
        fixture.database.db.select().from(learnerStepDrafts).all()
      ).toHaveLength(1)
    }, writingCurriculum)
  })

  it("answer_json이 상한을 1byte 넘기면 migration 제약으로 거절한다", async () => {
    await withLearningDatabase(async (fixture) => {
      await startedDraftScope(fixture)

      expect(() =>
        insertDraftRow(fixture, {
          answerJson: aDraftAnswerJson(learnerStepDraftAnswerJsonMaxBytes + 1),
          version: 0,
        })
      ).toThrow()
    }, writingCurriculum)
  })

  it("course progress를 지우면 draft를 cascade로 함께 지운다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = await startedDraftScope(fixture)
      await repository.saveStepDraft(
        {
          answer: { text: "cascade 대상", type: "WRITE" },
          expectedCurriculumVersionId: curriculumVersionId,
          expectedVersion: null,
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )

      fixture.database.db
        .delete(learnerCourseProgress)
        .where(eq(learnerCourseProgress.userId, learnerId))
        .run()

      expect(
        fixture.database.db.select().from(learnerStepDrafts).all()
      ).toHaveLength(0)
    }, writingCurriculum)
  })
})

async function withLearningDatabase(
  run: (fixture: LearningFixture) => Promise<void>,
  selectedCurriculum: LearningCurriculum = curriculum
): Promise<void> {
  const database = createInMemoryWritingAppDatabase()
  try {
    runCurrentTestMigration(database.sqlite)
    aLearner(database.sqlite, { id: learnerId, name: "학습자" })
    aPublishedCourse(database.sqlite, {
      additionalLessons: [
        {
          lessonId: secondLessonId,
          lessonTitle: "둘째 레슨",
          stepId: secondStepId,
          stepType: "READING",
        },
      ],
      curriculumVersionId,
      lessonTitle: "첫 레슨",
      stepType: "READING",
    })

    await run({ content: createContentPort(selectedCurriculum), database })
  } finally {
    database.close()
  }
}

function createContentPort(
  selectedCurriculum: LearningCurriculum
): LearningContentQueryPort {
  return {
    findCurriculumByLesson: vi.fn(async ({ lessonId }) =>
      selectedCurriculum.lessons.some((lesson) => lesson.id === lessonId)
        ? selectedCurriculum
        : null
    ),
    listPublishedCourses: vi.fn(async () => [
      {
        category: selectedCurriculum.category,
        courseId,
        coverAssetId: selectedCurriculum.coverAssetId,
        description: selectedCurriculum.description,
        lessonCount: selectedCurriculum.lessons.length,
        revision: selectedCurriculum.revision,
        sortOrder: 1,
        title: selectedCurriculum.title,
        versionId: curriculumVersionId,
        visualKey: selectedCurriculum.visualKey,
      },
    ]),
    resolveAssetReferences: vi.fn(async () => []),
    readCurriculum: vi.fn(async ({ courseId: requestedCourseId }) =>
      requestedCourseId === courseId ? selectedCurriculum : null
    ),
  }
}

function createReadRepository(fixture: LearningFixture) {
  return createDrizzleLearningReadRepository(fixture.database.db, {
    content: fixture.content,
    presentationSecret,
  })
}

async function startedDraftScope(fixture: LearningFixture) {
  const repository = createDrizzleLearnerTransitionRepository(
    fixture.database.db
  )
  const started = await repository.startLesson(
    startFirstLesson,
    writingCurriculum
  )
  if (started.isErr()) throw new Error(started.error.kind)
  return repository
}

function insertDraftRow(
  fixture: LearningFixture,
  values: Readonly<{ answerJson: string; version: number }>
): void {
  fixture.database.db
    .insert(learnerStepDrafts)
    .values({
      answerJson: values.answerJson,
      courseId,
      curriculumVersionId,
      lessonId: firstLessonId,
      stepId: firstStepId,
      updatedAt: occurredAt,
      userId: learnerId,
      version: values.version,
    })
    .run()
}

/** ASCII만 사용해 JSON 문자열의 byte 길이를 정확히 byteLength로 맞춘다. */
function aDraftAnswerJson(byteLength: number): string {
  const envelopeLength = JSON.stringify({ text: "", type: "WRITE" }).length
  return JSON.stringify({
    text: "a".repeat(byteLength - envelopeLength),
    type: "WRITE",
  })
}

function readState(database: WritingAppDatabaseClient) {
  return {
    activity: database.db.select().from(learnerActivityDays).all(),
    course: database.db.select().from(learnerCourseProgress).all(),
    lesson: database.db.select().from(learnerLessonProgress).all(),
  }
}
