import type { LessonStepAnswerPayload } from "@/features/lessons/lesson-logic"
import type { LessonStepCheckedState } from "@/features/lessons/lesson-step-policy"

export type LessonAnswerSaveState =
  | { readonly status: "idle" }
  | {
      readonly requestId: number
      readonly status: "ok" | "pending"
      readonly stepId: string
    }
  | {
      readonly message: string
      readonly requestId: number
      readonly status: "error"
      readonly stepId: string
    }

type ActiveLessonSession = {
  readonly answerPayloads: Readonly<Record<string, LessonStepAnswerPayload>>
  readonly answerSave: LessonAnswerSaveState
  readonly checked: false | LessonStepCheckedState
  readonly completeError: null | string
  readonly currentStepIndex: number
}

export type LessonSessionState =
  | {
      readonly startError: null | string
      readonly status: "not-started"
    }
  | {
      readonly status: "starting"
    }
  | (ActiveLessonSession & {
      readonly activity: "idle" | "saving-progress" | "completing"
      readonly status: "active"
    })
  | {
      readonly currentStepIndex: number
      readonly status: "complete"
    }

export type LessonSessionEvent =
  | { readonly type: "START_REQUESTED" }
  | {
      readonly currentStepIndex: number
      readonly type: "START_SUCCEEDED"
    }
  | { readonly message: string; readonly type: "START_FAILED" }
  | {
      readonly payload: LessonStepAnswerPayload
      readonly stepId: string
      readonly type: "ANSWER_PAYLOAD_CHANGED"
    }
  | {
      readonly checked: false | LessonStepCheckedState
      readonly type: "CHECKED_CHANGED"
    }
  | {
      readonly requestId: number
      readonly stepId: string
      readonly type: "ANSWER_SAVE_REQUESTED"
    }
  | {
      readonly requestId: number
      readonly stepId: string
      readonly type: "ANSWER_SAVE_SUCCEEDED"
    }
  | {
      readonly message: string
      readonly requestId: number
      readonly stepId: string
      readonly type: "ANSWER_SAVE_FAILED"
    }
  | { readonly type: "PROGRESS_SAVE_REQUESTED" }
  | { readonly type: "PROGRESS_SAVE_BLOCKED" }
  | {
      readonly currentStepIndex: number
      readonly type: "PROGRESS_SAVE_SUCCEEDED"
    }
  | { readonly message: string; readonly type: "PROGRESS_SAVE_FAILED" }
  | { readonly type: "COMPLETE_REQUESTED" }
  | { readonly type: "COMPLETE_BLOCKED" }
  | { readonly type: "COMPLETE_SUCCEEDED" }
  | { readonly message: string; readonly type: "COMPLETE_FAILED" }

export class LessonSessionTransitionError extends Error {
  constructor(state: LessonSessionState, event: LessonSessionEvent) {
    super(
      `레슨 세션의 ${state.status} 상태에서는 ${event.type} event를 처리할 수 없습니다.`
    )
    this.name = "LessonSessionTransitionError"
  }
}

export function createLessonSessionState(
  currentStepIndex: number,
  hasStarted: boolean
): LessonSessionState {
  return hasStarted
    ? createActiveLessonSession(currentStepIndex)
    : { startError: null, status: "not-started" }
}

export function transitionLessonSession(
  state: LessonSessionState,
  event: LessonSessionEvent
): LessonSessionState {
  switch (state.status) {
    case "not-started":
      if (event.type === "START_REQUESTED") {
        return { status: "starting" }
      }
      throw new LessonSessionTransitionError(state, event)

    case "starting":
      if (event.type === "START_SUCCEEDED") {
        return createActiveLessonSession(event.currentStepIndex)
      }
      if (event.type === "START_FAILED") {
        return { startError: event.message, status: "not-started" }
      }
      throw new LessonSessionTransitionError(state, event)

    case "active":
      return transitionActiveLessonSession(state, event)

    case "complete":
      throw new LessonSessionTransitionError(state, event)
  }
}

function transitionActiveLessonSession(
  state: Extract<LessonSessionState, { readonly status: "active" }>,
  event: LessonSessionEvent
): LessonSessionState {
  if (event.type === "ANSWER_PAYLOAD_CHANGED") {
    return {
      ...state,
      answerPayloads: {
        ...state.answerPayloads,
        [event.stepId]: event.payload,
      },
    }
  }

  if (event.type === "ANSWER_SAVE_REQUESTED") {
    return {
      ...state,
      answerSave: {
        requestId: event.requestId,
        status: "pending",
        stepId: event.stepId,
      },
    }
  }

  if (
    event.type === "ANSWER_SAVE_SUCCEEDED" ||
    event.type === "ANSWER_SAVE_FAILED"
  ) {
    if (
      state.answerSave.status === "idle" ||
      state.answerSave.requestId !== event.requestId
    ) {
      throw new LessonSessionTransitionError(state, event)
    }

    return {
      ...state,
      answerSave:
        event.type === "ANSWER_SAVE_SUCCEEDED"
          ? {
              requestId: event.requestId,
              status: "ok",
              stepId: event.stepId,
            }
          : {
              message: event.message,
              requestId: event.requestId,
              status: "error",
              stepId: event.stepId,
            },
    }
  }

  if (state.activity === "idle") {
    if (event.type === "CHECKED_CHANGED") {
      return { ...state, checked: event.checked }
    }
    if (event.type === "PROGRESS_SAVE_REQUESTED") {
      return {
        ...state,
        activity: "saving-progress",
        completeError: null,
      }
    }
    if (event.type === "COMPLETE_REQUESTED") {
      return { ...state, activity: "completing", completeError: null }
    }
  }

  if (state.activity === "saving-progress") {
    if (event.type === "PROGRESS_SAVE_BLOCKED") {
      return { ...state, activity: "idle" }
    }
    if (event.type === "PROGRESS_SAVE_SUCCEEDED") {
      return {
        ...state,
        activity: "idle",
        checked: false,
        currentStepIndex: event.currentStepIndex,
      }
    }
    if (event.type === "PROGRESS_SAVE_FAILED") {
      return {
        ...state,
        activity: "idle",
        completeError: event.message,
      }
    }
  }

  if (state.activity === "completing") {
    if (event.type === "COMPLETE_BLOCKED") {
      return { ...state, activity: "idle" }
    }
    if (event.type === "COMPLETE_SUCCEEDED") {
      return {
        currentStepIndex: state.currentStepIndex,
        status: "complete",
      }
    }
    if (event.type === "COMPLETE_FAILED") {
      return {
        ...state,
        activity: "idle",
        completeError: event.message,
      }
    }
  }

  throw new LessonSessionTransitionError(state, event)
}

function createActiveLessonSession(
  currentStepIndex: number
): Extract<LessonSessionState, { readonly status: "active" }> {
  return {
    activity: "idle",
    answerPayloads: {},
    answerSave: { status: "idle" },
    checked: false,
    completeError: null,
    currentStepIndex,
    status: "active",
  }
}
