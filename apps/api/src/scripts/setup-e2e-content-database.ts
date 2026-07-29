import { rmSync } from "node:fs"
import path from "node:path"
import { eq } from "drizzle-orm"

import { createWritingAppDatabase } from "@workspace/db/client"
import { normalizeVersionedStepContentOrThrow } from "@workspace/content/ports"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/content/migration-schema"

import { seedApplicationDatabase } from "@/db/seed"

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
  const failureLessonId = "e2e-ai-failure-lesson"

  try {
    await seedApplicationDatabase(database)
    database.db
      .insert(courses)
      .values({
        createdAt: now,
        id: courseId,
        publishedCurriculumVersionId: null,
        sortOrder: 6,
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
      .values([
        {
          category: "E2E",
          curriculumVersionId,
          description: "오답, 정답과 AI 코칭 성공을 검증합니다.",
          estimatedMinutes: 3,
          id: lessonId,
          sortOrder: 1,
          status: "active",
          summaryJson: JSON.stringify(["서버 권위 상태 전이를 확인했다"]),
          title: "상태 전이 한 번에 확인하기",
          unitId,
        },
        {
          category: "E2E",
          curriculumVersionId,
          description: "AI provider 실패 뒤 레슨 완료를 검증합니다.",
          estimatedMinutes: 2,
          id: failureLessonId,
          sortOrder: 2,
          status: "active",
          summaryJson: JSON.stringify([
            "AI 코칭 실패가 학습 완료를 막지 않음을 확인했다",
          ]),
          title: "AI 코칭 실패 복구하기",
          unitId,
        },
      ])
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
          contentJson: JSON.stringify({
            guide: "다섯 글자 이상 작성하세요.",
            max: 200,
            min: 5,
            prompt: "서버 권위 상태 전이의 장점을 작성하세요.",
            title: "짧은 답안 작성",
            type: "write",
          }),
          curriculumVersionId,
          id: `${lessonId}-s2`,
          lessonId,
          sortOrder: 2,
          status: "active",
          type: "WRITE",
        },
        {
          contentJson: JSON.stringify({
            allowRetry: true,
            feedback: "E2E fixture",
            focus: "명확성",
            target: `${lessonId}-s2`,
            type: "ai_feedback",
          }),
          curriculumVersionId,
          id: `${lessonId}-s3`,
          lessonId,
          sortOrder: 3,
          status: "active",
          type: "AI_FEEDBACK",
        },
        {
          contentJson: JSON.stringify({
            guide: "E2E 실패 표식을 포함해 작성하세요.",
            max: 200,
            min: 5,
            prompt: "AI 코칭 실패 뒤에도 학습을 이어갈 문장을 작성하세요.",
            title: "실패 복구 답안 작성",
            type: "write",
          }),
          curriculumVersionId,
          id: `${failureLessonId}-s1`,
          lessonId: failureLessonId,
          sortOrder: 1,
          status: "active",
          type: "WRITE",
        },
        {
          contentJson: JSON.stringify({
            allowRetry: true,
            feedback: "E2E failure fixture",
            focus: "복구 가능성",
            target: `${failureLessonId}-s1`,
            type: "ai_feedback",
          }),
          curriculumVersionId,
          id: `${failureLessonId}-s2`,
          lessonId: failureLessonId,
          sortOrder: 2,
          status: "active",
          type: "AI_FEEDBACK",
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
  const courseId = "e2e-draft-course"
  const curriculumVersionId = "curriculum:e2e-draft-course:1"
  const unitId = "e2e-draft-unit"
  const lessonId = "e2e-draft-lesson"

  try {
    database.db
      .insert(courses)
      .values({
        createdAt: now,
        id: courseId,
        publishedCurriculumVersionId: null,
        sortOrder: 7,
        status: "active",
      })
      .run()
    database.db
      .insert(courseCurriculumVersions)
      .values({
        category: "E2E",
        courseId,
        createdAt: now,
        description: "서버 초안 저장과 복구 E2E 전용 코스",
        editVersion: 0,
        id: curriculumVersionId,
        publishedAt: null,
        revision: 1,
        status: "draft",
        title: "E2E 초안 복구 코스",
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
        title: "초안 복구 검증",
      })
      .run()
    database.db
      .insert(lessonVersions)
      .values({
        category: "E2E",
        curriculumVersionId,
        description: "새로고침, 재로그인, 다른 탭에서 초안을 복구합니다.",
        estimatedMinutes: 2,
        id: lessonId,
        sortOrder: 1,
        status: "active",
        summaryJson: JSON.stringify(["서버 초안 복구를 확인했다"]),
        title: "서버 초안 이어 쓰기",
        unitId,
      })
      .run()
    database.db
      .insert(lessonStepVersions)
      .values({
        contentJson: JSON.stringify({
          guide: "다섯 글자 이상 작성하세요.",
          max: 200,
          min: 5,
          prompt: "서버에 복구할 문장을 작성하세요.",
          title: "초안 작성",
          type: "write",
        }),
        curriculumVersionId,
        id: `${lessonId}-write`,
        lessonId,
        sortOrder: 1,
        status: "active",
        type: "WRITE",
      })
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

function requireE2eDatabaseUrl(environment: NodeJS.ProcessEnv): string {
  const databaseUrl = environment["DATABASE_URL"]
  const runRoot = environment["E2E_RUN_ROOT"]

  if (
    environment["NODE_ENV"] !== "test" ||
    databaseUrl === undefined ||
    runRoot === undefined
  ) {
    throw new Error(
      "E2E 데이터베이스 준비에는 NODE_ENV=test와 E2E_RUN_ROOT가 필요합니다."
    )
  }

  const databasePath = path.resolve(databaseUrl.replace(/^file:/, ""))
  const expectedDatabasePath = path.join(
    path.resolve(runRoot),
    "writing-app.sqlite"
  )

  if (databasePath !== expectedDatabasePath) {
    throw new Error(
      `허용되지 않은 E2E 데이터베이스 경로입니다: ${databasePath}`
    )
  }

  return databasePath
}

function removeE2eDatabaseFiles(databasePath: string): void {
  for (const suffix of ["", "-shm", "-wal"] as const) {
    rmSync(`${databasePath}${suffix}`, { force: true })
  }
}
