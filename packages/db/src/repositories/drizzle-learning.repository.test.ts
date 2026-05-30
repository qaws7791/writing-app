import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import { courseId, lessonId } from "@workspace/core/content"
import { userId } from "@workspace/core/learning"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { createDrizzleLearningRepository } from "@/repositories/drizzle-learning.repository"
import { user } from "@/schema"
import { seedContent } from "@/seeds/seed-content"

const now = new Date("2026-05-31T00:00:00.000Z")
const learnerId = userId("learner-1")
const sentenceCourseId = courseId("sentence-structure")
const firstLessonId = lessonId("sentence-structure-01")

describe("createDrizzleLearningRepository", () => {
  let sqlite: Database

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)
    await seedContent(db)
    await db.insert(user).values({
      id: learnerId,
      name: "학습자",
      email: "learner@example.com",
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    })
  })

  it("stores course and lesson progress without curriculum version binding", async () => {
    const repository = createDrizzleLearningRepository(createDatabase(sqlite), {
      now: () => now,
    })

    await repository.upsertCourseProgress({
      courseId: sentenceCourseId,
      lastLessonId: firstLessonId,
      userId: learnerId,
    })
    const lessonProgress = await repository.upsertLessonProgress({
      courseId: sentenceCourseId,
      currentStepId: "sentence-structure-01-step-1",
      lessonId: firstLessonId,
      status: "in-progress",
      stepOrder: 1,
      userId: learnerId,
    })

    expect(
      await repository.findCourseProgress(learnerId, sentenceCourseId)
    ).toEqual({
      completedCount: 0,
      courseId: sentenceCourseId,
      lastLessonId: firstLessonId,
    })
    expect(lessonProgress).toMatchObject({
      courseId: sentenceCourseId,
      currentStepId: "sentence-structure-01-step-1",
      lessonId: firstLessonId,
      status: "in-progress",
      stepOrder: 1,
    })
  })

  it("lists current course lesson IDs in curriculum order", async () => {
    const repository = createDrizzleLearningRepository(createDatabase(sqlite))

    const lessonIds = await repository.listCourseLessonIds(sentenceCourseId)

    expect(lessonIds[0]).toBe("sentence-structure-01")
    expect(lessonIds.at(-1)).toBe("sentence-structure-12")
  })

  it("checks whether a lesson belongs to the current course curriculum", async () => {
    const repository = createDrizzleLearningRepository(createDatabase(sqlite))

    await expect(
      repository.courseIncludesLesson(sentenceCourseId, firstLessonId)
    ).resolves.toBe(true)
    await expect(
      repository.courseIncludesLesson(sentenceCourseId, lessonId("not-real"))
    ).resolves.toBe(false)
  })

  it("completes a lesson and updates completed course count", async () => {
    const repository = createDrizzleLearningRepository(createDatabase(sqlite), {
      now: () => now,
    })

    const result = await repository.completeLesson({
      courseId: sentenceCourseId,
      finalStepId: "sentence-structure-01-step-5",
      lessonId: firstLessonId,
      stepOrder: 5,
      userId: learnerId,
    })

    expect(result).toEqual({
      completedAt: now,
      completedCount: 1,
      wasAlreadyCompleted: false,
    })
    await expect(
      repository.findCourseProgress(learnerId, sentenceCourseId)
    ).resolves.toMatchObject({
      completedCount: 1,
      lastLessonId: firstLessonId,
    })
  })
})
