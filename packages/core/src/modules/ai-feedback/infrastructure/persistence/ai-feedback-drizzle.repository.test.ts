import { describe, expect, it } from "vitest"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/core/modules/content/domain/content.ids"
import { learnerIdSchema } from "@workspace/core/modules/learning/domain/learning.ids"

import { createInMemoryKwepDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { createDrizzleAiFeedbackRepository } from "@/modules/ai-feedback/infrastructure/persistence/ai-feedback-drizzle.repository"
import {
  aiFeedbackAttempts,
  authUsers,
  courses,
  courseUnits,
  lessons,
  lessonSteps,
} from "@workspace/db/schema"
import type { KwepDatabaseClient } from "@workspace/db/client"

const now = new Date("2026-06-14T10:30:00.000Z")
const learnerId = learnerIdSchema.parse("user-1")
const otherLearnerId = learnerIdSchema.parse("user-2")
const lessonId = lessonIdSchema.parse("l-ai")
const stepId = lessonStepIdSchema.parse("l-ai-s2")

describe("AI 피드백 repository", () => {
  it("완료된 AI 코칭 시도를 저장하고 user/lesson/step 기준으로 집계한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      seedFeedbackBaseline(client)
      const repository = createDrizzleAiFeedbackRepository(client.db)

      await expect(
        repository.saveCompletedAttempt(
          {
            answer: "문장을 명확하게 고쳤습니다.",
            lessonId,
            occurredAt: now,
            result: {
              improvements: ["근거를 더 붙이세요."],
              nextAction: "예시 한 문장을 추가하세요.",
              score: 84,
              scoreRange: [0, 100],
              showScore: true,
              strengths: ["핵심 문장이 앞에 있습니다."],
              summary: "의도가 분명합니다.",
            },
            stepId,
            userId: learnerId,
          },
          3
        )
      ).resolves.toEqual({
        attemptNumber: 1,
        kind: "saved",
      })

      await expect(
        repository.saveCompletedAttempt(
          {
            answer: "두 번째 문장을 명확하게 고쳤습니다.",
            lessonId,
            occurredAt: now,
            result: {
              improvements: ["문장 길이를 줄이세요."],
              nextAction: "첫 문장을 둘로 나누세요.",
              score: 86,
              scoreRange: [0, 100],
              showScore: true,
              strengths: ["주장이 분명합니다."],
              summary: "구조가 좋아졌습니다.",
            },
            stepId,
            userId: learnerId,
          },
          1
        )
      ).resolves.toEqual({
        completedAttempts: 1,
        kind: "limit-exceeded",
      })

      await repository.saveCompletedAttempt(
        {
          answer: "문장을 명확하게 고쳤습니다.",
          lessonId,
          occurredAt: now,
          result: {
            improvements: ["근거를 더 붙이세요."],
            nextAction: "예시 한 문장을 추가하세요.",
            score: 84,
            scoreRange: [0, 100],
            showScore: true,
            strengths: ["핵심 문장이 앞에 있습니다."],
            summary: "의도가 분명합니다.",
          },
          stepId,
          userId: learnerId,
        },
        3
      )

      await expect(
        repository.countCompletedAttempts({
          lessonId,
          stepId,
          userId: learnerId,
        })
      ).resolves.toBe(2)
      await expect(
        repository.countCompletedAttempts({
          lessonId,
          stepId,
          userId: otherLearnerId,
        })
      ).resolves.toBe(0)

      expect(client.db.select().from(aiFeedbackAttempts).all()).toEqual([
        expect.objectContaining({
          answerText: "문장을 명확하게 고쳤습니다.",
          attemptNumber: 1,
          lessonId: "l-ai",
          resultJson: JSON.stringify({
            improvements: ["근거를 더 붙이세요."],
            nextAction: "예시 한 문장을 추가하세요.",
            score: 84,
            scoreRange: [0, 100],
            showScore: true,
            strengths: ["핵심 문장이 앞에 있습니다."],
            summary: "의도가 분명합니다.",
          }),
          stepId: "l-ai-s2",
          userId: "user-1",
        }),
        expect.objectContaining({
          answerText: "문장을 명확하게 고쳤습니다.",
          attemptNumber: 2,
          lessonId: "l-ai",
          stepId: "l-ai-s2",
          userId: "user-1",
        }),
      ])
    } finally {
      client.close()
    }
  })
})

function seedFeedbackBaseline(client: KwepDatabaseClient): void {
  runBaselineMigration(client.sqlite)

  client.db
    .insert(authUsers)
    .values([
      {
        createdAt: now,
        email: "learner@example.com",
        emailVerified: true,
        id: "user-1",
        image: null,
        name: "학습자",
        updatedAt: now,
      },
      {
        createdAt: now,
        email: "other@example.com",
        emailVerified: true,
        id: "user-2",
        image: null,
        name: "다른 학습자",
        updatedAt: now,
      },
    ])
    .run()
  client.db
    .insert(courses)
    .values({
      category: "입문자를 위한 코스",
      curriculumRevision: 0,
      description: "매일 조금씩 씁니다.",
      id: "c-ai",
      sortOrder: 1,
      status: "active",
      title: "AI 코칭 코스",
    })
    .run()
  client.db
    .insert(courseUnits)
    .values({
      courseId: "c-ai",
      id: "u-ai",
      sortOrder: 1,
      status: "active",
      title: "AI 코칭 유닛",
    })
    .run()
  client.db
    .insert(lessons)
    .values({
      category: "문장",
      courseId: "c-ai",
      description: "AI 피드백을 받습니다.",
      estimatedMinutes: 5,
      id: "l-ai",
      sortOrder: 1,
      status: "active",
      summaryJson: JSON.stringify(["AI 피드백"]),
      title: "AI 피드백 레슨",
      unitId: "u-ai",
    })
    .run()
  client.db
    .insert(lessonSteps)
    .values({
      contentJson: JSON.stringify({
        allowRetry: true,
        feedback: "기본 피드백",
        focus: "명확성",
        score: 80,
        scoreMax: 100,
        showScore: true,
        target: "l-ai-s1",
      }),
      id: "l-ai-s2",
      lessonId: "l-ai",
      sortOrder: 2,
      status: "active",
      type: "AI_FEEDBACK",
    })
    .run()
}
