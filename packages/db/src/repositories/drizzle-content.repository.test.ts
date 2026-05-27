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
import {
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
} from "@/schema"
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

  it("uses the latest published curriculum version for course summaries and detail", async () => {
    const db = createDatabase(sqlite)
    await db.insert(curriculumVersions).values({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "published",
      title: "문장 구조의 기본 v2",
      changelog: "공개 조회 기준 검증",
      publishedAt: new Date("2026-05-28T00:00:00.000Z"),
      createdAt: new Date("2026-05-28T00:00:00.000Z"),
    })
    await db.insert(curriculumVersionChapters).values({
      id: "sentence-structure-chapter-1-v2",
      curriculumVersionId: "sentence-structure-v2",
      sourceChapterId: "sentence-structure-chapter-1",
      label: "1단원",
      title: "새 문장의 뼈대",
      sortOrder: 1,
      status: "active",
    })
    await db.insert(curriculumVersionLessons).values({
      id: "sentence-structure-01-v2",
      curriculumVersionId: "sentence-structure-v2",
      chapterId: "sentence-structure-chapter-1-v2",
      lessonId: "sentence-structure-01",
      title: "새 주어와 서술어 찾기",
      description: "최신 published 버전의 레슨 설명입니다.",
      sortOrder: 1,
      status: "active",
    })
    const repository = createDrizzleContentRepository(db)

    const categories = await repository.listCourseCategories()
    const sentenceStructure = categories.categories
      .flatMap((category) => category.courses)
      .find((course) => course.id === "sentence-structure")
    const detail = await repository.findCourseDetail(
      courseId("sentence-structure")
    )

    expect(sentenceStructure?.lessonCount).toBe(1)
    expect(detail?.lessonCount).toBe(1)
    expect(detail?.firstLessonId).toBe("sentence-structure-01")
    expect(detail?.chapters).toEqual([
      {
        id: "sentence-structure-chapter-1-v2",
        label: "1단원",
        title: "새 문장의 뼈대",
        lessons: [
          {
            id: "sentence-structure-01-v2",
            lessonId: "sentence-structure-01",
            title: "새 주어와 서술어 찾기",
            description: "최신 published 버전의 레슨 설명입니다.",
            order: 1,
          },
        ],
      },
    ])
  })

  it("hides archived and deprecated nodes from public curriculum paths", async () => {
    const db = createDatabase(sqlite)
    await db.insert(curriculumVersions).values({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "published",
      title: "문장 구조의 기본 v2",
      changelog: "상태 정책 검증",
      publishedAt: new Date("2026-05-28T00:00:00.000Z"),
      createdAt: new Date("2026-05-28T00:00:00.000Z"),
    })
    await db.insert(curriculumVersionChapters).values([
      {
        id: "sentence-structure-active-chapter-v2",
        curriculumVersionId: "sentence-structure-v2",
        sourceChapterId: "sentence-structure-chapter-1",
        label: "1단원",
        title: "공개 챕터",
        sortOrder: 1,
        status: "active",
      },
      {
        id: "sentence-structure-archived-chapter-v2",
        curriculumVersionId: "sentence-structure-v2",
        sourceChapterId: "sentence-structure-chapter-2",
        label: "2단원",
        title: "숨김 챕터",
        sortOrder: 2,
        status: "archived",
      },
    ])
    await db.insert(curriculumVersionLessons).values([
      {
        id: "sentence-structure-active-lesson-v2",
        curriculumVersionId: "sentence-structure-v2",
        chapterId: "sentence-structure-active-chapter-v2",
        lessonId: "sentence-structure-01",
        title: "공개 레슨",
        description: "공개되는 레슨입니다.",
        sortOrder: 1,
        status: "active",
      },
      {
        id: "sentence-structure-deprecated-lesson-v2",
        curriculumVersionId: "sentence-structure-v2",
        chapterId: "sentence-structure-active-chapter-v2",
        lessonId: "sentence-structure-02",
        title: "대체 예정 레슨",
        description: "공개 경로에서는 숨깁니다.",
        sortOrder: 2,
        status: "deprecated",
      },
      {
        id: "sentence-structure-archived-lesson-v2",
        curriculumVersionId: "sentence-structure-v2",
        chapterId: "sentence-structure-archived-chapter-v2",
        lessonId: "sentence-structure-03",
        title: "숨김 레슨",
        description: "숨김 챕터 하위 레슨입니다.",
        sortOrder: 1,
        status: "active",
      },
    ])
    const repository = createDrizzleContentRepository(db)

    const categories = await repository.listCourseCategories()
    const search = await repository.searchCourses("문장")
    const detail = await repository.findCourseDetail(
      courseId("sentence-structure")
    )

    const summary = categories.categories
      .flatMap((category) => category.courses)
      .find((course) => course.id === "sentence-structure")
    const searchSummary = search.courses.find(
      (course) => course.id === "sentence-structure"
    )

    expect(summary?.lessonCount).toBe(1)
    expect(searchSummary?.lessonCount).toBe(1)
    expect(detail?.lessonCount).toBe(1)
    expect(detail?.chapters).toEqual([
      {
        id: "sentence-structure-active-chapter-v2",
        label: "1단원",
        title: "공개 챕터",
        lessons: [
          {
            id: "sentence-structure-active-lesson-v2",
            lessonId: "sentence-structure-01",
            title: "공개 레슨",
            description: "공개되는 레슨입니다.",
            order: 1,
          },
        ],
      },
    ])
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
