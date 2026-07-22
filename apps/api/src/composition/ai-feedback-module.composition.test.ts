import { describe, expect, it, vi } from "vitest"
import { createApp } from "@workspace/http-platform/core"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import {
  inProgressLessonLearningStateSchema,
  learnerIdSchema,
} from "@workspace/contracts/learning/step-data"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { aiFeedbackAttempts } from "@workspace/ai-feedback/schema"
import { err, ok } from "@workspace/kernel/result"

import { composeAiFeedbackModule } from "@/composition/ai-feedback-module.composition"

const now = new Date("2026-07-23T02:00:00.000Z")
const learnerId = learnerIdSchema.parse("learner-1")
const lessonId = lessonIdSchema.parse("lesson-1")
const stepId = lessonStepIdSchema.parse("feedback-step")

describe("AI feedback module composition", () => {
  it("provider 성공을 먼저 저장하고 학습 전이 실패 뒤 같은 key 재시도에서 저장 결과를 재생한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineMigration(database.sqlite)
      const provider = vi.fn(async () =>
        ok({
          improvements: ["근거를 보강하세요."],
          nextAction: "예시를 추가하세요.",
          score: 80,
          strengths: ["주장이 명확합니다."],
          summary: "좋은 초안입니다.",
        })
      )
      const completeAiFeedbackStep = vi
        .fn()
        .mockResolvedValueOnce(
          err({ kind: "step-sequence-conflict", lessonId, stepId })
        )
        .mockResolvedValueOnce(
          ok({
            evaluation: null,
            kind: "advanced",
            learning: inProgressLessonLearningStateSchema.parse({
              completedSteps: 2,
              currentStepId: "next-step",
              currentStepIndex: 3,
              progressPercent: 75,
              status: "in_progress",
              totalSteps: 4,
              version: {
                curriculumVersionId: "version-1",
                revision: 1,
              },
            }),
          })
        )
      const composed = composeAiFeedbackModule({
        database: database.db,
        idGenerator: () => "attempt-1",
        learnerTransitionRepository: {
          completeAiFeedbackStep,
          async prepareAiFeedback() {
            return ok({
              answer: "학습자가 저장한 답변",
              courseId: courseIdSchema.parse("course-1"),
              curriculumVersionId: curriculumVersionIdSchema.parse("version-1"),
              focus: "명확성",
              lessonTitle: "좋은 문장",
              showScore: true,
            })
          },
        },
        model: "test-model",
        now: () => now,
        provider: { createFeedback: provider },
        sessionResolver: {
          async resolveSession() {
            return {
              user: {
                email: "learner@example.com",
                id: learnerId,
                image: null,
                joinedAt: "2026-07-23T00:00:00.000Z",
                name: "학습자",
                status: "active",
              },
            }
          },
        },
        sqlite: database.sqlite,
      })
      const app = createApp({ routes: composed.routes })

      const first = await request(app)
      expect(first.status).toBe(409)
      expect(database.db.select().from(aiFeedbackAttempts).get()).toMatchObject(
        { id: "attempt-1", status: "succeeded" }
      )

      const replay = await request(app)
      expect(replay.status).toBe(200)
      await expect(replay.json()).resolves.toMatchObject({
        feedback: { remainingAttempts: 2 },
        transition: { status: "advanced" },
      })
      expect(provider).toHaveBeenCalledTimes(1)
      expect(completeAiFeedbackStep).toHaveBeenCalledTimes(2)
    } finally {
      database.close()
    }
  })
})

function request(app: ReturnType<typeof createApp>) {
  return app.request(
    "/learning/lessons/lesson-1/steps/feedback-step/ai-feedback",
    {
      headers: { "Idempotency-Key": "request-1" },
      method: "POST",
    }
  )
}
