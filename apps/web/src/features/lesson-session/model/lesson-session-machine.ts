import type {
  LessonCompleteLessonResult,
  LessonStepDraftAnswer,
  LessonStepEvaluation,
} from "@/features/lesson-session/model/lesson-view-model"

type LessonCheckedState =
  | false
  | {
      readonly correct: boolean
      readonly evaluation?: LessonStepEvaluation | null | undefined
      readonly explanation?: string | undefined
    }

type ActiveLessonSession = {
  readonly activity: "idle" | "submitting"
  readonly answerPayloads: Readonly<Record<string, LessonStepDraftAnswer>>
  readonly checked: LessonCheckedState
  readonly completedStepIds: readonly string[]
  readonly currentQueueIndex: number
  readonly mistakeCount: number
  readonly progressPercent: number
  readonly stepQueue: readonly string[]
  readonly submitError: null | string
  readonly totalAttempts: number
}

export type LessonSessionState =
  | { readonly startError: null | string; readonly status: "not-started" }
  | { readonly status: "starting" }
  | (ActiveLessonSession & { readonly status: "active" })
  | {
      readonly completion: LessonCompleteLessonResult | null
      readonly currentStepIndex: number
      readonly status: "complete"
    }

export type LessonSessionEvent =
  | { readonly type: "START_REQUESTED" }
  | {
      readonly answerPayloads: Readonly<Record<string, LessonStepDraftAnswer>>
      readonly currentStepIndex: number
      readonly initialStepIds: readonly string[]
      readonly progressPercent: number
      readonly type: "START_SUCCEEDED"
    }
  | { readonly message: string; readonly type: "START_FAILED" }
  | {
      readonly payload: LessonStepDraftAnswer
      readonly stepId: string
      readonly type: "ANSWER_PAYLOAD_CHANGED"
    }
  | {
      readonly payload: LessonStepDraftAnswer | null
      readonly stepId: string
      readonly type: "DRAFT_RECONCILED"
    }
  | {
      readonly evaluation?: LessonStepEvaluation | null | undefined
      readonly explanation?: string | undefined
      readonly isCorrect: boolean
      readonly stepId: string
      readonly totalOriginalSteps: number
      readonly type: "STEP_EVALUATED"
    }
  | { readonly type: "CONTINUE_REQUESTED" }
  | { readonly type: "COMPLETE_LESSON_REQUESTED" }
  | { readonly message: string; readonly type: "COMPLETE_LESSON_FAILED" }
  | {
      readonly completion: LessonCompleteLessonResult
      readonly type: "COMPLETE_LESSON_SUCCEEDED"
    }

class LessonSessionTransitionError extends Error {
  constructor(state: LessonSessionState, event: LessonSessionEvent) {
    super(
      `레슨 세션의 ${state.status} 상태에서는 ${event.type} event를 처리할 수 없습니다.`
    )
    this.name = "LessonSessionTransitionError"
  }
}

export function createLessonSessionState(
  currentStepIndex: number,
  hasStarted: boolean,
  isComplete: boolean,
  initialDrafts: Readonly<Record<string, LessonStepDraftAnswer>>,
  initialProgressPercent: number,
  initialStepIds: readonly string[]
): LessonSessionState {
  if (isComplete) {
    return {
      completion: null,
      currentStepIndex,
      status: "complete",
    }
  }

  if (!hasStarted) {
    return {
      startError: null,
      status: "not-started",
    }
  }

  return {
    activity: "idle",
    answerPayloads: initialDrafts,
    checked: false,
    completedStepIds: [],
    currentQueueIndex: 0,
    mistakeCount: 0,
    progressPercent: initialProgressPercent,
    status: "active",
    stepQueue: initialStepIds,
    submitError: null,
    totalAttempts: 0,
  }
}

