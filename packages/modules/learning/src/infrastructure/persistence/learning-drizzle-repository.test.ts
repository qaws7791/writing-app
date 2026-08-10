import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/content/migration-schema"
import { aPublishedCourse } from "@workspace/content/test-fixtures"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { aLearner } from "@workspace/identity/test-fixtures"
import { ok } from "@workspace/kernel/result"

import { createLearningApplication } from "#learning/application/learning-application"
import type { LearningContentQueryPort } from "#learning/application/ports/learning-ports"
import type { LearningCurriculum } from "#learning/domain/learning-types"
import { createDrizzleLearningReadRepository } from "#learning/infrastructure/persistence/learning-read-drizzle-repository"
import { createDrizzleLearnerTransitionRepository } from "#learning/infrastructure/persistence/learning-transition-drizzle-repository"
import {
  learnerActivityDays,
  learnerLessonAnswers,
  learnerStepDrafts,
} from "#learning/infrastructure/persistence/schema"

type LearningFixture = Readonly<{
  database: WritingAppDatabaseClient
}>

const learnerId = learnerIdSchema.parse("learner-1")
const courseId = courseIdSchema.parse("course-1")
const firstCurriculumVersionId = curriculumVersionIdSchema.parse("curriculum-1")
const secondCurriculumVersionId =
  curriculumVersionIdSchema.parse("curriculum-2")
const unitId = unitIdSchema.parse("unit-1")
const firstLessonId = lessonIdSchema.parse("lesson-1")
const secondLessonId = lessonIdSchema.parse("lesson-2")
const firstStepId = lessonStepIdSchema.parse("step-1")
const secondStepId = lessonStepIdSchema.parse("step-2")
const occurredAt = new Date("2026-07-22T15:00:00.000Z")
const updatedAt = new Date("2026-07-22T15:01:00.000Z")
const staleAttemptedAt = new Date("2026-07-22T15:02:00.000Z")
const secondPublishedAt = new Date("2026-07-23T00:00:00.000Z")

