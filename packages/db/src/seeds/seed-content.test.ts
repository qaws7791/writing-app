import { Database } from "bun:sqlite"
import { afterEach, describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { courses, lessons, lessonSteps } from "@/schema"
import { seedContent } from "@/seeds/seed-content"

const sqlite = new Database(":memory:")
const db = createDatabase(sqlite)

afterEach(() => {
  sqlite.exec("delete from lesson_steps")
  sqlite.exec("delete from lessons")
  sqlite.exec("delete from course_lessons")
  sqlite.exec("delete from course_chapters")
  sqlite.exec("delete from courses")
  sqlite.exec("delete from course_categories")
})

describe("seedContent", () => {
  it("inserts deterministic course and lesson rows", async () => {
    runContentMigration(sqlite)

    await seedContent(db)

    const courseRows = await db.select().from(courses)
    const lessonRows = await db.select().from(lessons)
    const stepRows = await db.select().from(lessonSteps)

    expect(courseRows.map((course) => course.id)).toContain(
      "sentence-structure"
    )
    expect(lessonRows.map((lesson) => lesson.id)).toContain(
      "sentence-structure-01"
    )
    expect(
      stepRows.filter((step) => step.lessonId === "sentence-structure-01")
    ).toHaveLength(3)
  })
})
