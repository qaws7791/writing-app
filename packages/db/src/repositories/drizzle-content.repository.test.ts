import { Database } from "bun:sqlite"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"

import {
  courseId,
  createContentService,
  lessonId,
} from "@workspace/core/content"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { createDrizzleContentRepository } from "@/repositories/drizzle-content.repository"
import { courseChapters, courseLessons } from "@/schema"
import { seedContent } from "@/seeds/seed-content"

describe("createDrizzleContentRepository", () => {
  let sqlite: Database

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    await seedContent(createDatabase(sqlite))
  })

  it("lists course categories with current curriculum lesson counts", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.listCourseCategories()
    const beginnerCourses = result.categories.find(
      (category) => category.id === "beginner"
    )?.courses

    expect(result.categories[0]?.id).toBe("beginner")
    expect(beginnerCourses?.[0]).toMatchObject({
      id: "sentence-structure",
      lessonCount: 12,
    })
  })

  it("finds current course details from course chapters and lessons", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findCourseDetail(
      courseId("sentence-structure")
    )

    expect(result?.firstLessonId).toBe("sentence-structure-01")
    expect(result?.lessonCount).toBe(12)
    expect(
      result?.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => lesson.lessonId)
      )
    ).toContain("sentence-structure-12")
  })

  it("hides archived and deprecated nodes from public curriculum paths", async () => {
    const db = createDatabase(sqlite)
    await db
      .update(courseChapters)
      .set({ status: "archived" })
      .where(eq(courseChapters.id, "sentence-structure-chapter-2"))
    await db
      .update(courseLessons)
      .set({ status: "deprecated" })
      .where(eq(courseLessons.id, "sentence-structure-02"))
    const repository = createDrizzleContentRepository(db)

    const detail = await repository.findCourseDetail(
      courseId("sentence-structure")
    )

    expect(detail?.chapters.map((chapter) => chapter.id)).not.toContain(
      "sentence-structure-chapter-2"
    )
    expect(
      detail?.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => lesson.lessonId)
      )
    ).not.toContain("sentence-structure-02")
  })

  it("finds playable lesson content by ID", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findLesson(
      lessonId("sentence-structure-01")
    )

    expect(result?.id).toBe("sentence-structure-01")
    expect(result?.steps.map((step) => step.type)).toEqual([
      "INTRO",
      "SHORT_WRITE",
      "AI_FEEDBACK",
      "SUMMARY",
      "COMPLETE",
    ])
  })

  it("reports invalid content when lesson step JSON is malformed", async () => {
    sqlite
      .query("update lesson_steps set content_json = ? where id = ?")
      .run("not-json", "sentence-structure-01-step-1")
    const repository = createDrizzleContentRepository(createDatabase(sqlite))
    const service = createContentService({ repository })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toMatchObject({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
      },
    })
  })
})
