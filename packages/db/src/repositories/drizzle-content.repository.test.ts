import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import {
  courseId,
  createContentService,
  lessonId,
} from "@workspace/core/content"

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
    const beginnerCourses = result.categories.find(
      (category) => category.id === "beginner"
    )?.courses

    expect(result.categories[0]?.id).toBe("beginner")
    expect(beginnerCourses?.[0]).toMatchObject({
      id: "sentence-structure",
      lessonCount: 12,
    })
    expect(beginnerCourses?.map((course) => course.id)).toContain(
      "vocabulary-basics"
    )
    expect(
      beginnerCourses?.find((course) => course.id === "vocabulary-basics")
    ).toMatchObject({
      lessonCount: 10,
    })
  })

  it("finds current frontend catalog course details", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const sentenceStructure = await repository.findCourseDetail(
      courseId("sentence-structure")
    )
    const vocabularyBasics = await repository.findCourseDetail(
      courseId("vocabulary-basics")
    )

    expect(sentenceStructure?.lessonCount).toBe(12)
    expect(
      sentenceStructure?.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => lesson.lessonId)
      )
    ).toContain("sentence-structure-12")
    expect(vocabularyBasics?.firstLessonId).toBe("vocabulary-basics-01")
    expect(vocabularyBasics?.lessonCount).toBe(10)
  })

  it("searches courses by title and description", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.searchCourses("문장")

    expect(result.courses.map((course) => course.id)).toContain(
      "sentence-structure"
    )
  })

  it("finds playable seed lessons beyond the first lesson", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findLesson(
      lessonId("sentence-structure-02")
    )

    expect(result?.id).toBe("sentence-structure-02")
    expect(result?.steps.map((step) => step.type)).toEqual([
      "INTRO",
      "SHORT_WRITE",
      "AI_FEEDBACK",
      "SUMMARY",
      "COMPLETE",
    ])
    expect(result?.steps).toHaveLength(5)
    expect(result?.nextLessonId).toBe("sentence-structure-03")
  })

  it("links the next lesson across chapter boundaries", async () => {
    const repository = createDrizzleContentRepository(createDatabase(sqlite))

    const result = await repository.findLesson(
      lessonId("sentence-structure-04")
    )

    expect(result?.nextLessonId).toBe("sentence-structure-05")
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
