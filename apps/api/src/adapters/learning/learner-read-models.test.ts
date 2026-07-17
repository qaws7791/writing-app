import { describe, expect, it } from "vitest"

import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  authUsers,
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonProgress,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"

import {
  createDrizzleProfileReader,
  createDrizzleProgressReader,
} from "@/adapters/learning/learner-read-models"

const now = new Date("2026-07-17T00:00:00.000Z")
const userId = "learner-read-user"

describe("학습자 profile·progress SQLite reader", () => {
  it("활성 published lesson이 없으면 profile 분모와 progress를 0으로 반환한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      insertAuthUser(database)

      await expect(
        createDrizzleProfileReader(database.db).readProfileStats(userId)
      ).resolves.toEqual({
        completedLessons: 0,
        currentStreakDays: 0,
        lastActiveDate: null,
        progressPercent: 0,
        totalLessons: 0,
      })
      await expect(
        createDrizzleProgressReader(database.db).readLearnerProgress(userId)
      ).resolves.toEqual({
        currentStreakDays: 0,
        lessonProgress: [],
      })
    } finally {
      database.close()
    }
  })

  it("완료·진행 상태와 최신 활동일·연속 학습일을 DB 정렬 결과로 투영한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      seedLearningProjection(database)
      const profile = await createDrizzleProfileReader(
        database.db
      ).readProfileStats(userId)
      const progress = await createDrizzleProgressReader(
        database.db
      ).readLearnerProgress(userId)

      expect(profile).toEqual({
        completedLessons: 1,
        currentStreakDays: 3,
        lastActiveDate: "2026-07-17",
        progressPercent: 50,
        totalLessons: 2,
      })
      expect(progress.currentStreakDays).toBe(3)
      expect(progress.lessonProgress).toHaveLength(2)
      expect(progress.lessonProgress).toEqual(
        expect.arrayContaining([
          {
            currentStepIndex: 1,
            lessonId: "lesson-completed",
            status: "completed",
          },
          {
            currentStepIndex: 0,
            lessonId: "lesson-in-progress",
            status: "in_progress",
          },
        ])
      )
    } finally {
      database.close()
    }
  })
})

function insertAuthUser(database: WritingAppDatabaseClient): void {
  database.db
    .insert(authUsers)
    .values({
      createdAt: now,
      email: "learner-read@example.com",
      emailVerified: true,
      id: userId,
      image: null,
      name: "학습 조회자",
      updatedAt: now,
    })
    .run()
}

function seedLearningProjection(database: WritingAppDatabaseClient): void {
  runBaselineMigration(database.sqlite)
  insertAuthUser(database)

  const courseId = "read-course"
  const curriculumVersionId = "curriculum:read-course:1"

  database.db.transaction((transaction) => {
    transaction
      .insert(courses)
      .values({
        createdAt: now,
        id: courseId,
        publishedCurriculumVersionId: null,
        sortOrder: 1,
        status: "active",
      })
      .run()
    transaction
      .insert(courseCurriculumVersions)
      .values({
        category: "테스트",
        courseId,
        createdAt: now,
        description: "학습 projection 테스트",
        editVersion: 0,
        id: curriculumVersionId,
        publishedAt: null,
        revision: 1,
        status: "draft",
        title: "학습 projection",
        updatedAt: now,
        visualKey: "basic-sentence-writing",
      })
      .run()
    transaction
      .insert(courseUnitVersions)
      .values({
        curriculumVersionId,
        id: "read-unit",
        sortOrder: 1,
        status: "active",
        title: "학습 projection 유닛",
      })
      .run()
    transaction
      .insert(lessonVersions)
      .values([
        {
          category: "테스트",
          curriculumVersionId,
          description: "완료 레슨",
          estimatedMinutes: 5,
          id: "lesson-completed",
          sortOrder: 1,
          status: "active",
          summaryJson: "[]",
          title: "완료 레슨",
          unitId: "read-unit",
        },
        {
          category: "테스트",
          curriculumVersionId,
          description: "진행 레슨",
          estimatedMinutes: 5,
          id: "lesson-in-progress",
          sortOrder: 2,
          status: "active",
          summaryJson: "[]",
          title: "진행 레슨",
          unitId: "read-unit",
        },
      ])
      .run()
    transaction
      .insert(lessonStepVersions)
      .values([
        {
          contentJson: JSON.stringify({
            body: "첫 단계",
            guide: "읽어 보세요.",
            title: "첫 단계",
            type: "reading",
          }),
          curriculumVersionId,
          id: "completed-step-1",
          lessonId: "lesson-completed",
          sortOrder: 1,
          status: "active",
          type: "READING",
        },
        {
          contentJson: JSON.stringify({
            body: "둘째 단계",
            guide: "읽어 보세요.",
            title: "둘째 단계",
            type: "reading",
          }),
          curriculumVersionId,
          id: "completed-step-2",
          lessonId: "lesson-completed",
          sortOrder: 2,
          status: "active",
          type: "READING",
        },
        {
          contentJson: JSON.stringify({
            body: "진행 단계",
            guide: "읽어 보세요.",
            title: "진행 단계",
            type: "reading",
          }),
          curriculumVersionId,
          id: "in-progress-step-1",
          lessonId: "lesson-in-progress",
          sortOrder: 1,
          status: "active",
          type: "READING",
        },
      ])
      .run()
    transaction
      .update(courseCurriculumVersions)
      .set({ publishedAt: now, status: "published", updatedAt: now })
      .run()
    transaction
      .update(courses)
      .set({ publishedCurriculumVersionId: curriculumVersionId })
      .run()
    transaction
      .insert(learnerCourseProgress)
      .values({
        completedAt: null,
        courseId,
        curriculumVersionId,
        lastActivityAt: now,
        startedAt: now,
        status: "in_progress",
        updatedAt: now,
        userId,
      })
      .run()
    transaction
      .insert(learnerLessonProgress)
      .values([
        {
          completedAt: now,
          courseId,
          curriculumVersionId,
          currentStepId: "completed-step-2",
          lessonId: "lesson-completed",
          startedAt: now,
          status: "completed",
          updatedAt: now,
          userId,
        },
        {
          completedAt: null,
          courseId,
          curriculumVersionId,
          currentStepId: "in-progress-step-1",
          lessonId: "lesson-in-progress",
          startedAt: now,
          status: "in_progress",
          updatedAt: now,
          userId,
        },
      ])
      .run()
    transaction
      .insert(learnerActivityDays)
      .values(
        ["2026-07-15", "2026-07-17", "2026-07-16"].map((activityDate) => ({
          activityDate,
          completedLessons: activityDate === "2026-07-17" ? 1 : 0,
          firstActivityAt: now,
          lastActivityAt: now,
          savedAnswers: 0,
          userId,
        }))
      )
      .run()
  })
}