const curriculum: LearningCurriculum = {
  category: "기초",
  contentStatus: "active",
  courseId,
  coverAssetId: null,
  curriculumVersionId: firstCurriculumVersionId,
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
  throw new Error("Learning repository test curriculum requires two lessons")
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

const secondCurriculum: LearningCurriculum = {
  ...curriculum,
  curriculumVersionId: secondCurriculumVersionId,
  revision: 2,
  title: "개정 학습 코스",
}

const startFirstLesson = {
  expectedCurriculumVersionId: firstCurriculumVersionId,
  lessonId: firstLessonId,
  occurredAt,
  userId: learnerId,
}

describe("learning SQLite transition repository", () => {
  it("새 revision 발행 후에도 미시작 형제 레슨의 course revision을 고정한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, curriculum)
      publishSecondCurriculumRevision(fixture)
      const application = createLearningTestApplication(fixture)

      const courseDetail = (
        await application.readCourseDetail({ courseId, learnerId })
      )._unsafeUnwrap()
      const siblingLesson = (
        await application.readLesson({
          learnerId,
          lessonId: secondLessonId,
        })
      )._unsafeUnwrap()
      const started = await application.startLesson({
        expectedCurriculumVersionId: curriculumVersionIdSchema.parse(
          siblingLesson.version.curriculumVersionId
        ),
        learnerId,
        lessonId: secondLessonId,
      })
      const expectedVersion = {
        curriculumVersionId: firstCurriculumVersionId,
        revision: 1,
      }

      expect({
        courseVersion: courseDetail.version,
        lessonVersion: siblingLesson.version,
        startedVersion: started._unsafeUnwrap().version,
      }).toEqual({
        courseVersion: expectedVersion,
        lessonVersion: expectedVersion,
        startedVersion: expectedVersion,
      })
    })
  })

  it("완료 성공 transaction에서 answer 저장과 draft 삭제를 함께 commit한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)
      await repository.saveStepDraft(
        {
          answer: { text: "제출할 초안", type: "WRITE" },
          expectedCurriculumVersionId: firstCurriculumVersionId,
          expectedVersion: null,
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )

      await repository.completeStep(
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

      expect(readSubmissionState(fixture.database)).toEqual({
        answers: [
          {
            answerJson: JSON.stringify({
              text: "제출할 답안",
              type: "WRITE",
            }),
          },
        ],
        drafts: [],
      })
    }, writingCurriculum)
  })

  it("완료 transaction 후반 실패 시 answer와 draft 삭제를 함께 rollback한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)
      await repository.saveStepDraft(
        {
          answer: { text: "보존할 초안", type: "WRITE" },
          expectedCurriculumVersionId: firstCurriculumVersionId,
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
      expect(readSubmissionState(fixture.database)).toEqual({
        answers: [],
        drafts: [
          {
            answerJson: JSON.stringify({
              text: "보존할 초안",
              type: "WRITE",
            }),
            version: 0,
          },
        ],
      })
    }, writingCurriculum)
  })

  it("완료 replay는 완료 집계를 exactly once로 유지한다", async () => {
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
      const activity = fixture.database.db
        .select({ completedLessons: learnerActivityDays.completedLessons })
        .from(learnerActivityDays)
        .where(eq(learnerActivityDays.userId, learnerId))
        .get()

      expect({
        completedLessons: activity?.completedLessons,
        firstKind: first._unsafeUnwrap().kind,
        replayKind: replay._unsafeUnwrap().kind,
      }).toEqual({
        completedLessons: 1,
        firstKind: "lesson-completed",
        replayKind: "lesson-completed",
      })
    })
  })

  it("stale draft version을 거절하고 최신 draft를 보존한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)
      await repository.saveStepDraft(
        {
          answer: { text: "첫 초안", type: "WRITE" },
          expectedCurriculumVersionId: firstCurriculumVersionId,
          expectedVersion: null,
          lessonId: firstLessonId,
          occurredAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )
      await repository.saveStepDraft(
        {
          answer: { text: "갱신한 초안", type: "WRITE" },
          expectedCurriculumVersionId: firstCurriculumVersionId,
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
          expectedCurriculumVersionId: firstCurriculumVersionId,
          expectedVersion: 0,
          lessonId: firstLessonId,
          occurredAt: staleAttemptedAt,
          stepId: firstStepId,
          userId: learnerId,
        },
        writingCurriculum
      )
      const restarted = await repository.startLesson(
        startFirstLesson,
        writingCurriculum
      )

      expect(stale._unsafeUnwrapErr()).toMatchObject({
        currentVersion: 1,
        kind: "step-draft-version-conflict",
      })
      expect(restarted._unsafeUnwrap().drafts).toEqual([
        {
          answer: { text: "갱신한 초안", type: "WRITE" },
          stepId: firstStepId,
          updatedAt: updatedAt.toISOString(),
          version: 1,
        },
      ])
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
    const firstStep = selectedCurriculum.lessons[0]?.steps[0]
    if (firstStep === undefined) {
      throw new Error("Learning repository fixture requires a first step")
    }
    aPublishedCourse(database.sqlite, {
      additionalLessons: [
        {
          lessonId: secondLessonId,
          lessonTitle: "둘째 레슨",
          stepId: secondStepId,
          stepType: "READING",
        },
      ],
      courseId,
      courseTitle: "학습 코스",
      curriculumVersionId: firstCurriculumVersionId,
      lessonId: firstLessonId,
      lessonTitle: "첫 레슨",
      stepId: firstStepId,
      stepType: firstStep.type,
      unitId,
    })

    await run({ database })
  } finally {
    database.close()
  }
}

