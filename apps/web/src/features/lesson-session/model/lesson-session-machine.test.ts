import { describe, expect, it } from "vitest"

import {
  createLessonSessionState,
  remainingLessonStepIds,
  transitionLessonSession,
  type LessonSessionState,
} from "@/features/lesson-session/model/lesson-session-machine"
import {
  completeLearnerLessonResultSchema,
  type LearnerStepDraftAnswer,
} from "@workspace/contracts/learning/learner-transition"

describe("lesson session machine (client-driven queue)", () => {
  it("정답 평가 시 완료 목록에 추가되고 정답 상태가 된다", () => {
    const active = createActiveSession(["step-1", "step-2"])
    const evaluated = transitionLessonSession(active, {
      isCorrect: true,
      stepId: "step-1",
      totalOriginalSteps: 2,
      type: "STEP_EVALUATED",
    })

    expect(evaluated).toMatchObject({
      activity: "idle",
      checked: { correct: true },
      completedStepIds: ["step-1"],
      progressPercent: 50,
      status: "active",
      totalAttempts: 1,
    })
  })

  it("오답 평가 시 stepQueue 맨 뒤에 재시도 스텝이 추가된다", () => {
    const active = createActiveSession(["step-1", "step-2"])
    const evaluated = transitionLessonSession(active, {
      explanation: "해설입니다",
      isCorrect: false,
      stepId: "step-1",
      totalOriginalSteps: 2,
      type: "STEP_EVALUATED",
    })

    expect(evaluated).toMatchObject({
      activity: "idle",
      checked: { correct: false, explanation: "해설입니다" },
      completedStepIds: [],
      mistakeCount: 1,
      stepQueue: ["step-1", "step-2", "step-1"],
      status: "active",
      totalAttempts: 1,
    })
  })

  it("계속하기 시 큐의 다음 스텝으로 이동한다", () => {
    const active = createActiveSession(["step-1", "step-2"])
    const evaluated = transitionLessonSession(active, {
      isCorrect: true,
      stepId: "step-1",
      totalOriginalSteps: 2,
      type: "STEP_EVALUATED",
    })

    const continued = transitionLessonSession(evaluated, {
      type: "CONTINUE_REQUESTED",
    })

    expect(continued).toMatchObject({
      checked: false,
      currentQueueIndex: 1,
      status: "active",
    })
  })

  it("레슨 완료 성공 시 완료 결과와 상태를 저장한다", () => {
    const completion = createLessonCompletedResultFixture()
    const active = createActiveSession(["step-1"])
    const submitting = transitionLessonSession(active, {
      type: "COMPLETE_LESSON_REQUESTED",
    })
    const completed = transitionLessonSession(submitting, {
      completion,
      type: "COMPLETE_LESSON_SUCCEEDED",
    })

    expect(completed).toEqual({
      completion,
      currentStepIndex: 0,
      status: "complete",
    })
  })

  it("starting에서 START_REQUESTED를 다시 받으면 상태를 유지한다", () => {
    const starting = transitionLessonSession(
      createLessonSessionState(false, false, {}, ["step-1"]),
      { type: "START_REQUESTED" }
    )

    expect(transitionLessonSession(starting, { type: "START_REQUESTED" })).toBe(
      starting
    )
  })

  it("START_FAILED 메시지가 없으면 startError를 비운다", () => {
    const starting = transitionLessonSession(
      createLessonSessionState(false, false, {}, ["step-1"]),
      { type: "START_REQUESTED" }
    )

    expect(
      transitionLessonSession(starting, { message: null, type: "START_FAILED" })
    ).toEqual({
      startError: null,
      status: "not-started",
    })
  })

  it("이미 채점된 스텝의 STEP_EVALUATED는 카운트를 바꾸지 않는다", () => {
    const active = createActiveSession(["step-1", "step-2"])
    const evaluated = transitionLessonSession(active, {
      isCorrect: false,
      stepId: "step-1",
      totalOriginalSteps: 2,
      type: "STEP_EVALUATED",
    })
    const repeated = transitionLessonSession(evaluated, {
      isCorrect: false,
      stepId: "step-1",
      totalOriginalSteps: 2,
      type: "STEP_EVALUATED",
    })

    expect(repeated).toMatchObject({
      mistakeCount: 1,
      stepQueue: ["step-1", "step-2", "step-1"],
      totalAttempts: 1,
    })
  })

  it("완료 저장 중 DRAFT_RECONCILED는 상태를 유지한다", () => {
    const submitting = transitionLessonSession(
      createActiveSession(["step-1"]),
      { type: "COMPLETE_LESSON_REQUESTED" }
    )

    expect(
      transitionLessonSession(submitting, {
        payload: null,
        stepId: "step-1",
        type: "DRAFT_RECONCILED",
      })
    ).toBe(submitting)
  })

  it("재큐 복사본으로 이동할 때만 다음 스텝 payload를 지운다", () => {
    const active = createActiveSession(["step-1", "step-2"], {
      "step-1": {
        selectedOptionId: "opt-1",
        type: "MULTIPLE_CHOICE",
      },
      "step-2": {
        selectedOptionId: "opt-2",
        type: "MULTIPLE_CHOICE",
      },
    })
    const incorrect = transitionLessonSession(active, {
      isCorrect: false,
      stepId: "step-1",
      totalOriginalSteps: 2,
      type: "STEP_EVALUATED",
    })
    const toOriginalNext = transitionLessonSession(incorrect, {
      type: "CONTINUE_REQUESTED",
    })

    expect(toOriginalNext.status).toBe("active")
    if (toOriginalNext.status !== "active") return
    expect(toOriginalNext.answerPayloads["step-2"]).toEqual({
      selectedOptionId: "opt-2",
      type: "MULTIPLE_CHOICE",
    })

    const evaluatedSecond = transitionLessonSession(toOriginalNext, {
      isCorrect: true,
      stepId: "step-2",
      totalOriginalSteps: 2,
      type: "STEP_EVALUATED",
    })
    const toRequeued = transitionLessonSession(evaluatedSecond, {
      type: "CONTINUE_REQUESTED",
    })

    expect(toRequeued.status).toBe("active")
    if (toRequeued.status !== "active") return
    expect(toRequeued.answerPayloads["step-1"]).toBeUndefined()
  })

  it("저장된 완료 스텝으로 남은 큐를 재구성한다", () => {
    const resumed = createLessonSessionState(
      true,
      false,
      {},
      ["step-1", "step-2", "step-3"],
      ["step-1"]
    )

    expect(resumed).toMatchObject({
      completedStepIds: ["step-1"],
      currentQueueIndex: 0,
      progressPercent: 33,
      status: "active",
      stepQueue: ["step-2", "step-3"],
    })
    expect(remainingLessonStepIds(["step-1", "step-2"], ["step-1"])).toEqual([
      "step-2",
    ])
  })
})

function createActiveSession(
  stepIds: string[],
  answerPayloads: Readonly<Record<string, LearnerStepDraftAnswer>> = {}
): LessonSessionState {
  const notStarted = createLessonSessionState(false, false, {}, stepIds)
  const starting = transitionLessonSession(notStarted, {
    type: "START_REQUESTED",
  })
  return transitionLessonSession(starting, {
    answerPayloads,
    completedStepIds: [],
    originalStepIds: stepIds,
    type: "START_SUCCEEDED",
  })
}

function createLessonCompletedResultFixture() {
  const completedAt = "2026-08-10T00:00:00.000Z"
  return completeLearnerLessonResultSchema.parse({
    accuracyPercent: 100,
    courseLearning: {
      completedAt,
      completedLessons: 1,
      lastActivityAt: completedAt,
      nextLesson: null,
      progressPercent: 100,
      status: "completed",
      totalLessons: 1,
      version: { curriculumVersionId: "version-1", revision: 1 },
    },
    durationMinutes: 5,
    lessonCompletion: { completedAt, totalSteps: 2 },
    status: "lesson_completed",
    streakDays: 1,
    streakIncreased: true,
  })
}
