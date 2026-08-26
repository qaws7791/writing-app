import { rmSync } from "node:fs"
import { eq, max } from "drizzle-orm"

import {
  createWritingAppDatabase,
  type WritingAppDatabase,
} from "@workspace/db/client"
import { normalizeVersionedStepContentOrThrow } from "@workspace/content/ports"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/content/migration-schema"

import { seedApplicationDatabase } from "@/db/seed"
import { requireE2eDatabaseUrl } from "@/test-support/e2e-database-url"

if (import.meta.main) {
  await setupE2eContentDatabase(requireE2eDatabaseUrl(process.env))
}

export async function setupE2eContentDatabase(
  databaseUrl: string
): Promise<void> {
  removeE2eDatabaseFiles(databaseUrl)
  await seedLearnerTransitionCourse(databaseUrl)
  await seedLearnerDraftCourse(databaseUrl)
}

async function seedLearnerTransitionCourse(databaseUrl: string): Promise<void> {
  const database = createWritingAppDatabase(databaseUrl)
  const now = new Date("2026-07-17T00:00:00.000Z")
  const courseId = "e2e-transition-course"
  const curriculumVersionId = "curriculum:e2e-transition-course:1"
  const unitId = "e2e-transition-unit"
  const lessonId = "e2e-transition-lesson"

  try {
    await seedApplicationDatabase(database)
    database.db
      .insert(courses)
      .values({
        createdAt: now,
        id: courseId,
        publishedCurriculumVersionId: null,
        sortOrder: nextCourseSortOrder(database.db),
        status: "active",
      })
      .run()
    database.db
      .insert(courseCurriculumVersions)
      .values({
        category: "E2E",
        courseId,
        createdAt: now,
        description: "학습자 상태 전이 E2E 전용 코스",
        editVersion: 0,
        id: curriculumVersionId,
        publishedAt: null,
        revision: 1,
        status: "draft",
        title: "E2E 상태 전이 코스",
        updatedAt: now,
        visualKey: "expression",
      })
      .run()
    database.db
      .insert(courseUnitVersions)
      .values({
        curriculumVersionId,
        id: unitId,
        sortOrder: 1,
        status: "active",
        title: "상태 전이 검증",
      })
      .run()
    database.db
      .insert(lessonVersions)
      .values({
        category: "E2E",
        curriculumVersionId,
        description: "오답, 재시도, 정답과 레슨 완료를 검증합니다.",
        estimatedMinutes: 3,
        id: lessonId,
        sortOrder: 1,
        status: "active",
        summaryJson: JSON.stringify(["서버 권위 상태 전이를 확인했다"]),
        title: "상태 전이 한 번에 확인하기",
        unitId,
      })
      .run()
    database.db
      .insert(lessonStepVersions)
      .values([
        {
          contentJson: normalizeVersionedStepContentOrThrow(
            `${lessonId}-s1`,
            "MULTIPLE_CHOICE",
            JSON.stringify({
              correct: "correct-option",
              explanation: "서버가 정답을 판정했습니다.",
              options: [
                { id: "wrong-option", text: "클라이언트가 채점한다" },
                { id: "correct-option", text: "서버가 채점한다" },
              ],
              question: "학습 답안을 누가 채점하나요?",
              type: "multiple_choice",
              wrong: "서버 평가 결과를 사용해야 합니다.",
            })
          ),
          curriculumVersionId,
          id: `${lessonId}-s1`,
          lessonId,
          sortOrder: 1,
          status: "active",
          type: "MULTIPLE_CHOICE",
        },
        {
          contentJson: normalizeVersionedStepContentOrThrow(
            `${lessonId}-s2`,
            "MULTIPLE_CHOICE",
            JSON.stringify({
              correct: "server-state-option",
              explanation: "서버가 학습 상태를 계산합니다.",
              options: [
                {
                  id: "client-state-option",
                  text: "클라이언트가 상태를 계산한다",
                },
                { id: "server-state-option", text: "서버가 상태를 계산한다" },
              ],
              question: "학습 상태를 누가 계산하나요?",
              type: "multiple_choice",
              wrong: "서버 평가 결과를 사용해야 합니다.",
            })
          ),
          curriculumVersionId,
          id: `${lessonId}-s2`,
          lessonId,
          sortOrder: 2,
          status: "active",
          type: "MULTIPLE_CHOICE",
        },
      ])
      .run()
    database.db
      .update(courseCurriculumVersions)
      .set({ publishedAt: now, status: "published" })
      .where(eq(courseCurriculumVersions.id, curriculumVersionId))
      .run()
    database.db
      .update(courses)
      .set({ publishedCurriculumVersionId: curriculumVersionId })
      .where(eq(courses.id, courseId))
      .run()
  } finally {
    database.close()
  }
}