function createLearningTestApplication(fixture: LearningFixture) {
  const clock = { now: () => new Date(occurredAt) }
  const content: LearningContentQueryPort = {
    async findCurriculumByLesson(input) {
      const selected =
        input.curriculumVersionId === firstCurriculumVersionId
          ? curriculum
          : secondCurriculum
      return selected.lessons.some((lesson) => lesson.id === input.lessonId)
        ? selected
        : null
    },
    listPublishedCourses: async () => [],
    readCurriculum: async (input) =>
      input.courseId !== courseId
        ? null
        : input.curriculumVersionId === firstCurriculumVersionId
          ? curriculum
          : input.curriculumVersionId === secondCurriculumVersionId ||
              input.curriculumVersionId === undefined
            ? secondCurriculum
            : null,
    resolveAssetReferences: async () => [],
  }
  const transitionRepository = createDrizzleLearnerTransitionRepository(
    fixture.database.db
  )

  return createLearningApplication({
    aiFeedback: { requestFeedback: unusedDependency },
    clock,
    content,
    identity: {
      readLearnerStatus: async () => ok("active" as const),
    },
    readRepository: createDrizzleLearningReadRepository(fixture.database.db, {
      content,
      presentationSecret: "presentation-secret-at-least-32-bytes",
    }),
    transitionRepository,
  })
}

function unusedDependency(): never {
  throw new Error("Unexpected test dependency call")
}

function publishSecondCurriculumRevision(fixture: LearningFixture): void {
  fixture.database.db
    .insert(courseCurriculumVersions)
    .values({
      category: "기초",
      courseId,
      coverAssetId: null,
      createdAt: secondPublishedAt,
      description: "개정 설명",
      editVersion: 0,
      id: secondCurriculumVersionId,
      publishedAt: null,
      revision: 2,
      status: "draft",
      title: "개정 학습 코스",
      updatedAt: secondPublishedAt,
      visualKey: "basic-sentence-writing",
    })
    .run()
  fixture.database.db
    .insert(courseUnitVersions)
    .values({
      curriculumVersionId: secondCurriculumVersionId,
      id: unitId,
      sortOrder: 1,
      status: "active",
      title: "단원",
    })
    .run()
  fixture.database.db
    .insert(lessonVersions)
    .values([
      {
        category: "기초",
        curriculumVersionId: secondCurriculumVersionId,
        description: "개정 첫 레슨",
        estimatedMinutes: 5,
        id: firstLessonId,
        sortOrder: 1,
        status: "active",
        summaryJson: "[]",
        title: "개정 첫 레슨",
        unitId,
      },
      {
        category: "기초",
        curriculumVersionId: secondCurriculumVersionId,
        description: "개정 둘째 레슨",
        estimatedMinutes: 5,
        id: secondLessonId,
        sortOrder: 2,
        status: "active",
        summaryJson: "[]",
        title: "개정 둘째 레슨",
        unitId,
      },
    ])
    .run()
  fixture.database.db
    .insert(lessonStepVersions)
    .values([
      {
        contentJson: JSON.stringify({
          body: "개정 본문",
          guide: "개정 읽기",
          title: "개정 첫 단계",
        }),
        curriculumVersionId: secondCurriculumVersionId,
        id: firstStepId,
        lessonId: firstLessonId,
        sortOrder: 1,
        status: "active",
        type: "READING",
      },
      {
        contentJson: JSON.stringify({
          body: "개정 본문 2",
          guide: "개정 읽기",
          title: "개정 둘째 단계",
        }),
        curriculumVersionId: secondCurriculumVersionId,
        id: secondStepId,
        lessonId: secondLessonId,
        sortOrder: 1,
        status: "active",
        type: "READING",
      },
    ])
    .run()
  fixture.database.db
    .update(courseCurriculumVersions)
    .set({
      publishedAt: secondPublishedAt,
      status: "published",
      updatedAt: secondPublishedAt,
    })
    .where(eq(courseCurriculumVersions.id, secondCurriculumVersionId))
    .run()
  fixture.database.db
    .update(courses)
    .set({ publishedCurriculumVersionId: secondCurriculumVersionId })
    .where(eq(courses.id, courseId))
    .run()
}

function readSubmissionState(database: WritingAppDatabaseClient) {
  return {
    answers: database.db
      .select({ answerJson: learnerLessonAnswers.answerJson })
      .from(learnerLessonAnswers)
      .all(),
    drafts: database.db
      .select({
        answerJson: learnerStepDrafts.answerJson,
        version: learnerStepDrafts.version,
      })
      .from(learnerStepDrafts)
      .all(),
  }
}
