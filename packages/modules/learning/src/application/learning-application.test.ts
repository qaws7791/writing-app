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
import type { LearnerCourseSummary } from "#learning/application/learning-read-model"
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
  coverAssetId: null,
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

const identityRejections: readonly Readonly<{
  expectedKind: string
  identityResult: Awaited<
    ReturnType<LearningApplicationDependencies["identity"]["readLearnerStatus"]>
  >
}>[] = [
  { expectedKind: "learner-inactive", identityResult: ok("suspended") },
  {
    expectedKind: "learner-not-found",
    identityResult: err({ kind: "identity-not-found" }),
  },
  {
    expectedKind: "identity-query-failed",
    identityResult: err({ kind: "identity-conflict" }),
  },
]

describe("learning application", () => {
  it("catalog 조회는 repository의 공개 허용 필드만 반환한다", async () => {
    const fixture = createFixture()
    const repositoryCourse: LearnerCourseSummary & {
      readonly internalSolution: string
    } = {
      category: "기초",
      contentStatus: "active",
      cover: null,
      description: "설명",
      id: courseId,
      internalSolution: "외부에 노출되면 안 됨",
      lessonCount: 1,
      title: "코스",
      version: { curriculumVersionId, revision: 1 },
      visualKey: "basic-sentence-writing",
    }
    vi.mocked(
      fixture.dependencies.readRepository.listCourses
    ).mockResolvedValue({
      items: [repositoryCourse],
      nextPosition: null,
    })

    const page = await fixture.application.readCourseCatalog({
      limit: 20,
    })

    expect(page.items[0]).not.toHaveProperty("internalSolution")
    expect(page.items[0]).toMatchObject({ id: courseId, title: "코스" })
  })

  it("lesson start에 identity, content, Clock과 transition port를 순서대로 사용한다", async () => {
    const fixture = createFixture()

    const result = await fixture.application.startLesson({
      expectedCurriculumVersionId: curriculumVersionId,
      learnerId,
      lessonId,
    })

    expect(result).toEqual(ok({ ...inProgress, drafts: [] }))
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

  it("draft command에 인증·pinned revision·expected version을 적용한다", async () => {
    const fixture = createFixture({ pinned: true })
    const answer = { text: "저장할 초안", type: "WRITE" as const }

    const result = await fixture.application.saveStepDraft({
      answer,
      expectedCurriculumVersionId: curriculumVersionId,
      expectedVersion: null,
      learnerId,
      lessonId,
      stepId,
    })

    expect(result.isOk() && result.value).toMatchObject({
      answer,
      stepId,
      version: 0,
    })
    expect(fixture.dependencies.content.readCurriculum).toHaveBeenCalledWith({
      courseId,
      curriculumVersionId,
    })
    expect(
      fixture.dependencies.transitionRepository.saveStepDraft
    ).toHaveBeenCalledWith(
      {
        answer,
        expectedCurriculumVersionId: curriculumVersionId,
        expectedVersion: null,
        lessonId,
        occurredAt,
        stepId,
        userId: learnerId,
      },
      curriculum
    )
  })

  it("오답 retry는 채점 evaluation payload를 그대로 보존해 반환한다", async () => {
    const evaluation = {
      correct: false,
      correctItemIds: ["answer-2"],
      explanation: "다시 생각해 보세요.",
      items: [
        { id: "answer-1", verdict: "incorrect" },
        { id: "answer-2", verdict: "missed" },
      ],
      type: "MULTIPLE_CHOICE",
    } as const
    const fixture = createFixture({
      completeStepResult: ok({
        evaluation,
        kind: "retry",
        learning: inProgress,
      }),
    })

    const result = await fixture.application.submitStep({
      completion: {
        kind: "answer",
        submission: {
          selectedOptionId: lessonStepItemIdSchema.parse("answer-1"),
          type: "MULTIPLE_CHOICE",
        },
      },
      learnerId,
      lessonId,
      stepId,
    })

    expect(result._unsafeUnwrap()).toMatchObject({ evaluation, kind: "retry" })
  })

  it.each(identityRejections)(
    "identity 결과가 $expectedKind 조건이면 transition 이전에 거부한다",
    async ({ expectedKind, identityResult }) => {
      const fixture = createFixture({ identityResult })

      const result = await fixture.application.submitStep({
        completion: { kind: "acknowledge" },
        learnerId,
        lessonId,
        stepId,
      })

      expect(result._unsafeUnwrapErr().kind).toBe(expectedKind)
      expect(
        fixture.dependencies.transitionRepository.completeStep
      ).not.toHaveBeenCalled()
    }
  )

  it("content not-found와 transition conflict를 구분한다", async () => {
    const missing = createFixture({ curriculum: null })
    const conflicted = createFixture({
      completeStepResult: err({
        kind: "step-sequence-conflict",
        lessonId,
        stepId,
      }),
    })

    const missingResult = await missing.application.submitStep({
      completion: { kind: "acknowledge" },
      learnerId,
      lessonId,
      stepId,
    })
    const conflictResult = await conflicted.application.submitStep({
      completion: { kind: "acknowledge" },
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

    await fixture.application.submitStep({
      completion: { kind: "acknowledge" },
      learnerId,
      lessonId,
      stepId,
    })

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

  it.each([
    {
      createCase: () =>
        createFixture({
          prepareResult: err({
            kind: "feedback-answer-not-found",
            targetStepId: stepId,
          }),
        }),
      expectedKind: "feedback-answer-not-found",
      name: "AI 준비 거부",
    },
    {
      createCase: () =>
        createFixture({
          aiResult: err({
            kind: "provider-unavailable",
            remainingAttempts: 1,
          }),
        }),
      expectedKind: "provider-unavailable",
      name: "provider 실패",
    },
    {
      createCase: () =>
        createFixture({
          completeAiResult: err({
            kind: "step-sequence-conflict",
            lessonId,
            stepId: nextStepId,
          }),
        }),
      expectedKind: "step-sequence-conflict",
      name: "finalize conflict",
    },
  ] as const)(
    "$name 결과를 그대로 반환한다",
    async ({ createCase, expectedKind }) => {
      const fixture = createCase()

      const result = await fixture.application.requestAiFeedback({
        idempotencyKey: "request-1",
        learnerId,
        lessonId,
        stepId: nextStepId,
      })

      expect(result._unsafeUnwrapErr().kind).toBe(expectedKind)
    }
  )
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
            strengths: ["장점"],
            summary: "요약",
          })
      ),
    },
    clock: { now: vi.fn(() => new Date(occurredAt)) },
    content: {
      findCurriculumByLesson: vi.fn(async () => selectedCurriculum),
      listPublishedCourses: vi.fn(async () => []),
      resolveAssetReferences: vi.fn(async () => []),
      readCurriculum: vi.fn(async () => selectedCurriculum),
    },
    identity: {
      readLearnerStatus: vi.fn(
        async () => overrides.identityResult ?? ok("active" as const)
      ),
    },
    readRepository: {
      findCourseDetail: vi.fn(async () => null),
      findLesson: vi.fn(async () => ({ kind: "not-found" as const })),
      listCourseCategories: vi.fn(async () => []),
      listCourses: vi.fn(async () => ({ items: [], nextPosition: null })),
      listProgress: vi.fn(async () => ({ items: [], nextPosition: null })),
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
          })
      ),
      saveStepDraft: vi.fn(async (command) =>
        ok({
          answer: command.answer,
          stepId: command.stepId,
          updatedAt: command.occurredAt.toISOString(),
          version: command.expectedVersion === null ? 0 : 1,
        })
      ),
      startLesson: vi.fn(async () => ok({ ...inProgress, drafts: [] })),
    },
  }

  return { application: createLearningApplication(dependencies), dependencies }
}
