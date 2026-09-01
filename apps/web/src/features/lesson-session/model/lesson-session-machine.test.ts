import { describe, expect, it } from "vitest"

import {
  createLessonSessionState,
  transitionLessonSession,
  type LessonSessionState,
} from "@/features/lesson-session/model/lesson-session-machine"
import { completeLearnerLessonResultSchema } from "@workspace/contracts/learning/learner-transition"

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
})

function createActiveSession(stepIds: string[]): LessonSessionState {
  const notStarted = createLessonSessionState(0, false, false, {}, 0, stepIds)
  const starting = transitionLessonSession(notStarted, {
    type: "START_REQUESTED",
  })
  return transitionLessonSession(starting, {
    answerPayloads: {},
    currentStepIndex: 0,
    initialStepIds: stepIds,
    progressPercent: 0,
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
