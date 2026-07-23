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

import type { LearningContentQueryPort } from "#learning/application/ports/learning-ports"
import type { LearningCurriculum } from "#learning/domain/learning-types"
import { createDrizzleLearningReadRepository } from "#learning/infrastructure/persistence/learning-read-drizzle-repository"
import { createDrizzleLearnerTransitionRepository } from "#learning/infrastructure/persistence/learning-transition-drizzle-repository"
import {
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonProgress,
} from "#learning/infrastructure/persistence/schema"

const learnerId = learnerIdSchema.parse("learner-1")
const courseId = courseIdSchema.parse("course-1")
const curriculumVersionId = curriculumVersionIdSchema.parse("curriculum-1")
const unitId = unitIdSchema.parse("unit-1")
const firstLessonId = lessonIdSchema.parse("lesson-1")
const secondLessonId = lessonIdSchema.parse("lesson-2")
const firstStepId = lessonStepIdSchema.parse("step-1")
const secondStepId = lessonStepIdSchema.parse("step-2")
const occurredAt = new Date("2026-07-22T15:00:00.000Z")

const curriculum: LearningCurriculum = {
  category: "기초",
  contentStatus: "active",
  courseId,
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

describe("learning SQLite repositories", () => {
  it("content port와 learning table만으로 course·lesson projection을 읽는다", async () => {
    const fixture = createFixture()
    try {
      const repository = createDrizzleLearningReadRepository(
        fixture.database.db,
        {
          content: fixture.content,
          presentationSecret: "presentation-secret-at-least-32-bytes",
        }
      )

      const courses = await repository.listCourses({
        limit: 20,
        sort: "recommended",
      })
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
      expect(fixture.content.listPublishedCourses).toHaveBeenCalled()
    } finally {
      fixture.database.close()
    }
  })

  it("start와 complete를 한 transaction에 반영하고 commit event intent를 반환한다", async () => {
    const fixture = createFixture()
    try {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      const started = await repository.startLesson(
        {
          expectedCurriculumVersionId: curriculumVersionId,
          lessonId: firstLessonId,
          occurredAt,
          userId: learnerId,
        },
        curriculum
      )
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
    } finally {
      fixture.database.close()
    }
  })

  it("현재 단계와 다른 완료 요청은 conflict이며 어떤 row도 변경하지 않는다", async () => {
    const fixture = createFixture()
    try {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(
        {
          expectedCurriculumVersionId: curriculumVersionId,
          lessonId: firstLessonId,
          occurredAt,
          userId: learnerId,
        },
        curriculum
      )
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
    } finally {
      fixture.database.close()
    }
  })

  it("transaction 마지막 activity write가 실패하면 start 전체를 rollback한다", async () => {
    const fixture = createFixture()
    try {
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
        repository.startLesson(
          {
            expectedCurriculumVersionId: curriculumVersionId,
            lessonId: firstLessonId,
            occurredAt,
            userId: learnerId,
          },
          curriculum
        )
      ).rejects.toThrow("injected learning activity failure")
      expect(readState(fixture.database)).toEqual({
        activity: [],
        course: [],
        lesson: [],
      })
    } finally {
      fixture.database.close()
    }
  })

  it("중복 완료 replay는 완료 집계와 event를 중복하지 않는다", async () => {
    const fixture = createFixture()
    try {
      const repository = createDrizzleLearnerTransitionRepository(
        fixture.database.db
      )
      await repository.startLesson(
        {
          expectedCurriculumVersionId: curriculumVersionId,
          lessonId: firstLessonId,
          occurredAt,
          userId: learnerId,
        },
        curriculum
      )
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
    } finally {
      fixture.database.close()
    }
  })
})

function createFixture(): {
  content: LearningContentQueryPort
  database: WritingAppDatabaseClient
} {
  const database = createInMemoryWritingAppDatabase()
  runCurrentTestMigration(database.sqlite)
  database.sqlite.exec(`
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
      'curriculum-1', 'course-1', 1, 0, 'draft', '코스', '설명',
      '기초', 'basic-sentence-writing', 1, 1, NULL
    );
    INSERT INTO course_unit_versions (
      curriculum_version_id, id, title, status, sort_order
    ) VALUES ('curriculum-1', 'unit-1', '단원', 'active', 1);
    INSERT INTO lesson_versions (
      curriculum_version_id, id, unit_id, title, description, category,
      summary_json, estimated_minutes, status, sort_order
    ) VALUES
      ('curriculum-1', 'lesson-1', 'unit-1', '첫 레슨', NULL, NULL, '[]', 5, 'active', 1),
      ('curriculum-1', 'lesson-2', 'unit-1', '둘째 레슨', NULL, NULL, '[]', 5, 'active', 2);
    INSERT INTO lesson_step_versions (
      curriculum_version_id, id, lesson_id, type, content_json, status, sort_order
    ) VALUES
      ('curriculum-1', 'step-1', 'lesson-1', 'READING', '{}', 'active', 1),
      ('curriculum-1', 'step-2', 'lesson-2', 'READING', '{}', 'active', 1);
    UPDATE course_curriculum_versions
    SET status = 'published', published_at = 1
    WHERE id = 'curriculum-1';
    UPDATE courses
    SET published_curriculum_version_id = 'curriculum-1'
    WHERE id = 'course-1';
  `)
  const summary = {
    category: curriculum.category,
    courseId,
    description: curriculum.description,
    lessonCount: curriculum.lessons.length,
    revision: curriculum.revision,
    sortOrder: 1,
    title: curriculum.title,
    versionId: curriculumVersionId,
    visualKey: curriculum.visualKey,
  }
  const content: LearningContentQueryPort = {
    findCurriculumByLesson: vi.fn(async ({ lessonId }) =>
      curriculum.lessons.some((lesson) => lesson.id === lessonId)
        ? curriculum
        : null
    ),
    listPublishedCourses: vi.fn(async () => [summary]),
    readCurriculum: vi.fn(async ({ courseId: requestedCourseId }) =>
      requestedCourseId === courseId ? curriculum : null
    ),
  }
  return { content, database }
}

function readState(database: WritingAppDatabaseClient) {
  return {
    activity: database.db.select().from(learnerActivityDays).all(),
    course: database.db.select().from(learnerCourseProgress).all(),
    lesson: database.db.select().from(learnerLessonProgress).all(),
  }
}
