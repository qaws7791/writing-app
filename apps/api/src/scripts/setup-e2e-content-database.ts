import { rmSync } from "node:fs"
import path from "node:path"
import { eq } from "drizzle-orm"

import { createWritingAppDatabase } from "@workspace/db/client"
import { normalizeVersionedStepContentOrThrow } from "@workspace/content/normalization"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
  runContentSchemaMigration,
} from "@workspace/content/schema"
import { runAiFeedbackSchemaMigration } from "@workspace/ai-feedback/schema"
import { seedContentDatabase } from "@workspace/content/seed"
import { seedDatabase } from "@workspace/db/seeds/seed"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { seedLearnerIdentity } from "@workspace/identity/seed"
import { runResourceLibrarySchemaMigration } from "@workspace/resource-library/migration"

import { runApiIdentitySchemaMigration } from "@/composition/identity-schema-migration"

const e2eDatabaseUrl = requireE2eDatabaseUrl(process.env)

removeE2eDatabaseFiles(e2eDatabaseUrl)
await seedDatabase({ databaseUrl: e2eDatabaseUrl, nodeEnv: "test" })
await seedLearnerTransitionCourse(e2eDatabaseUrl)

async function seedLearnerTransitionCourse(databaseUrl: string): Promise<void> {
  const database = createWritingAppDatabase(databaseUrl)
  const now = new Date("2026-07-17T00:00:00.000Z")
  const courseId = "e2e-transition-course"
  const curriculumVersionId = "curriculum:e2e-transition-course:1"
  const unitId = "e2e-transition-unit"
  const lessonId = "e2e-transition-lesson"

  try {
    runContentSchemaMigration(database.sqlite)
    runAiFeedbackSchemaMigration(database.sqlite)
    await seedContentDatabase(database.db)
    runApiIdentitySchemaMigration(database.sqlite)
    runResourceLibrarySchemaMigration(database.sqlite)
    seedLearnerIdentity(database.db, {
      displayName: "글쓰기 탐험가",
      userId: userIdSchema.parse("user-1"),
    })
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
      .values({
        category: "E2E",
        curriculumVersionId,
        description: "오답, 정답, AI 코칭과 완료를 검증합니다.",
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
            score: 90,
            scoreMax: 100,
            showScore: true,
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
