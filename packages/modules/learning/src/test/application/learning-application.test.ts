import { describe, expect, it, vi } from "vitest"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"
import {
  learnerIdSchema,
  lessonStepItemIdSchema,
} from "@workspace/contracts/learning/ids"
import { err, ok } from "@workspace/kernel/result"

import {
  createLearningApplication,
  type LearningApplication,
} from "#learning/application/learning-application"
import type { LearningApplicationDependencies } from "#learning/application/ports/learning-ports"
import type { LearningCurriculum } from "#learning/domain/learning-types"

const learnerId = learnerIdSchema.parse("learner-1")
const courseId = courseIdSchema.parse("course-1")
const curriculumVersionId = curriculumVersionIdSchema.parse("curriculum-1")
const lessonId = lessonIdSchema.parse("lesson-1")
const stepId = lessonStepIdSchema.parse("step-1")
const nextStepId = lessonStepIdSchema.parse("step-2")
const unitId = unitIdSchema.parse("unit-1")
const occurredAt = new Date("2026-07-22T15:00:00.000Z")

const curriculum: LearningCurriculum = {
  category: "기초",
  contentStatus: "active",
  courseId,
  curriculumVersionId,
  description: "설명",
  lessons: [
    {
      category: null,
      description: null,
      estimatedMinutes: 5,
      id: lessonId,
      sortOrder: 1,
      status: "active",
      steps: [
        {
          body: "본문",
          guide: "안내",
          id: stepId,
          sortOrder: 1,
          title: "읽기",
          type: "READING",
        },
        {
          allowRetry: true,
          feedback: "피드백",
          focus: "명료성",
          id: nextStepId,
          score: 80,
          scoreMax: 100,
          showScore: true,
          sortOrder: 2,
          target: stepId,
          type: "AI_FEEDBACK",
        },
      ],
      summary: [],
      title: "첫 레슨",
      unitId,
      unitSortOrder: 1,
    },
  ],
  revision: 1,
  title: "코스",
  units: [{ id: unitId, sortOrder: 1, status: "active", title: "단원" }],
  visualKey: "basic-sentence-writing",
}

const inProgress = {
  completedSteps: 0,
  currentStepId: stepId,
  currentStepIndex: 0,
  progressPercent: 0,
  status: "in_progress" as const,
  totalSteps: 2,
  version: { curriculumVersionId, revision: 1 },
}

describe("learning application", () => {
  it("lesson start에 identity, content, Clock과 transition port를 순서대로 사용한다", async () => {
    const fixture = createFixture()

    const result = await fixture.application.startLesson({
      expectedCurriculumVersionId: curriculumVersionId,
      learnerId,
      lessonId,
    })

    expect(result).toEqual(ok(inProgress))
    expect(
      fixture.dependencies.identity.readLearnerStatus
    ).toHaveBeenCalledWith(learnerId)
    expect(
      fixture.dependencies.content.findCurriculumByLesson
    ).toHaveBeenCalledWith({ lessonId })
    expect(
      fixture.dependencies.transitionRepository.startLesson
    ).toHaveBeenCalledWith(
      {
        expectedCurriculumVersionId: curriculumVersionId,
        lessonId,
        occurredAt,
        userId: learnerId,
      },
      curriculum
    )
  })

  it("answer와 acknowledge command를 별도 completion으로 전달한다", async () => {
    const fixture = createFixture()
    const submission = {
      selectedOptionId: lessonStepItemIdSchema.parse("answer-1"),
      type: "MULTIPLE_CHOICE" as const,
    }

    await fixture.application.answerStep({
      learnerId,
      lessonId,
      stepId,
      submission,
    })
    await fixture.application.completeStep({ learnerId, lessonId, stepId })

    expect(
      fixture.dependencies.transitionRepository.completeStep
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ completion: { kind: "answer", submission } }),
      curriculum
    )
    expect(
      fixture.dependencies.transitionRepository.completeStep
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ completion: { kind: "acknowledge" } }),
      curriculum
    )
  })

  it("오답 retry를 expected answer rejection 결과로 보존한다", async () => {
    const fixture = createFixture({
      completeStepResult: ok({
        evaluation: {
          correct: false,
          correctItemIds: ["answer-2"],
          explanation: "다시 생각해 보세요.",
          items: [
            { id: "answer-1", verdict: "incorrect" },
            { id: "answer-2", verdict: "missed" },
          ],
          type: "MULTIPLE_CHOICE",
        },
        kind: "retry",
        learning: inProgress,
      }),
    })

    const result = await fixture.application.answerStep({
      learnerId,
      lessonId,
      stepId,
      submission: {
        selectedOptionId: lessonStepItemIdSchema.parse("answer-1"),
        type: "MULTIPLE_CHOICE",
      },
    })

    expect(result.isOk() && result.value.kind).toBe("retry")
  })

  it("inactive, missing identity와 identity 실패를 transition 이전에 거부한다", async () => {
    for (const [identityResult, expectedKind] of [
      [ok("suspended" as const), "learner-inactive"],
      [err({ kind: "identity-not-found" as const }), "learner-not-found"],
      [err({ kind: "identity-conflict" as const }), "identity-query-failed"],
    ] as const) {
      const fixture = createFixture({ identityResult })

      const result = await fixture.application.completeStep({
        learnerId,
        lessonId,
        stepId,
      })

      expect(result.isErr() && result.error.kind).toBe(expectedKind)
      expect(
        fixture.dependencies.transitionRepository.completeStep
      ).not.toHaveBeenCalled()
    }
  })

  it("content not-found와 transition conflict를 구분한다", async () => {
    const missing = createFixture({ curriculum: null })
    const conflicted = createFixture({
      completeStepResult: err({
        kind: "step-sequence-conflict",
        lessonId,
        stepId,
      }),
    })

    const missingResult = await missing.application.completeStep({
      learnerId,
      lessonId,
      stepId,
    })
    const conflictResult = await conflicted.application.completeStep({
      learnerId,
      lessonId,
      stepId,
    })

    expect(missingResult.isErr() && missingResult.error.kind).toBe(
      "lesson-not-found"
    )
    expect(conflictResult.isErr() && conflictResult.error.kind).toBe(
      "step-sequence-conflict"
    )
  })

  it("pinned revision은 현재 published revision 대신 정확한 content snapshot을 읽는다", async () => {
    const fixture = createFixture({ pinned: true })

    await fixture.application.completeStep({ learnerId, lessonId, stepId })

    expect(fixture.dependencies.content.readCurriculum).toHaveBeenCalledWith({
      courseId,
      curriculumVersionId,
    })
    expect(
      fixture.dependencies.content.findCurriculumByLesson
    ).not.toHaveBeenCalled()
  })

  it("AI feedback 준비, provider, 완료 transition을 분리하고 결과를 결합한다", async () => {
    const fixture = createFixture()

    const result = await fixture.application.requestAiFeedback(
      { idempotencyKey: "request-1", learnerId, lessonId, stepId: nextStepId },
      { signal: AbortSignal.abort() }
    )

    expect(result.isOk() && result.value.feedback.summary).toBe("요약")
    expect(
      fixture.dependencies.transitionRepository.prepareAiFeedback
    ).toHaveBeenCalledBefore(
      fixture.dependencies.aiFeedback.requestFeedback as ReturnType<
        typeof vi.fn
      >
    )
    expect(
      fixture.dependencies.aiFeedback.requestFeedback
    ).toHaveBeenCalledBefore(
      fixture.dependencies.transitionRepository
        .completeAiFeedbackStep as ReturnType<typeof vi.fn>
    )
  })

  it("AI 준비 거부, provider 실패와 finalize conflict를 각각 그대로 반환한다", async () => {
    const cases = [
      createFixture({
        prepareResult: err({
          kind: "feedback-answer-not-found",
          targetStepId: stepId,
        }),
      }),
      createFixture({
        aiResult: err({
          kind: "provider-unavailable",
          remainingAttempts: 1,
        }),
      }),
      createFixture({
        completeAiResult: err({
          kind: "step-sequence-conflict",
          lessonId,
          stepId: nextStepId,
        }),
      }),
    ]

    const results = await Promise.all(
      cases.map((fixture) =>
        fixture.application.requestAiFeedback({
          idempotencyKey: "request-1",
          learnerId,
          lessonId,
          stepId: nextStepId,
        })
      )
    )

    expect(
      results.map((result) => (result.isErr() ? result.error.kind : null))
    ).toEqual([
      "feedback-answer-not-found",
      "provider-unavailable",
      "step-sequence-conflict",
    ])
  })
})

