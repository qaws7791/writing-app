import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import { courseId, lessonId } from "@workspace/core/content"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { createDrizzleContentRepository } from "@/repositories/drizzle-content.repository"
import { seedContent } from "@/seeds/seed-content"

describe("createDrizzleContentRepository", () => {
  let sqlite: Database

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    await seedContent(createDatabase(sqlite))
  })

  it("lists course categories with course summaries", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.listCourseCategories()

    expect(result.categories[0]?.id).toBe("beginner")
    expect(result.categories[0]?.courses[0]).toMatchObject({
      id: "sentence-structure",
      lessonCount: 1,
    })
  })

  it("finds course detail by ID", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findCourseDetail(
      courseId("sentence-structure")
    )

    expect(result?.firstLessonId).toBe("sentence-structure-01")
    expect(result?.chapters[0]?.lessons[0]?.order).toBe(1)
  })

  it("returns undefined for an unknown course", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findCourseDetail(courseId("not-real"))

    expect(result).toBeUndefined()
  })

  it("finds playable lesson content by ID", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findLesson(
      lessonId("sentence-structure-01")
    )

    expect(result?.id).toBe("sentence-structure-01")
    expect(result?.steps.map((step) => step.type)).toEqual([
      "INTRO",
      "SUMMARY",
      "COMPLETE",
    ])
  })
})
