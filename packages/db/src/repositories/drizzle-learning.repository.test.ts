import { eq } from "drizzle-orm"
import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import {
  courseId,
  curriculumVersionId,
  lessonId,
} from "@workspace/core/content"
import { userId } from "@workspace/core/learning"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { createDrizzleAdminRepository } from "@/repositories/drizzle-admin.repository"
import { createDrizzleLearningRepository } from "@/repositories/drizzle-learning.repository"
import {
  courseProgress,
  curriculumVersionMigrations,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  curriculumUpgradeDismissals,
  lessonMigrationMappings,
  lessonProgress,
  user,
} from "@/schema"
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

    const courseProgressColumns = sqlite
      .query<{ name: string }, []>("pragma table_info(course_progress)")
      .all()
      .map((column) => column.name)
    const lessonProgressColumns = sqlite
      .query<{ name: string }, []>("pragma table_info(lesson_progress)")
      .all()
      .map((column) => column.name)

    expect(courseProgressColumns).toContain("curriculum_version_id")
    expect(lessonProgressColumns).toContain("curriculum_version_id")
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
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      lastLessonId: lessonId("sentence-structure-01"),
      userId: userId("user-1"),
    })
    await repository.upsertCourseProgress({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
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
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      lastLessonId: lessonId("sentence-structure-02"),
    })
  })

  it("upserts lesson progress and answers", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })

    await repository.upsertLessonProgress({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      currentStepId: "sentence-structure-01-step-1",
      lessonId: lessonId("sentence-structure-01"),
      status: "in-progress",
      stepOrder: 1,
      userId: userId("user-1"),
    })
    const progress = await repository.upsertLessonProgress({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
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
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
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
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      finalStepId: "sentence-structure-01-step-3",
      lessonId: lessonId("sentence-structure-01"),
      stepOrder: 3,
      userId: userId("user-1"),
    })
    const second = await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
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
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      lastLessonId: lessonId("sentence-structure-01"),
    })
  })

  it("stores and reads curriculum version ids on progress rows", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })

    await repository.upsertCourseProgress({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      lastLessonId: lessonId("sentence-structure-01"),
      userId: userId("user-1"),
    })
    const lessonRow = await repository.upsertLessonProgress({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      currentStepId: "sentence-structure-01-step-1",
      lessonId: lessonId("sentence-structure-01"),
      status: "in-progress",
      stepOrder: 1,
      userId: userId("user-1"),
    })

    const courseRow = await repository.findCourseProgress(
      userId("user-1"),
      courseId("sentence-structure")
    )

    expect(courseRow?.curriculumVersionId).toBe("sentence-structure-v1")
    expect(lessonRow.curriculumVersionId).toBe("sentence-structure-v1")
  })

  it("finds the latest published curriculum version and its active lessons", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })
    await db.insert(curriculumVersions).values({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "published",
      title: "문장 구조의 기본 v2",
      changelog: "진행 기준 검증",
      publishedAt: now,
      createdAt: now,
    })
    await db.insert(curriculumVersionChapters).values({
      id: "sentence-structure-chapter-1-v2",
      curriculumVersionId: "sentence-structure-v2",
      sourceChapterId: "sentence-structure-chapter-1",
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
      description: "새 버전 설명입니다.",
      sortOrder: 1,
      status: "active",
    })

    const latest = await repository.findLatestPublishedCurriculumVersionId(
      courseId("sentence-structure")
    )
    const lessonIds = await repository.listCurriculumVersionLessonIds(
      curriculumVersionId("sentence-structure-v2")
    )
    const includesLesson = await repository.curriculumVersionIncludesLesson(
      curriculumVersionId("sentence-structure-v2"),
      lessonId("sentence-structure-01")
    )

    expect(latest).toBe("sentence-structure-v2")
    expect(lessonIds).toEqual([lessonId("sentence-structure-01")])
    expect(includesLesson).toBe(true)
  })

  it("uses only active curriculum nodes as learner-version lesson candidates", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })
    await db
      .update(curriculumVersionLessons)
      .set({ status: "archived" })
      .where(eq(curriculumVersionLessons.id, "sentence-structure-02-v1"))
    await db
      .update(curriculumVersionLessons)
      .set({ status: "deprecated" })
      .where(eq(curriculumVersionLessons.id, "sentence-structure-03-v1"))

    const lessonIds = await repository.listCurriculumVersionLessonIds(
      curriculumVersionId("sentence-structure-v1")
    )
    const includesArchived = await repository.curriculumVersionIncludesLesson(
      curriculumVersionId("sentence-structure-v1"),
      lessonId("sentence-structure-02")
    )

    expect(lessonIds).not.toContain(lessonId("sentence-structure-02"))
    expect(lessonIds).not.toContain(lessonId("sentence-structure-03"))
    expect(includesArchived).toBe(false)
  })

  it("counts completed lessons only inside the selected curriculum version", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })
    await db.insert(curriculumVersions).values({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "published",
      title: "문장 구조의 기본 v2",
      changelog: "완료 카운트 검증",
      publishedAt: now,
      createdAt: now,
    })
    await db.insert(curriculumVersionChapters).values({
      id: "sentence-structure-chapter-1-v2",
      curriculumVersionId: "sentence-structure-v2",
      sourceChapterId: "sentence-structure-chapter-1",
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
      description: "새 버전 설명입니다.",
      sortOrder: 1,
      status: "active",
    })

    await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      finalStepId: "sentence-structure-01-step-3",
      lessonId: lessonId("sentence-structure-01"),
      stepOrder: 3,
      userId: userId("user-1"),
    })
    await db.update(lessonProgress).set({
      curriculumVersionId: "sentence-structure-v2",
    })

    const completed = await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      finalStepId: "sentence-structure-02-step-3",
      lessonId: lessonId("sentence-structure-02"),
      stepOrder: 3,
      userId: userId("user-1"),
    })

    expect(completed.completedCount).toBe(1)
  })

  it("finds an available curriculum upgrade from the learner progress version to the latest published version", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })
    await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      finalStepId: "sentence-structure-01-step-5",
      lessonId: lessonId("sentence-structure-01"),
      stepOrder: 5,
      userId: userId("user-1"),
    })
    await createPublishedV2(db, now)
    await createActiveMigration(db, now)

    const upgrade = await repository.findCurriculumUpgrade(
      userId("user-1"),
      courseId("sentence-structure")
    )

    expect(upgrade).toEqual({
      completedCount: 1,
      courseId: courseId("sentence-structure"),
      fromVersion: {
        id: curriculumVersionId("sentence-structure-v1"),
        title: "문장 구조의 기본",
        versionNumber: 1,
      },
      migrationId: "sentence-structure-v1-to-sentence-structure-v2",
      toVersion: {
        changelog: "Draft from v1",
        id: curriculumVersionId("sentence-structure-v2"),
        title: "문장 구조의 기본",
        versionNumber: 2,
      },
      totalLessons: 12,
    })
  })

  it("hides a dismissed curriculum upgrade for the same version pair", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })
    await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      finalStepId: "sentence-structure-01-step-5",
      lessonId: lessonId("sentence-structure-01"),
      stepOrder: 5,
      userId: userId("user-1"),
    })
    await createPublishedV2(db, now)
    await createActiveMigration(db, now)

    const dismissed = await repository.dismissCurriculumUpgrade(
      userId("user-1"),
      courseId("sentence-structure")
    )
    const upgrade = await repository.findCurriculumUpgrade(
      userId("user-1"),
      courseId("sentence-structure")
    )
    const dismissals = await db.select().from(curriculumUpgradeDismissals)

    expect(dismissed).toEqual({
      status: "dismissed",
      dismissal: {
        courseId: courseId("sentence-structure"),
        dismissedAt: now,
        fromVersionId: curriculumVersionId("sentence-structure-v1"),
        toVersionId: curriculumVersionId("sentence-structure-v2"),
      },
    })
    expect(upgrade).toBeUndefined()
    expect(dismissals).toHaveLength(1)
  })

  it("applies an available curriculum upgrade with the shared migration policy", async () => {
    const repository = createDrizzleLearningRepository(db, { now: () => now })
    await repository.completeLesson({
      courseId: courseId("sentence-structure"),
      curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
      finalStepId: "sentence-structure-01-step-5",
      lessonId: lessonId("sentence-structure-01"),
      stepOrder: 5,
      userId: userId("user-1"),
    })
    await createPublishedV2(db, now)
    await createActiveMigration(db, now)

    const result = await repository.applyCurriculumUpgrade(
      userId("user-1"),
      courseId("sentence-structure")
    )
    const [progress] = await db
      .select()
      .from(courseProgress)
      .where(eq(courseProgress.userId, "user-1"))

    expect(result).toMatchObject({
      status: "applied",
      application: {
        completedLessonCount: 1,
        completedLessonIds: ["sentence-structure-01"],
        courseId: "sentence-structure",
        fromVersionId: "sentence-structure-v1",
        migrationId: "sentence-structure-v1-to-sentence-structure-v2",
        skippedLessonIds: ["sentence-structure-02"],
        status: "completed",
        toVersionId: "sentence-structure-v2",
      },
    })
    expect(progress).toMatchObject({
      completedCount: 1,
      curriculumVersionId: "sentence-structure-v2",
      lastLessonId: "sentence-structure-01",
    })
  })
})

