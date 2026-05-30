import { Database } from "bun:sqlite"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { createDrizzleAdminRepository } from "@/repositories/drizzle-admin.repository"
import { courseChapters, courseLessons, courses, lessonSteps } from "@/schema"
import { seedContent } from "@/seeds/seed-content"

describe("createDrizzleAdminRepository", () => {
  let sqlite: Database

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    await seedContent(createDatabase(sqlite))
  })

  it("returns a current curriculum editor document", async () => {
    const repository = createDrizzleAdminRepository(createDatabase(sqlite))

    const document =
      await repository.getCourseEditorDocument("sentence-structure")

    expect(document?.course).toMatchObject({
      id: "sentence-structure",
      title: "문장 구조의 기본",
    })
    expect(document?.revision).toBe(0)
    expect(document?.curriculum.chapters).toHaveLength(3)
    expect(document?.curriculum.steps.map((step) => step.lessonId)).toContain(
      "sentence-structure-01"
    )
  })

  it("saves the current curriculum directly", async () => {
    const db = createDatabase(sqlite)
    const repository = createDrizzleAdminRepository(db)
    const document =
      await repository.getCourseEditorDocument("sentence-structure")

    if (!document) {
      throw new Error("Editor document is missing.")
    }

    const result = await repository.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: document.revision,
      course: {
        title: "새 코스 제목",
        description: document.course.description,
        sortOrder: document.course.sortOrder,
      },
      chapters: [
        {
          id: "sentence-structure-chapter-1",
          title: "새 챕터",
          sortOrder: 1,
          status: "active",
        },
      ],
      lessons: [
        {
          id: "sentence-structure-01",
          chapterId: "sentence-structure-chapter-1",
          lessonId: "sentence-structure-01",
          title: "새 레슨",
          description: "새 레슨 설명",
          sortOrder: 1,
          status: "active",
        },
      ],
      steps: document.curriculum.steps.filter(
        (step) => step.lessonId === "sentence-structure-01"
      ),
    })

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, "sentence-structure"))
    const chapters = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.courseId, "sentence-structure"))
    const lessons = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.chapterId, "sentence-structure-chapter-1"))

    expect(result.status).toBe("saved")
    if (result.status !== "saved") {
      throw new Error("Editor document save failed.")
    }
    expect(result.document.revision).toBe(document.revision + 1)
    expect(course?.title).toBe("새 코스 제목")
    expect(
      chapters.find((chapter) => chapter.id === "sentence-structure-chapter-1")
        ?.title
    ).toBe("새 챕터")
    expect(
      chapters.filter((chapter) => chapter.status === "active")
    ).toHaveLength(1)
    expect(
      lessons.find((lesson) => lesson.id === "sentence-structure-01")?.title
    ).toBe("새 레슨")
    expect(lessons.filter((lesson) => lesson.status === "active")).toHaveLength(
      1
    )
  })

  it("rejects stale current curriculum saves without changing rows", async () => {
    const db = createDatabase(sqlite)
    const repository = createDrizzleAdminRepository(db)
    const document =
      await repository.getCourseEditorDocument("sentence-structure")

    if (!document) {
      throw new Error("Editor document is missing.")
    }

    const firstSave = await repository.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: document.revision,
      course: {
        ...document.course,
        title: "먼저 저장한 제목",
      },
      chapters: document.curriculum.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        sortOrder: chapter.sortOrder,
        status: chapter.status,
      })),
      lessons: document.curriculum.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          ...lesson,
          chapterId: chapter.id,
        }))
      ),
      steps: document.curriculum.steps,
    })

    expect(firstSave.status).toBe("saved")

    const staleSave = await repository.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: document.revision,
      course: {
        ...document.course,
        title: "나중에 저장한 제목",
      },
      chapters: [],
      lessons: [],
      steps: [],
    })

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, "sentence-structure"))
    const chapters = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.courseId, "sentence-structure"))

    expect(staleSave).toEqual({
      status: "conflict",
      error: {
        code: "conflict",
        message: "다른 관리자가 먼저 저장했습니다.",
      },
    })
    expect(course?.title).toBe("먼저 저장한 제목")
    expect(chapters.length).toBeGreaterThan(0)
  })

  it("archives omitted chapters and lessons instead of deleting them", async () => {
    const db = createDatabase(sqlite)
    const repository = createDrizzleAdminRepository(db)
    const document =
      await repository.getCourseEditorDocument("sentence-structure")

    if (!document) {
      throw new Error("Editor document is missing.")
    }

    await repository.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: document.revision,
      course: document.course,
      chapters: [
        {
          id: "sentence-structure-chapter-1",
          title: "문장의 뼈대",
          sortOrder: 1,
          status: "active",
        },
      ],
      lessons: [
        {
          id: "sentence-structure-01",
          chapterId: "sentence-structure-chapter-1",
          lessonId: "sentence-structure-01",
          title: "주어와 서술어 찾기",
          description: "중심 성분을 구분합니다.",
          sortOrder: 1,
          status: "active",
        },
      ],
      steps: document.curriculum.steps.filter(
        (step) => step.lessonId === "sentence-structure-01"
      ),
    })

    const [omittedChapter] = await db
      .select()
      .from(courseChapters)
      .where(eq(courseChapters.id, "sentence-structure-chapter-2"))
    const [omittedLesson] = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.id, "sentence-structure-02"))

    expect(omittedChapter?.status).toBe("archived")
    expect(omittedLesson?.status).toBe("archived")
  })

  it("archives omitted existing steps instead of deleting them", async () => {
    const db = createDatabase(sqlite)
    const repository = createDrizzleAdminRepository(db)
    const document =
      await repository.getCourseEditorDocument("sentence-structure")

    if (!document) {
      throw new Error("Editor document is missing.")
    }

    await repository.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: document.revision,
      course: document.course,
      chapters: document.curriculum.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        sortOrder: chapter.sortOrder,
        status: chapter.status,
      })),
      lessons: document.curriculum.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          ...lesson,
          chapterId: chapter.id,
        }))
      ),
      steps: document.curriculum.steps.filter(
        (step) => step.id !== "sentence-structure-01-step-1"
      ),
    })

    const [step] = await db
      .select()
      .from(lessonSteps)
      .where(eq(lessonSteps.id, "sentence-structure-01-step-1"))

    expect(step?.status).toBe("archived")
  })

  it("archives existing lesson steps when the editor saves an empty step list", async () => {
    const db = createDatabase(sqlite)
    const repository = createDrizzleAdminRepository(db)
    const document =
      await repository.getCourseEditorDocument("sentence-structure")

    if (!document) {
      throw new Error("Editor document is missing.")
    }

    await repository.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: document.revision,
      course: document.course,
      chapters: [
        {
          id: "sentence-structure-chapter-1",
          title: "문장의 뼈대",
          sortOrder: 1,
          status: "active",
        },
      ],
      lessons: [
        {
          id: "sentence-structure-01",
          chapterId: "sentence-structure-chapter-1",
          lessonId: "sentence-structure-01",
          title: "주어와 서술어 찾기",
          description: "중심 성분을 구분합니다.",
          sortOrder: 1,
          status: "active",
        },
      ],
      steps: [],
    })

    const archivedSteps = await db
      .select()
      .from(lessonSteps)
      .where(eq(lessonSteps.lessonId, "sentence-structure-01"))

    expect(archivedSteps.length).toBeGreaterThan(0)
    expect(archivedSteps.every((step) => step.status === "archived")).toBe(true)
  })
})
