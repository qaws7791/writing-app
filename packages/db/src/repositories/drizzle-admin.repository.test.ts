import { Database } from "bun:sqlite"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { courseId } from "@workspace/core/content"

import {
  createDatabase,
  createDrizzleAdminRepository,
  createDrizzleContentRepository,
  runContentMigration,
  seedContent,
} from "@/index"
import {
  curriculumMigrationApplications,
  courseProgress,
  courseCategories,
  courseChapters,
  courseLessons,
  courses,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  lessons,
  lessonProgress,
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
          thumbnailPath: "/images/course-sentence-11.png",
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

  it("lists latest published curriculum tree with node statuses", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)
    const now = new Date("2026-05-28T00:00:00.000Z")
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
    await db.insert(curriculumVersions).values([
      {
        id: "course-earlier-v1",
        courseId: "course-earlier",
        versionNumber: 1,
        status: "published",
        title: "먼저 코스 v1",
        changelog: "이전 버전",
        publishedAt: now,
        createdAt: now,
      },
      {
        id: "course-earlier-v2",
        courseId: "course-earlier",
        versionNumber: 2,
        status: "published",
        title: "먼저 코스 v2",
        changelog: "상태 표시 검증",
        publishedAt: now,
        createdAt: now,
      },
      {
        id: "course-later-v1",
        courseId: "course-later",
        versionNumber: 1,
        status: "published",
        title: "나중 코스 v1",
        changelog: "상태 표시 검증",
        publishedAt: now,
        createdAt: now,
      },
    ])
    await db.insert(curriculumVersionChapters).values([
      {
        id: "version-chapter-first-v1",
        curriculumVersionId: "course-earlier-v1",
        sourceChapterId: "chapter-first",
        label: "1장",
        title: "이전 문장 시작하기",
        sortOrder: 1,
        status: "active",
      },
      {
        id: "version-chapter-first-v2",
        curriculumVersionId: "course-earlier-v2",
        sourceChapterId: "chapter-first",
        label: "1장",
        title: "문장 시작하기",
        sortOrder: 1,
        status: "deprecated",
      },
      {
        id: "version-chapter-second-v2",
        curriculumVersionId: "course-earlier-v2",
        sourceChapterId: "chapter-second",
        label: "2장",
        title: "퇴고하기",
        sortOrder: 2,
        status: "archived",
      },
      {
        id: "version-chapter-other-v1",
        curriculumVersionId: "course-later-v1",
        sourceChapterId: "chapter-other-course",
        label: "1장",
        title: "다른 코스 챕터",
        sortOrder: 1,
        status: "active",
      },
    ])
    await db.insert(curriculumVersionLessons).values([
      {
        id: "version-lesson-first-v1",
        curriculumVersionId: "course-earlier-v1",
        chapterId: "version-chapter-first-v1",
        lessonId: "lesson-first",
        title: "이전 첫째 표시 레슨",
        description: "이전 버전의 첫 레슨",
        sortOrder: 1,
        status: "active",
      },
      {
        id: "version-lesson-first-v2",
        curriculumVersionId: "course-earlier-v2",
        chapterId: "version-chapter-first-v2",
        lessonId: "lesson-first",
        title: "첫째 표시 레슨",
        description: "첫 번째로 정렬되는 레슨",
        sortOrder: 1,
        status: "active",
      },
      {
        id: "version-lesson-second-v2",
        curriculumVersionId: "course-earlier-v2",
        chapterId: "version-chapter-first-v2",
        lessonId: "lesson-second",
        title: "둘째 표시 레슨",
        description: "두 번째로 정렬되는 레슨",
        sortOrder: 2,
        status: "archived",
      },
      {
        id: "version-lesson-third-v2",
        curriculumVersionId: "course-earlier-v2",
        chapterId: "version-chapter-second-v2",
        lessonId: "lesson-third",
        title: "셋째 표시 레슨",
        description: "둘째 챕터의 첫 레슨",
        sortOrder: 1,
        status: "deprecated",
      },
      {
        id: "version-lesson-other-v1",
        curriculumVersionId: "course-later-v1",
        chapterId: "version-chapter-other-v1",
        lessonId: "lesson-other-course",
        title: "다른 코스 표시 레슨",
        description: "다른 코스에 속한 레슨",
        sortOrder: 1,
        status: "active",
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
              id: "version-chapter-first-v2",
              label: "1장",
              title: "문장 시작하기",
              sortOrder: 1,
              status: "deprecated",
              lessons: [
                {
                  id: "version-lesson-first-v2",
                  lessonId: "lesson-first",
                  title: "첫째 표시 레슨",
                  description: "첫 번째로 정렬되는 레슨",
                  sortOrder: 1,
                  status: "active",
                },
                {
                  id: "version-lesson-second-v2",
                  lessonId: "lesson-second",
                  title: "둘째 표시 레슨",
                  description: "두 번째로 정렬되는 레슨",
                  sortOrder: 2,
                  status: "archived",
                },
              ],
            },
            {
              id: "version-chapter-second-v2",
              label: "2장",
              title: "퇴고하기",
              sortOrder: 2,
              status: "archived",
              lessons: [
                {
                  id: "version-lesson-third-v2",
                  lessonId: "lesson-third",
                  title: "셋째 표시 레슨",
                  description: "둘째 챕터의 첫 레슨",
                  sortOrder: 1,
                  status: "deprecated",
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
              id: "version-chapter-other-v1",
              label: "1장",
              title: "다른 코스 챕터",
              sortOrder: 1,
              status: "active",
              lessons: [
                {
                  id: "version-lesson-other-v1",
                  lessonId: "lesson-other-course",
                  title: "다른 코스 표시 레슨",
                  description: "다른 코스에 속한 레슨",
                  sortOrder: 1,
                  status: "active",
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

  it("creates a curriculum draft by copying the latest published snapshot", async () => {
    const now = new Date("2026-05-29T00:00:00.000Z")
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db, { now: () => now })

    const result = await repository.createCurriculumDraft("sentence-structure")

    expect(result).toEqual({
      status: "created",
      version: {
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "draft",
        title: "문장 구조의 기본",
        changelog: "Draft from v1",
        publishedAt: null,
        createdAt: "2026-05-29T00:00:00.000Z",
      },
    })

    const draft = await repository.getCurriculumVersionDetail(
      "sentence-structure-v2"
    )

    expect(draft).toMatchObject({
      id: "sentence-structure-v2",
      status: "draft",
    })
    expect(draft?.chapters[0]).toMatchObject({
      id: "sentence-structure-chapter-1-v2",
      status: "active",
    })
    expect(draft?.chapters[0]?.lessons[0]).toMatchObject({
      id: "sentence-structure-01-v2",
      lessonId: "sentence-structure-01",
      status: "active",
    })
    expect(draft?.chapters).toHaveLength(3)
    expect(draft?.chapters.flatMap((chapter) => chapter.lessons)).toHaveLength(
      12
    )
  })

  it("lists curriculum versions newest first", async () => {
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db, {
      now: () => new Date("2026-05-29T00:00:00.000Z"),
    })

    await repository.createCurriculumDraft("sentence-structure")

    const result = await repository.listCurriculumVersions("sentence-structure")

    expect(result.versions.map((version) => version.id)).toEqual([
      "sentence-structure-v2",
      "sentence-structure-v1",
    ])
    expect(result.versions.map((version) => version.status)).toEqual([
      "draft",
      "published",
    ])
  })

  it("rejects creating a second draft for the same course", async () => {
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db)

    await repository.createCurriculumDraft("sentence-structure")

    await expect(
      repository.createCurriculumDraft("sentence-structure")
    ).resolves.toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Draft curriculum version already exists.",
      },
    })
  })

  it("publishes a draft as the latest public curriculum without moving existing learner progress", async () => {
    const now = new Date("2026-05-29T00:00:00.000Z")
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db, { now: () => now })
    await db.insert(user).values({
      id: "existing-learner",
      name: "기존 학습자",
      email: "existing@example.com",
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    })
    await db.insert(courseProgress).values({
      userId: "existing-learner",
      courseId: "sentence-structure",
      curriculumVersionId: "sentence-structure-v1",
      startedAt: now,
      lastLessonId: "sentence-structure-01",
      completedCount: 3,
      updatedAt: now,
    })

    await repository.createCurriculumDraft("sentence-structure")
    await db
      .update(curriculumVersionLessons)
      .set({
        title: "발행된 새 레슨 제목",
      })
      .where(eq(curriculumVersionLessons.id, "sentence-structure-01-v2"))

    const result = await repository.publishCurriculumVersion(
      "sentence-structure-v2"
    )

    expect(result).toEqual({
      status: "published",
      version: {
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "published",
        title: "문장 구조의 기본",
        changelog: "Draft from v1",
        publishedAt: "2026-05-29T00:00:00.000Z",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
    })

    const publicCourse = await createDrizzleContentRepository(
      db
    ).findCourseDetail(courseId("sentence-structure"))
    const [progress] = await db
      .select()
      .from(courseProgress)
      .where(eq(courseProgress.userId, "existing-learner"))

    expect(publicCourse?.chapters[0]?.lessons[0]).toMatchObject({
      id: "sentence-structure-01-v2",
      title: "발행된 새 레슨 제목",
    })
    expect(progress?.curriculumVersionId).toBe("sentence-structure-v1")
  })

  it("rejects publishing a non-draft curriculum version", async () => {
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db)

    await expect(
      repository.publishCurriculumVersion("sentence-structure-v1")
    ).resolves.toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Only draft curriculum versions can be published.",
      },
    })
  })

  it("creates and returns a curriculum migration map", async () => {
    const now = new Date("2026-05-29T00:00:00.000Z")
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db, { now: () => now })
    await createPublishedV2(repository)

    const result = await repository.createCurriculumMigration({
      fromVersionId: "sentence-structure-v1",
      toVersionId: "sentence-structure-v2",
      mappings: [
        {
          fromLessonId: "sentence-structure-01",
          toLessonId: "sentence-structure-01",
          mappingType: "equivalent",
        },
        {
          fromLessonId: "sentence-structure-05",
          toLessonId: null,
          mappingType: "removed",
        },
      ],
    })

    expect(result).toEqual({
      status: "created",
      migration: {
        id: "sentence-structure-v1-to-sentence-structure-v2",
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        status: "active",
        createdAt: "2026-05-29T00:00:00.000Z",
        mappings: [
          {
            id: "sentence-structure-v1-to-sentence-structure-v2-1",
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "equivalent",
          },
          {
            id: "sentence-structure-v1-to-sentence-structure-v2-2",
            fromLessonId: "sentence-structure-05",
            toLessonId: null,
            mappingType: "removed",
          },
        ],
      },
    })
    expect(result.status).toBe("created")

    if (result.status !== "created") {
      throw new Error("Migration result must be created.")
    }

    await expect(
      repository.getCurriculumMigration(
        "sentence-structure-v1-to-sentence-structure-v2"
      )
    ).resolves.toEqual(result.migration)
  })

  it("rejects removed migration mappings with a target lesson", async () => {
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db)
    await createPublishedV2(repository)

    await expect(
      repository.createCurriculumMigration({
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        mappings: [
          {
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "removed",
          },
        ],
      })
    ).resolves.toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Removed mappings must not include a target lesson.",
      },
    })
  })

  it("applies equivalent split merged and removed migration mappings idempotently", async () => {
    const now = new Date("2026-05-29T00:00:00.000Z")
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db, { now: () => now })
    await createPublishedV2(repository)
    await createLearnerProgress(db, {
      completedLessonIds: [
        "sentence-structure-01",
        "sentence-structure-02",
        "sentence-structure-03",
        "sentence-structure-04",
        "sentence-structure-05",
      ],
      userId: "learner-migration",
    })
    await repository.createCurriculumMigration({
      fromVersionId: "sentence-structure-v1",
      toVersionId: "sentence-structure-v2",
      mappings: [
        {
          fromLessonId: "sentence-structure-01",
          toLessonId: "sentence-structure-01",
          mappingType: "equivalent",
        },
        {
          fromLessonId: "sentence-structure-02",
          toLessonId: "sentence-structure-02",
          mappingType: "split",
        },
        {
          fromLessonId: "sentence-structure-02",
          toLessonId: "sentence-structure-03",
          mappingType: "split",
        },
        {
          fromLessonId: "sentence-structure-03",
          toLessonId: "sentence-structure-04",
          mappingType: "merged",
        },
        {
          fromLessonId: "sentence-structure-04",
          toLessonId: "sentence-structure-04",
          mappingType: "merged",
        },
        {
          fromLessonId: "sentence-structure-05",
          toLessonId: null,
          mappingType: "removed",
        },
      ],
    })

    const firstResult = await repository.applyCurriculumMigration({
      migrationId: "sentence-structure-v1-to-sentence-structure-v2",
      userId: "learner-migration",
    })
    const secondResult = await repository.applyCurriculumMigration({
      migrationId: "sentence-structure-v1-to-sentence-structure-v2",
      userId: "learner-migration",
    })
    const [progress] = await db
      .select()
      .from(courseProgress)
      .where(eq(courseProgress.userId, "learner-migration"))
    const migratedLessons = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.curriculumVersionId, "sentence-structure-v2"))
    const applications = await db
      .select()
      .from(curriculumMigrationApplications)
      .where(
        eq(
          curriculumMigrationApplications.migrationId,
          "sentence-structure-v1-to-sentence-structure-v2"
        )
      )

    expect(firstResult).toEqual(secondResult)
    expect(firstResult).toMatchObject({
      status: "applied",
      application: {
        completedLessonCount: 4,
        completedLessonIds: [
          "sentence-structure-01",
          "sentence-structure-02",
          "sentence-structure-03",
          "sentence-structure-04",
        ],
        preservedLessonIds: ["sentence-structure-05"],
        skippedLessonIds: [],
      },
    })
    expect(progress).toMatchObject({
      completedCount: 4,
      curriculumVersionId: "sentence-structure-v2",
      lastLessonId: "sentence-structure-04",
    })
    expect(migratedLessons.map((lesson) => lesson.lessonId).sort()).toEqual([
      "sentence-structure-01",
      "sentence-structure-02",
      "sentence-structure-03",
      "sentence-structure-04",
    ])
    expect(applications).toHaveLength(1)
    expect(applications[0]).toMatchObject({
      completedLessonCount: 4,
      errorMessage: null,
      status: "completed",
    })
  })

  it("records failed curriculum migration applications", async () => {
    const now = new Date("2026-05-29T00:00:00.000Z")
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db, { now: () => now })
    await createPublishedV2(repository)
    await createLearnerProgress(db, {
      completedLessonIds: [],
      curriculumVersionId: "sentence-structure-v2",
      userId: "learner-wrong-version",
    })
    await repository.createCurriculumMigration({
      fromVersionId: "sentence-structure-v1",
      toVersionId: "sentence-structure-v2",
      mappings: [
        {
          fromLessonId: "sentence-structure-01",
          toLessonId: "sentence-structure-01",
          mappingType: "equivalent",
        },
      ],
    })

    const result = await repository.applyCurriculumMigration({
      migrationId: "sentence-structure-v1-to-sentence-structure-v2",
      userId: "learner-wrong-version",
    })
    const [application] = await db
      .select()
      .from(curriculumMigrationApplications)
      .where(
        eq(curriculumMigrationApplications.userId, "learner-wrong-version")
      )

    expect(result).toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Course progress is not on the migration source version.",
      },
    })
    expect(application).toMatchObject({
      errorMessage: "Course progress is not on the migration source version.",
      status: "failed",
    })
  })

  it("tracks curriculum revision and active lesson step status", async () => {
    const db = await createSeededDatabase()
    const repository = createDrizzleAdminRepository(db)
    const version = await repository.getCourseCurriculumVersionDetail(
      "sentence-structure",
      "sentence-structure-v1"
    )

    expect(version?.revision).toBe(1)

    const lesson = await repository.getCourseLessonDetail(
      "sentence-structure",
      "sentence-structure-01"
    )

    expect(lesson?.steps[0]?.status).toBe("active")
  })
})

