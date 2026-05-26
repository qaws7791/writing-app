import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import { courseId, lessonId } from "@workspace/core/content"
import { userId } from "@workspace/core/learning"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { createDrizzleLearningRepository } from "@/repositories/drizzle-learning.repository"
import { user } from "@/schema"
import { seedContent } from "@/seeds/seed-content"

describe("platform backend migrations", () => {
  it("creates auth and learning tables", () => {
    const sqlite = new Database(":memory:")

    runContentMigration(sqlite)
    createDatabase(sqlite)

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table'"
      )
      .all()
      .map((table) => table.name)

    expect(tables).toContain("user")
    expect(tables).toContain("session")
    expect(tables).toContain("account")
    expect(tables).toContain("verification")
    expect(tables).toContain("course_progress")
    expect(tables).toContain("lesson_progress")
    expect(tables).toContain("lesson_answers")
    expect(tables).toContain("feedback_attempts")
  })
})

describe("createDrizzleLearningRepository", () => {
  const now = new Date("2026-05-26T00:00:00.000Z")
  let sqlite: Database
  let db: ReturnType<typeof createDatabase>

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    db = createDatabase(sqlite)
    await seedContent(db)
    await db.insert(user).values({
      id: "user-1",
      name: "테스트 사용자",
      email: "learner@example.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
  })

  it("upserts and reads course progress", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })

    await repository.upsertCourseProgress({
      courseId: courseId("sentence-structure"),
      lastLessonId: lessonId("sentence-structure-01"),
      userId: userId("user-1"),
    })
    await repository.upsertCourseProgress({
      courseId: courseId("sentence-structure"),
      lastLessonId: lessonId("sentence-structure-02"),
      userId: userId("user-1"),
    })

    const progress = await repository.findCourseProgress(
      userId("user-1"),
      courseId("sentence-structure")
    )

    expect(progress).toEqual({
      completedCount: 0,
      courseId: courseId("sentence-structure"),
      lastLessonId: lessonId("sentence-structure-02"),
    })
  })

  it("upserts lesson progress and answers", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })

    await repository.upsertLessonProgress({
      courseId: courseId("sentence-structure"),
      currentStepId: "sentence-structure-01-step-1",
      lessonId: lessonId("sentence-structure-01"),
      status: "in-progress",
      stepOrder: 1,
      userId: userId("user-1"),
    })
    const progress = await repository.upsertLessonProgress({
      courseId: courseId("sentence-structure"),
      currentStepId: "sentence-structure-01-step-2",
      lessonId: lessonId("sentence-structure-01"),
      status: "in-progress",
      stepOrder: 2,
      userId: userId("user-1"),
    })
    await repository.upsertLessonAnswer({
      answer: "첫 답변",
      lessonId: lessonId("sentence-structure-01"),
      stepId: "sentence-structure-01-step-2",
      userId: userId("user-1"),
    })
    await repository.upsertLessonAnswer({
      answer: "수정 답변",
      lessonId: lessonId("sentence-structure-01"),
      stepId: "sentence-structure-01-step-2",
      userId: userId("user-1"),
    })

    const answers = await repository.listLessonAnswers(
      userId("user-1"),
      lessonId("sentence-structure-01")
    )

    expect(progress).toMatchObject({
      currentStepId: "sentence-structure-01-step-2",
      stepOrder: 2,
    })
    expect(answers).toEqual([
      {
        answer: "수정 답변",
        lessonId: lessonId("sentence-structure-01"),
        stepId: "sentence-structure-01-step-2",
      },
    ])
  })

  it("completes a lesson idempotently and updates course progress", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })

    const first = await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      finalStepId: "sentence-structure-01-step-3",
      lessonId: lessonId("sentence-structure-01"),
      stepOrder: 3,
      userId: userId("user-1"),
    })
    const second = await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      finalStepId: "sentence-structure-01-step-3",
      lessonId: lessonId("sentence-structure-01"),
      stepOrder: 3,
      userId: userId("user-1"),
    })
    const courseProgress = await repository.findCourseProgress(
      userId("user-1"),
      courseId("sentence-structure")
    )

    expect(first).toEqual({
      completedAt: now,
      completedCount: 1,
      wasAlreadyCompleted: false,
    })
    expect(second).toEqual({
      completedAt: now,
      completedCount: 1,
      wasAlreadyCompleted: true,
    })
    expect(courseProgress).toMatchObject({
      completedCount: 1,
      lastLessonId: lessonId("sentence-structure-01"),
    })
  })
})