export function transitionLessonSession(
  state: LessonSessionState,
  event: LessonSessionEvent
): LessonSessionState {
  if (event.type === "START_REQUESTED") {
    if (state.status !== "not-started") {
      throw new LessonSessionTransitionError(state, event)
    }

    return { status: "starting" }
  }

  if (event.type === "START_FAILED") {
    if (state.status !== "starting") {
      throw new LessonSessionTransitionError(state, event)
    }

    return {
      startError: event.message,
      status: "not-started",
    }
  }

  if (event.type === "START_SUCCEEDED") {
    if (state.status !== "starting") {
      throw new LessonSessionTransitionError(state, event)
    }

    return {
      activity: "idle",
      answerPayloads: event.answerPayloads,
      checked: false,
      completedStepIds: [],
      currentQueueIndex: 0,
      mistakeCount: 0,
      progressPercent: event.progressPercent,
      status: "active",
      stepQueue: event.initialStepIds,
      submitError: null,
      totalAttempts: 0,
    }
  }

  if (state.status !== "active") {
    throw new LessonSessionTransitionError(state, event)
  }

  if (event.type === "ANSWER_PAYLOAD_CHANGED" && state.activity === "idle") {
    return {
      ...state,
      answerPayloads: {
        ...state.answerPayloads,
        [event.stepId]: event.payload,
      },
    }
  }

  if (event.type === "DRAFT_RECONCILED" && state.activity === "idle") {
    if (event.payload === null) {
      if (state.answerPayloads[event.stepId] === undefined) {
        return state
      }

      const answerPayloads = { ...state.answerPayloads }
      delete answerPayloads[event.stepId]
      return {
        ...state,
        answerPayloads,
      }
    }

    return {
      ...state,
      answerPayloads: {
        ...state.answerPayloads,
        [event.stepId]: event.payload,
      },
    }
  }

  if (event.type === "STEP_EVALUATED" && state.activity === "idle") {
    const totalAttempts = state.totalAttempts + 1
    if (event.isCorrect) {
      const completedStepIds = state.completedStepIds.includes(event.stepId)
        ? state.completedStepIds
        : [...state.completedStepIds, event.stepId]
      const progressPercent =
        event.totalOriginalSteps > 0
          ? Math.round(
              (completedStepIds.length / event.totalOriginalSteps) * 100
            )
          : 100

      return {
        ...state,
        checked: {
          correct: true,
          evaluation: event.evaluation,
          explanation: event.explanation,
        },
        completedStepIds,
        progressPercent,
        submitError: null,
        totalAttempts,
      }
    }

    // When incorrect: re-queue current step to the end of the queue
    const stepQueue = [...state.stepQueue, event.stepId]
    const mistakeCount = state.mistakeCount + 1

    return {
      ...state,
      checked: {
        correct: false,
        evaluation: event.evaluation,
        explanation: event.explanation,
      },
      mistakeCount,
      stepQueue,
      submitError: null,
      totalAttempts,
    }
  }

  if (event.type === "CONTINUE_REQUESTED" && state.activity === "idle") {
    const nextQueueIndex = state.currentQueueIndex + 1
    if (nextQueueIndex < state.stepQueue.length) {
      const nextStepId = state.stepQueue[nextQueueIndex]
      // Clear answer payload for next step if it's a re-queued step
      const answerPayloads = { ...state.answerPayloads }
      if (nextStepId !== undefined) {
        delete answerPayloads[nextStepId]
      }

      return {
        ...state,
        answerPayloads,
        checked: false,
        currentQueueIndex: nextQueueIndex,
        submitError: null,
      }
    }
    return state
  }

  if (event.type === "COMPLETE_LESSON_REQUESTED" && state.activity === "idle") {
    return { ...state, activity: "submitting", submitError: null }
  }

  if (
    event.type === "COMPLETE_LESSON_FAILED" &&
    state.activity === "submitting"
  ) {
    return { ...state, activity: "idle", submitError: event.message }
  }

  if (
    event.type === "COMPLETE_LESSON_SUCCEEDED" &&
    state.activity === "submitting"
  ) {
    return {
      completion: event.completion,
      currentStepIndex: state.stepQueue.length - 1,
      status: "complete",
    }
  }

  throw new LessonSessionTransitionError(state, event)
}