async function createPublishedV2(
  db: ReturnType<typeof createDatabase>,
  now: Date
) {
  const adminRepository = createDrizzleAdminRepository(db, { now: () => now })

  await adminRepository.createCurriculumDraft("sentence-structure")
  await adminRepository.publishCurriculumVersion("sentence-structure-v2")
}

async function createActiveMigration(
  db: ReturnType<typeof createDatabase>,
  now: Date
) {
  await db.insert(curriculumVersionMigrations).values({
    id: "sentence-structure-v1-to-sentence-structure-v2",
    fromVersionId: "sentence-structure-v1",
    toVersionId: "sentence-structure-v2",
    status: "active",
    createdAt: now,
  })
  await db.insert(lessonMigrationMappings).values([
    {
      id: "sentence-structure-v1-to-sentence-structure-v2-1",
      migrationId: "sentence-structure-v1-to-sentence-structure-v2",
      fromLessonId: "sentence-structure-01",
      toLessonId: "sentence-structure-01",
      mappingType: "equivalent",
    },
    {
      id: "sentence-structure-v1-to-sentence-structure-v2-2",
      migrationId: "sentence-structure-v1-to-sentence-structure-v2",
      fromLessonId: "sentence-structure-02",
      toLessonId: "sentence-structure-02",
      mappingType: "equivalent",
    },
  ])
}
