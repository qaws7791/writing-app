import { Database } from "bun:sqlite"
import { eq } from "drizzle-orm"
import { afterEach, describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { courses, lessons, lessonSteps } from "@/schema"
import { contentSeed, createSeedLessonSteps } from "@/seeds/content-seed"
import { seedContent } from "@/seeds/seed-content"

const sqlite = new Database(":memory:")
const db = createDatabase(sqlite)

afterEach(() => {
  sqlite.exec("delete from lesson_steps")
  sqlite.exec("delete from course_lessons")
  sqlite.exec("delete from lessons")
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

  it("restores declared seed values when seeded rows are stale", async () => {
    runContentMigration(sqlite)
    await seedContent(db)

    await db
      .update(courses)
      .set({ title: "오래된 과정 제목" })
      .where(eq(courses.id, "sentence-structure"))
    await db
      .update(lessonSteps)
      .set({ contentJson: JSON.stringify({ title: "오래된 단계" }) })
      .where(eq(lessonSteps.id, "sentence-structure-01-step-1"))

    await seedContent(db)

    const courseRows = await db
      .select()
      .from(courses)
      .where(eq(courses.id, "sentence-structure"))
    const stepRows = await db
      .select()
      .from(lessonSteps)
      .where(eq(lessonSteps.id, "sentence-structure-01-step-1"))
    const [category] = contentSeed.categories
    const course = category?.courses[0]
    const chapter = course?.chapters[0]
    const lesson = chapter?.lessons[0]

    expect(courseRows[0]?.title).toBe(course?.title)
    if (!category || !course || !lesson) {
      throw new Error("Seed fixture is missing the first lesson.")
    }
    expect(stepRows[0]?.contentJson).toBe(
      JSON.stringify(
        createSeedLessonSteps({
          categoryTitle: category.title,
          courseId: course.id,
          lessonDescription: lesson.description,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        })[0]?.content
      )
    )
  })
})
