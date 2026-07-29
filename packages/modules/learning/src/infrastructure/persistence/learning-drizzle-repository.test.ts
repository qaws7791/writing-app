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
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerStepDraftAnswerJsonMaxBytes,
  learnerStepDrafts,
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

  it("스텝이 없는 레슨 조회는 lesson-not-found와 동일하게 not-found다", async () => {
    const emptyStepCurriculum: LearningCurriculum = {
      ...curriculum,
      lessons: [
        {
          ...firstCurriculumLesson,
          steps: [],
        },
        secondCurriculumLesson,
      ],
    }
    const fixture = createFixture(emptyStepCurriculum)
    try {
      const repository = createDrizzleLearningReadRepository(
        fixture.database.db,
        {
          content: fixture.content,
          presentationSecret: "presentation-secret-at-least-32-bytes",
        }
      )

      await expect(
        repository.findLesson({
          lessonId: firstLessonId,
          userId: learnerId,
        })
      ).resolves.toEqual({ kind: "not-found" })
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

  it("draft를 생성·갱신하고 stale version을 원본 변경 없이 거절한다", async () => {
    const fixture = createFixture(writingCurriculum)
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
        writingCurriculum
      )

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
        {
          expectedCurriculumVersionId: curriculumVersionId,
          lessonId: firstLessonId,
          occurredAt,
          userId: learnerId,
        },
        writingCurriculum
      )
      const readRepository = createDrizzleLearningReadRepository(
        fixture.database.db,
        {
          content: fixture.content,
          presentationSecret: "presentation-secret-at-least-32-bytes",
        }
      )
      const lesson = await readRepository.findLesson({
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
    } finally {
      fixture.database.close()
    }
  })

  it("다른 사용자·잠긴 lesson·다른 curriculum revision의 draft를 거절한다", async () => {
    const fixture = createFixture(writingCurriculum)
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
        writingCurriculum
      )
      const otherLearnerId = learnerIdSchema.parse("learner-2")
      const otherRevisionId =
        curriculumVersionIdSchema.parse("curriculum-other")
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
        { ...command, userId: otherLearnerId },
        writingCurriculum
      )
      const lockedLesson = await repository.saveStepDraft(
        {
          ...command,
          lessonId: secondLessonId,
          stepId: secondStepId,
        },
        writingCurriculum
      )
      const changedRevision = await repository.saveStepDraft(
        {
          ...command,
          expectedCurriculumVersionId: otherRevisionId,
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
    } finally {
      fixture.database.close()
    }
  })

  it("정답 제출 성공 transaction에서 answer 저장과 draft 삭제를 함께 commit한다", async () => {
    const fixture = createFixture(writingCurriculum)
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
        writingCurriculum
      )
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
    } finally {
      fixture.database.close()
    }
  })

  it("제출 transaction 후반 실패 시 answer와 draft 삭제를 함께 rollback한다", async () => {
    const fixture = createFixture(writingCurriculum)
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
        writingCurriculum
      )
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
          answerJson: JSON.stringify({
            text: "보존할 초안",
            type: "WRITE",
          }),
          version: 0,
        },
      ])
    } finally {
      fixture.database.close()
    }
  })

  it("draft JSON 크기·version 제약과 course progress cascade를 적용한다", async () => {
    const fixture = createFixture(writingCurriculum)
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
        writingCurriculum
      )
      const values = {
        answerJson: JSON.stringify({ text: "초안", type: "WRITE" }),
        courseId,
        curriculumVersionId,
        lessonId: firstLessonId,
        stepId: firstStepId,
        updatedAt: occurredAt,
        userId: learnerId,
      }

      expect(() =>
        fixture.database.db
          .insert(learnerStepDrafts)
          .values({ ...values, version: -1 })
          .run()
      ).toThrow()
      expect(() =>
        fixture.database.db
          .insert(learnerStepDrafts)
          .values({
            ...values,
            answerJson: "가".repeat(learnerStepDraftAnswerJsonMaxBytes),
            version: 0,
          })
          .run()
      ).toThrow()

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
    } finally {
      fixture.database.close()
    }
  })
})

function createFixture(selectedCurriculum: LearningCurriculum = curriculum): {
  content: LearningContentQueryPort
  database: WritingAppDatabaseClient
} {
  const database = createInMemoryWritingAppDatabase()
  runCurrentTestMigration(database.sqlite)
  database.sqlite.exec(`
    CREATE TABLE IF NOT EXISTS learner_step_drafts (
      answer_json text NOT NULL,
      course_id text NOT NULL,
      curriculum_version_id text NOT NULL,
      lesson_id text NOT NULL,
      step_id text NOT NULL,
      updated_at integer NOT NULL,
      user_id text NOT NULL,
      version integer DEFAULT 0 NOT NULL,
      PRIMARY KEY (
        user_id, course_id, curriculum_version_id, lesson_id, step_id
      ),
      CONSTRAINT learner_step_drafts_course_progress_fk
        FOREIGN KEY (user_id, course_id, curriculum_version_id)
        REFERENCES learner_course_progress (
          user_id, course_id, curriculum_version_id
        ) ON DELETE CASCADE,
      CONSTRAINT learner_step_drafts_step_fk
        FOREIGN KEY (curriculum_version_id, lesson_id, step_id)
        REFERENCES lesson_step_versions (
          curriculum_version_id, lesson_id, id
        ) ON DELETE CASCADE,
      CONSTRAINT learner_step_drafts_answer_json_size_check
        CHECK (
          length(CAST(answer_json AS BLOB)) <=
          ${learnerStepDraftAnswerJsonMaxBytes}
        ),
      CONSTRAINT learner_step_drafts_version_check CHECK (version >= 0)
    );
    CREATE INDEX IF NOT EXISTS learner_step_drafts_lesson_idx
      ON learner_step_drafts (
        user_id, curriculum_version_id, lesson_id
      );
  `)
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
  }
  const content: LearningContentQueryPort = {
    findCurriculumByLesson: vi.fn(async ({ lessonId }) =>
      selectedCurriculum.lessons.some((lesson) => lesson.id === lessonId)
        ? selectedCurriculum
        : null
    ),
    listPublishedCourses: vi.fn(async () => [summary]),
    resolveAssetReferences: vi.fn(async () => []),
    readCurriculum: vi.fn(async ({ courseId: requestedCourseId }) =>
      requestedCourseId === courseId ? selectedCurriculum : null
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