async function seedLearnerDraftCourse(databaseUrl: string): Promise<void> {
  const database = createWritingAppDatabase(databaseUrl)
  const now = new Date("2026-07-17T00:00:00.000Z")
  const fixtures = [
    {
      courseId: "e2e-draft-course",
      curriculumVersionId: "curriculum:e2e-draft-course:1",
      description: "새로고침, 재로그인, 다른 탭에서 초안을 복구합니다.",
      lessonId: "e2e-draft-lesson",
      title: "서버 초안 이어 쓰기",
      unitId: "e2e-draft-unit",
    },
    {
      courseId: "e2e-unload-draft-course",
      curriculumVersionId: "curriculum:e2e-unload-draft-course:1",
      description: "탭 종료 직전 초안 flush를 독립적으로 검증합니다.",
      lessonId: "e2e-unload-draft-lesson",
      title: "탭 종료 초안 보존하기",
      unitId: "e2e-unload-draft-unit",
    },
  ] as const

  try {
    const firstSortOrder = nextCourseSortOrder(database.db)
    database.db
      .insert(courses)
      .values(
        fixtures.map((fixture, index) => ({
          createdAt: now,
          id: fixture.courseId,
          publishedCurriculumVersionId: null,
          sortOrder: firstSortOrder + index,
          status: "active" as const,
        }))
      )
      .run()
    database.db
      .insert(courseCurriculumVersions)
      .values(
        fixtures.map((fixture) => ({
          category: "E2E",
          courseId: fixture.courseId,
          createdAt: now,
          description: fixture.description,
          editVersion: 0,
          id: fixture.curriculumVersionId,
          publishedAt: null,
          revision: 1,
          status: "draft" as const,
          title:
            fixture.courseId === "e2e-draft-course"
              ? "E2E 초안 복구 코스"
              : "E2E 탭 종료 초안 코스",
          updatedAt: now,
          visualKey: "expression" as const,
        }))
      )
      .run()
    database.db
      .insert(courseUnitVersions)
      .values(
        fixtures.map((fixture) => ({
          curriculumVersionId: fixture.curriculumVersionId,
          id: fixture.unitId,
          sortOrder: 1,
          status: "active" as const,
          title: "초안 복구 검증",
        }))
      )
      .run()
    database.db
      .insert(lessonVersions)
      .values(
        fixtures.map((fixture) => ({
          category: "E2E",
          curriculumVersionId: fixture.curriculumVersionId,
          description: fixture.description,
          estimatedMinutes: 2,
          id: fixture.lessonId,
          sortOrder: 1,
          status: "active" as const,
          summaryJson: JSON.stringify(["서버 초안 복구를 확인했다"]),
          title: fixture.title,
          unitId: fixture.unitId,
        }))
      )
      .run()
    database.db
      .insert(lessonStepVersions)
      .values(
        fixtures.map((fixture) => ({
          contentJson: normalizeVersionedStepContentOrThrow(
            `${fixture.lessonId}-mc`,
            "MULTIPLE_CHOICE",
            JSON.stringify({
              correct: "draft-option",
              explanation: "서버에 저장된 선택을 복구합니다.",
              options: [
                { id: "other-option", text: "다른 선택지" },
                { id: "draft-option", text: "서버에 복구할 선택" },
              ],
              question: "서버에 복구할 답을 고르세요.",
              type: "multiple_choice",
              wrong: "선택을 다시 확인하세요.",
            })
          ),
          curriculumVersionId: fixture.curriculumVersionId,
          id: `${fixture.lessonId}-mc`,
          lessonId: fixture.lessonId,
          sortOrder: 1,
          status: "active" as const,
          type: "MULTIPLE_CHOICE" as const,
        }))
      )
      .run()
    for (const fixture of fixtures) {
      database.db
        .update(courseCurriculumVersions)
        .set({ publishedAt: now, status: "published" })
        .where(eq(courseCurriculumVersions.id, fixture.curriculumVersionId))
        .run()
      database.db
        .update(courses)
        .set({ publishedCurriculumVersionId: fixture.curriculumVersionId })
        .where(eq(courses.id, fixture.courseId))
        .run()
    }
  } finally {
    database.close()
  }
}

/** Keeps fixture courses after seeded courses without pinning the seed count. */
function nextCourseSortOrder(database: WritingAppDatabase): number {
  const highest = database
    .select({ value: max(courses.sortOrder) })
    .from(courses)
    .get()?.value

  return (highest ?? 0) + 1
}

function removeE2eDatabaseFiles(databasePath: string): void {
  for (const suffix of ["", "-shm", "-wal"] as const) {
    rmSync(`${databasePath}${suffix}`, { force: true })
  }
}