const advanced = {
  evaluation: null,
  kind: "advanced" as const,
  learning: inProgress,
}

type FixtureOverrides = Readonly<{
  aiResult?: Awaited<
    ReturnType<LearningApplicationDependencies["aiFeedback"]["requestFeedback"]>
  >
  completeAiResult?: Awaited<
    ReturnType<
      LearningApplicationDependencies["transitionRepository"]["completeAiFeedbackStep"]
    >
  >
  completeStepResult?: Awaited<
    ReturnType<
      LearningApplicationDependencies["transitionRepository"]["completeStep"]
    >
  >
  curriculum?: LearningCurriculum | null
  identityResult?: Awaited<
    ReturnType<LearningApplicationDependencies["identity"]["readLearnerStatus"]>
  >
  pinned?: boolean
  prepareResult?: Awaited<
    ReturnType<
      LearningApplicationDependencies["transitionRepository"]["prepareAiFeedback"]
    >
  >
}>

function createFixture(overrides: FixtureOverrides = {}): {
  application: LearningApplication
  dependencies: LearningApplicationDependencies
} {
  const selectedCurriculum =
    overrides.curriculum === undefined ? curriculum : overrides.curriculum
  const dependencies: LearningApplicationDependencies = {
    aiFeedback: {
      requestFeedback: vi.fn(
        async () =>
          overrides.aiResult ??
          ok({
            improvements: ["개선"],
            nextAction: "다음 행동",
            remainingAttempts: 1,
            score: 80,
            scoreRange: [0, 100] as const,
            showScore: true,
            strengths: ["장점"],
            summary: "요약",
          })
      ),
    },
    clock: { now: vi.fn(() => new Date(occurredAt)) },
    content: {
      findCurriculumByLesson: vi.fn(async () => selectedCurriculum),
      listPublishedCourses: vi.fn(async () => []),
      readCurriculum: vi.fn(async () => selectedCurriculum),
    },
    identity: {
      readLearnerStatus: vi.fn(
        async () => overrides.identityResult ?? ok("active" as const)
      ),
    },
    transitionRepository: {
      completeAiFeedbackStep: vi.fn(
        async () => overrides.completeAiResult ?? ok(advanced)
      ),
      completeStep: vi.fn(
        async () => overrides.completeStepResult ?? ok(advanced)
      ),
      findPinnedScope: vi.fn(async () =>
        overrides.pinned ? { courseId, curriculumVersionId, lessonId } : null
      ),
      prepareAiFeedback: vi.fn(
        async () =>
          overrides.prepareResult ??
          ok({
            answer: "답변",
            courseId,
            curriculumVersionId,
            focus: "명료성",
            lessonTitle: "첫 레슨",
            showScore: true,
          })
      ),
      startLesson: vi.fn(async () => ok(inProgress)),
    },
  }

  return { application: createLearningApplication(dependencies), dependencies }
}
