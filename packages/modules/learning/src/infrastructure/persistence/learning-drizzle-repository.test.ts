import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"
import {
  learnerIdSchema,
  lessonStepItemIdSchema,
} from "@workspace/contracts/learning/ids"
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

const optionA = lessonStepItemIdSchema.parse("option-a")
const optionB = lessonStepItemIdSchema.parse("option-b")

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
          correct: lessonStepItemIdSchema.parse("option-b"),
          explanation: "해설",
          id: firstStepId,
          options: [
            { id: lessonStepItemIdSchema.parse("option-a"), text: "첫째" },
            { id: lessonStepItemIdSchema.parse("option-b"), text: "둘째" },
          ],
          question: "정답은?",
          sortOrder: 1,
          type: "MULTIPLE_CHOICE",
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

const extraFirstLessonStepId = lessonStepIdSchema.parse("step-1b")

const twoStepCurriculum: LearningCurriculum = {
  ...curriculum,
  lessons: [
    {
      ...firstCurriculumLesson,
      steps: [
        ...firstCurriculumLesson.steps,
        {
          body: "본문 1b",
          id: extraFirstLessonStepId,
          sortOrder: 2,
          title: "첫 레슨 둘째 단계",
          type: "READING",
        },
      ],
    },
    secondCurriculumLesson,
  ],
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

  it("stale draft version을 거절하고 최신 draft를 보존한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, writingCurriculum)
      await repository.saveStepDraft(
        {
          answer: { selectedOptionId: optionA, type: "MULTIPLE_CHOICE" },
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
          answer: { selectedOptionId: optionB, type: "MULTIPLE_CHOICE" },
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
          answer: { selectedOptionId: optionA, type: "MULTIPLE_CHOICE" },
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
          answer: { selectedOptionId: optionB, type: "MULTIPLE_CHOICE" },
          stepId: firstStepId,
          updatedAt: updatedAt.toISOString(),
          version: 1,
        },
      ])
    }, writingCurriculum)
  })

  it("진행 중인 레슨의 다른 원본 스텝 draft를 허용한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, twoStepCurriculum)
      const saved = await repository.saveStepDraft(
        {
          answer: { selectedOptionId: optionA, type: "MULTIPLE_CHOICE" },
          expectedCurriculumVersionId: firstCurriculumVersionId,
          expectedVersion: null,
          lessonId: firstLessonId,
          occurredAt,
          stepId: extraFirstLessonStepId,
          userId: learnerId,
        },
        {
          ...twoStepCurriculum,
          lessons: [
            {
              ...firstCurriculumLesson,
              steps: [
                {
                  correct: optionB,
                  explanation: "해설",
                  id: firstStepId,
                  options: [
                    { id: optionA, text: "첫째" },
                    { id: optionB, text: "둘째" },
                  ],
                  question: "정답은?",
                  sortOrder: 1,
                  type: "MULTIPLE_CHOICE",
                },
                {
                  correct: optionA,
                  explanation: "둘째 해설",
                  id: extraFirstLessonStepId,
                  options: [
                    { id: optionA, text: "첫째" },
                    { id: optionB, text: "둘째" },
                  ],
                  question: "둘째 정답은?",
                  sortOrder: 2,
                  type: "MULTIPLE_CHOICE",
                },
              ],
            },
            secondCurriculumLesson,
          ],
        }
      )

      expect(saved.isOk()).toBe(true)
      expect(saved._unsafeUnwrap()).toMatchObject({
        stepId: extraFirstLessonStepId,
        version: 0,
      })
    }, twoStepCurriculum)
  })

  it("원본 완료 스텝을 저장한 뒤 조회하면 그 집합으로 hydrate한다", async () => {
    await withLearningDatabase(async (fixture) => {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(startFirstLesson, twoStepCurriculum)
      const persisted = await repository.saveLessonProgress(
        {
          completedStepIds: [firstStepId],
          currentStepId: extraFirstLessonStepId,
          expectedCurriculumVersionId: firstCurriculumVersionId,
          lessonId: firstLessonId,
          occurredAt: updatedAt,
          userId: learnerId,
        },
        twoStepCurriculum
      )
      const application = createLearningTestApplication(
        fixture,
        twoStepCurriculum
      )
      const lesson = (
        await application.readLesson({
          learnerId,
          lessonId: firstLessonId,
        })
      )._unsafeUnwrap()

      expect(persisted._unsafeUnwrap()).toMatchObject({
        completedStepIds: [firstStepId],
        completedSteps: 1,
        currentStepId: extraFirstLessonStepId,
        status: "in_progress",
      })
      expect(lesson.learning).toMatchObject({
        completedStepIds: [firstStepId],
        completedSteps: 1,
        currentStepId: extraFirstLessonStepId,
        status: "in_progress",
      })
    }, twoStepCurriculum)
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
    const firstLessonSteps = selectedCurriculum.lessons[0]?.steps ?? []
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
      additionalSteps: firstLessonSteps.slice(1).map((step) => ({
        stepId: step.id,
        stepType: step.type,
      })),
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

function createLearningTestApplication(
  fixture: LearningFixture,
  selectedCurriculum: LearningCurriculum = curriculum
) {
  const clock = { now: () => new Date(occurredAt) }
  const content: LearningContentQueryPort = {
    async findCurriculumByLesson(input) {
      const selected =
        input.curriculumVersionId === firstCurriculumVersionId
          ? selectedCurriculum
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
          ? selectedCurriculum
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