async function createSeededDatabase() {
  const sqlite = new Database(":memory:")
  runContentMigration(sqlite)
  const db = createDatabase(sqlite)
  await seedContent(db)

  return db
}

async function createPublishedV2(
  repository: ReturnType<typeof createDrizzleAdminRepository>
) {
  await repository.createCurriculumDraft("sentence-structure")
  await repository.publishCurriculumVersion("sentence-structure-v2")
}

async function createLearnerProgress(
  db: Awaited<ReturnType<typeof createSeededDatabase>>,
  input: {
    completedLessonIds: string[]
    curriculumVersionId?: string
    userId: string
  }
) {
  const now = new Date("2026-05-29T00:00:00.000Z")
  const curriculumVersionId =
    input.curriculumVersionId ?? "sentence-structure-v1"

  await db.insert(user).values({
    id: input.userId,
    name: "마이그레이션 학습자",
    email: `${input.userId}@example.com`,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
  })
  await db.insert(courseProgress).values({
    userId: input.userId,
    courseId: "sentence-structure",
    curriculumVersionId,
    startedAt: now,
    lastLessonId: input.completedLessonIds.at(-1) ?? null,
    completedCount: input.completedLessonIds.length,
    updatedAt: now,
  })

  if (input.completedLessonIds.length === 0) {
    return
  }

  const progressRows = input.completedLessonIds.map((lessonId) => ({
    userId: input.userId,
    lessonId,
    courseId: "sentence-structure",
    curriculumVersionId,
    currentStepId: `${lessonId}-step-5`,
    stepOrder: 5,
    status: "completed",
    completedAt: now,
    updatedAt: now,
  })) satisfies (typeof lessonProgress.$inferInsert)[]

  await db.insert(lessonProgress).values(progressRows)
}
