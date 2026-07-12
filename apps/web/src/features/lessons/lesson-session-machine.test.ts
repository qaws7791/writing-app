import { describe, expect, it } from "vitest"

import {
  createLessonSessionState,
  LessonSessionTransitionError,
  transitionLessonSession,
  type LessonSessionEvent,
  type LessonSessionState,
} from "@/features/lessons/lesson-session-machine"

describe("레슨 세션 상태 전이", () => {
  it("시작 실패 후 같은 세션에서 다시 시작할 수 있다", () => {
    const starting = transitionLessonSession(
      createLessonSessionState(0, false),
      { type: "START_REQUESTED" }
    )
    const failed = transitionLessonSession(starting, {
      message: "시작 실패",
      type: "START_FAILED",
    })

    expect(failed).toEqual({
      startError: "시작 실패",
      status: "not-started",
    })
    expect(
      transitionLessonSession(failed, { type: "START_REQUESTED" })
    ).toEqual({ status: "starting" })
  })

  it.each<{
    readonly event: LessonSessionEvent
    readonly name: string
    readonly state: LessonSessionState
  }>([
    {
      event: { type: "START_REQUESTED" },
      name: "중복 시작",
      state: { status: "starting" },
    },
    {
      event: { type: "PROGRESS_SAVE_REQUESTED" },
      name: "중복 진행 저장",
      state: {
        ...activeState(),
        activity: "saving-progress",
      },
    },
    {
      event: { type: "COMPLETE_REQUESTED" },
      name: "중복 완료 저장",
      state: {
        ...activeState(),
        activity: "completing",
      },
    },
  ])("$name event를 명시적으로 거부한다", ({ event, state }) => {
    expect(() => transitionLessonSession(state, event)).toThrow(
      LessonSessionTransitionError
    )
  })

  it("진행 저장과 완료 전이를 순서대로 고정한다", () => {
    const savingProgress = transitionLessonSession(activeState(), {
      type: "PROGRESS_SAVE_REQUESTED",
    })
    const nextStep = transitionLessonSession(savingProgress, {
      currentStepIndex: 1,
      type: "PROGRESS_SAVE_SUCCEEDED",
    })
    const completing = transitionLessonSession(nextStep, {
      type: "COMPLETE_REQUESTED",
    })
    const complete = transitionLessonSession(completing, {
      type: "COMPLETE_SUCCEEDED",
    })

    expect(nextStep).toMatchObject({
      activity: "idle",
      currentStepIndex: 1,
      status: "active",
    })
    expect(complete).toEqual({ currentStepIndex: 1, status: "complete" })
  })
})

function activeState(): Extract<
  LessonSessionState,
  { readonly status: "active" }
> {
  return createLessonSessionState(0, true) as Extract<
    LessonSessionState,
    { readonly status: "active" }
  >
}
