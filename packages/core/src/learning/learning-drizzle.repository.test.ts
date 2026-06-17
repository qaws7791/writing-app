import { describe, expect, it } from "vitest"

import { createInMemoryKwepDatabase } from "@workspace/db/client"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"
import { learnerIdSchema } from "@workspace/core/learning"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { createDrizzleLearningRepository } from "@/learning/learning-drizzle.repository"
import {
  authUsers,
  courses,
  courseUnits,
  learnerActivityDays,
  learnerLessonAnswers,
  learnerLessonProgress,
  lessons,
  lessonSteps,
} from "@workspace/db/schema"
import {
  createContentSeedRows,
  readContentSeedData,
} from "@workspace/db/seeds/seed-content"
import type { KwepDatabaseClient } from "@workspace/db/client"

const now = new Date("2026-06-14T09:30:00.000Z")
const userId = learnerIdSchema.parse("user-1")
const lessonId = lessonIdSchema.parse("l1")
const newLessonId = lessonIdSchema.parse("l-new")
const newStepId = lessonStepIdSchema.parse("l-new-s3")

describe("학습 진행 repository", () => {
  it("progress 저장 시 학습 활동 날짜 row를 생성한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedLearningBaseline(client)
      const repository = createDrizzleLearningRepository(client.db)

      await repository.saveLessonProgress({
        currentStepIndex: 2,
        lessonId,
        occurredAt: now,
        userId,
      })

      expect(client.db.select().from(learnerLessonProgress).all()).toEqual([
        expect.objectContaining({
          currentStepIndex: 2,
          lessonId: "l1",
          status: "in_progress",
          userId: "user-1",
        }),
      ])
      expect(client.db.select().from(learnerActivityDays).all()).toEqual([
        expect.objectContaining({
          activityDate: "2026-06-14",
          completedLessons: 0,
          savedAnswers: 0,
          userId: "user-1",
        }),
      ])
    } finally {
      client.close()
    }
  })

  it("KST 기준 다음 날 새벽 활동을 해당 학습일로 저장한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedLearningBaseline(client)
      const repository = createDrizzleLearningRepository(client.db)

      await repository.saveLessonProgress({
        currentStepIndex: 1,
        lessonId,
        occurredAt: new Date("2026-06-14T15:30:00.000Z"),
        userId,
      })

      expect(client.db.select().from(learnerActivityDays).all()).toEqual([
        expect.objectContaining({
          activityDate: "2026-06-15",
          userId: "user-1",
        }),
      ])
    } finally {
      client.close()
    }
  })

  it("answer 저장 시 답변과 활동 날짜의 saved_answers를 갱신한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedLearningBaseline(client)
      const repository = createDrizzleLearningRepository(client.db)

      await repository.saveStepAnswer({
        answer: {
          selectedOptionId: "b",
          type: "MULTIPLE_CHOICE",
        },
        lessonId: newLessonId,
        occurredAt: now,
        stepId: newStepId,
        userId,
      })

      expect(client.db.select().from(learnerLessonAnswers).all()).toEqual([
        expect.objectContaining({
          answerJson: JSON.stringify({
            selectedOptionId: "b",
            type: "MULTIPLE_CHOICE",
          }),
          lessonId: "l-new",
          stepId: "l-new-s3",
          userId: "user-1",
        }),
      ])
      expect(client.db.select().from(learnerActivityDays).all()).toEqual([
        expect.objectContaining({
          activityDate: "2026-06-14",
          completedLessons: 0,
          savedAnswers: 1,
        }),
      ])
    } finally {
      client.close()
    }
  })

  it("lesson 완료 시 progress를 completed로 바꾸고 completed_lessons를 한 번만 증가시킨다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedLearningBaseline(client)
      const repository = createDrizzleLearningRepository(client.db)

      await repository.completeLesson({
        currentStepIndex: 1,
        lessonId,
        occurredAt: now,
        userId,
      })
      await repository.completeLesson({
        currentStepIndex: 1,
        lessonId,
        occurredAt: new Date("2026-06-14T10:00:00.000Z"),
        userId,
      })

      expect(client.db.select().from(learnerLessonProgress).all()).toEqual([
        expect.objectContaining({
          completedAt: now,
          lessonId: "l1",
          status: "completed",
        }),
      ])
      expect(client.db.select().from(learnerActivityDays).all()).toEqual([
        expect.objectContaining({
          activityDate: "2026-06-14",
          completedLessons: 1,
          savedAnswers: 0,
        }),
      ])
    } finally {
      client.close()
    }
  })
})

async function seedLearningBaseline(client: KwepDatabaseClient): Promise<void> {
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

  const rows = createContentSeedRows(await readContentSeedData())

  client.db
    .insert(courses)
    .values([...rows.courses])
    .run()
  client.db
    .insert(courseUnits)
    .values([...rows.units])
    .run()
  client.db
    .insert(lessons)
    .values([...rows.lessons])
    .run()
  client.db
    .insert(lessonSteps)
    .values([...rows.steps])
    .run()
}
