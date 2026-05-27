import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import {
  createDatabase,
  createDrizzleAdminRepository,
  runContentMigration,
} from "@/index"
import {
  courseCategories,
  courseChapters,
  courseLessons,
  courses,
  lessons,
  user,
} from "@/schema"

describe("createDrizzleAdminRepository", () => {
  it("lists paginated courses filtered by title or description", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)
    await db.insert(courseCategories).values({
      id: "category-writing",
      title: "글쓰기",
      sortOrder: 1,
    })
    await db.insert(courses).values([
      {
        id: "course-unmatched",
        categoryId: "category-writing",
        title: "어휘 기초",
        description: "검색되지 않는 코스",
        thumbnailPath: "/images/course-unmatched.png",
        sortOrder: 1,
      },
      ...Array.from({ length: 11 }, (_, index) => ({
        id: `course-sentence-${index + 1}`,
        categoryId: "category-writing",
        title:
          index === 10
            ? "마지막 결과"
            : `문장 구조 ${String(index + 1).padStart(2, "0")}`,
        description: index === 10 ? "문장 검색 설명" : "문장 학습 코스",
        thumbnailPath: `/images/course-sentence-${index + 1}.png`,
        sortOrder: index + 2,
      })),
    ])

    const repository = createDrizzleAdminRepository(db)
    const result = await repository.listCourses({
      page: 2,
      pageSize: 10,
      query: "문장",
    })

    expect(result).toEqual({
      courses: [
        {
          id: "course-sentence-11",
          title: "마지막 결과",
          description: "문장 검색 설명",
          sortOrder: 12,
        },
      ],
      pagination: {
        page: 2,
        pageSize: 10,
        totalCount: 11,
        totalPages: 2,
      },
      query: "문장",
    })
  })

  it("lists courses with chapters and lessons", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)
    await db.insert(courseCategories).values({
      id: "category-writing",
      title: "글쓰기",
      sortOrder: 1,
    })
    await db.insert(courses).values([
      {
        id: "course-later",
        categoryId: "category-writing",
        title: "나중 코스",
        description: "두 번째로 정렬되는 코스",
        thumbnailPath: "/images/course-later.png",
        sortOrder: 2,
      },
      {
        id: "course-earlier",
        categoryId: "category-writing",
        title: "먼저 코스",
        description: "첫 번째로 정렬되는 코스",
        thumbnailPath: "/images/course-earlier.png",
        sortOrder: 1,
      },
    ])
    await db.insert(courseChapters).values([
      {
        id: "chapter-second",
        courseId: "course-earlier",
        label: "2장",
        title: "퇴고하기",
        sortOrder: 2,
      },
      {
        id: "chapter-other-course",
        courseId: "course-later",
        label: "1장",
        title: "다른 코스 챕터",
        sortOrder: 1,
      },
      {
        id: "chapter-first",
        courseId: "course-earlier",
        label: "1장",
        title: "문장 시작하기",
        sortOrder: 1,
      },
    ])
    await db.insert(lessons).values([
      {
        id: "lesson-second",
        courseId: "course-earlier",
        title: "둘째 레슨 원본",
        categoryId: "category-writing",
        unitNumber: 2,
        nextLessonId: null,
      },
      {
        id: "lesson-third",
        courseId: "course-earlier",
        title: "셋째 레슨 원본",
        categoryId: "category-writing",
        unitNumber: 3,
        nextLessonId: null,
      },
      {
        id: "lesson-other-course",
        courseId: "course-later",
        title: "다른 코스 레슨 원본",
        categoryId: "category-writing",
        unitNumber: 1,
        nextLessonId: null,
      },
      {
        id: "lesson-first",
        courseId: "course-earlier",
        title: "첫째 레슨 원본",
        categoryId: "category-writing",
        unitNumber: 1,
        nextLessonId: "lesson-second",
      },
    ])
    await db.insert(courseLessons).values([
      {
        id: "course-lesson-second",
        chapterId: "chapter-first",
        lessonId: "lesson-second",
        title: "둘째 표시 레슨",
        description: "두 번째로 정렬되는 레슨",
        sortOrder: 2,
      },
      {
        id: "course-lesson-third",
        chapterId: "chapter-second",
        lessonId: "lesson-third",
        title: "셋째 표시 레슨",
        description: "둘째 챕터의 첫 레슨",
        sortOrder: 1,
      },
      {
        id: "course-lesson-other-course",
        chapterId: "chapter-other-course",
        lessonId: "lesson-other-course",
        title: "다른 코스 표시 레슨",
        description: "다른 코스에 속한 레슨",
        sortOrder: 1,
      },
      {
        id: "course-lesson-first",
        chapterId: "chapter-first",
        lessonId: "lesson-first",
        title: "첫째 표시 레슨",
        description: "첫 번째로 정렬되는 레슨",
        sortOrder: 1,
      },
    ])

    const repository = createDrizzleAdminRepository(db)
    const result = await repository.listCourseTree()

    expect(result).toEqual({
      courses: [
        {
          id: "course-earlier",
          title: "먼저 코스",
          description: "첫 번째로 정렬되는 코스",
          sortOrder: 1,
          chapters: [
            {
              id: "chapter-first",
              label: "1장",
              title: "문장 시작하기",
              sortOrder: 1,
              lessons: [
                {
                  id: "course-lesson-first",
                  lessonId: "lesson-first",
                  title: "첫째 표시 레슨",
                  description: "첫 번째로 정렬되는 레슨",
                  sortOrder: 1,
                },
                {
                  id: "course-lesson-second",
                  lessonId: "lesson-second",
                  title: "둘째 표시 레슨",
                  description: "두 번째로 정렬되는 레슨",
                  sortOrder: 2,
                },
              ],
            },
            {
              id: "chapter-second",
              label: "2장",
              title: "퇴고하기",
              sortOrder: 2,
              lessons: [
                {
                  id: "course-lesson-third",
                  lessonId: "lesson-third",
                  title: "셋째 표시 레슨",
                  description: "둘째 챕터의 첫 레슨",
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
        {
          id: "course-later",
          title: "나중 코스",
          description: "두 번째로 정렬되는 코스",
          sortOrder: 2,
          chapters: [
            {
              id: "chapter-other-course",
              label: "1장",
              title: "다른 코스 챕터",
              sortOrder: 1,
              lessons: [
                {
                  id: "course-lesson-other-course",
                  lessonId: "lesson-other-course",
                  title: "다른 코스 표시 레슨",
                  description: "다른 코스에 속한 레슨",
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it("lists basic platform users", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)
    await db.insert(user).values([
      {
        id: "user-later",
        name: "늦은 학습자",
        email: "later@example.com",
        emailVerified: false,
        image: "https://example.com/later.png",
        createdAt: new Date("2026-05-27T00:00:00.000Z"),
        updatedAt: new Date("2026-05-27T01:00:00.000Z"),
      },
      {
        id: "user-earlier",
        name: "이른 학습자",
        email: "earlier@example.com",
        emailVerified: true,
        image: null,
        createdAt: new Date("2026-05-26T00:00:00.000Z"),
        updatedAt: new Date("2026-05-26T01:00:00.000Z"),
      },
    ])

    const repository = createDrizzleAdminRepository(db)
    const result = await repository.listUsers()

    expect(result.users).toEqual([
      {
        id: "user-earlier",
        name: "이른 학습자",
        email: "earlier@example.com",
        emailVerified: true,
        image: null,
        createdAt: "2026-05-26T00:00:00.000Z",
        updatedAt: "2026-05-26T01:00:00.000Z",
      },
      {
        id: "user-later",
        name: "늦은 학습자",
        email: "later@example.com",
        emailVerified: false,
        image: "https://example.com/later.png",
        createdAt: "2026-05-27T00:00:00.000Z",
        updatedAt: "2026-05-27T01:00:00.000Z",
      },
    ])
  })
})
