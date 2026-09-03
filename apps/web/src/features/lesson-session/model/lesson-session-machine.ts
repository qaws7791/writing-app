import type {
  CompleteLearnerLessonResult,
  LearnerStepDraftAnswer,
  StepEvaluation,
} from "@workspace/contracts/learning/learner-transition"

type LessonCheckedState =
  | false
  | {
      readonly correct: boolean
      readonly evaluation?: StepEvaluation | null | undefined
      readonly explanation?: string | undefined
    }

type ActiveLessonSession = {
  readonly activity: "idle" | "submitting"
  readonly answerPayloads: Readonly<Record<string, LearnerStepDraftAnswer>>
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
      readonly completion: CompleteLearnerLessonResult | null
      readonly currentStepIndex: number
      readonly status: "complete"
    }

export type LessonSessionEvent =
  | { readonly type: "START_REQUESTED" }
  | {
      readonly answerPayloads: Readonly<Record<string, LearnerStepDraftAnswer>>
      readonly completedStepIds: readonly string[]
      readonly originalStepIds: readonly string[]
      readonly type: "START_SUCCEEDED"
    }
  | { readonly message: string | null; readonly type: "START_FAILED" }
  | {
      readonly payload: LearnerStepDraftAnswer
      readonly stepId: string
      readonly type: "ANSWER_PAYLOAD_CHANGED"
    }
  | {
      readonly payload: LearnerStepDraftAnswer | null
      readonly stepId: string
      readonly type: "DRAFT_RECONCILED"
    }
  | {
      readonly evaluation?: StepEvaluation | null | undefined
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
      readonly completion: CompleteLearnerLessonResult
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

export function remainingLessonStepIds(
  originalStepIds: readonly string[],
  completedStepIds: readonly string[]
): readonly string[] {
  const completed = new Set(completedStepIds)
  return originalStepIds.filter((stepId) => !completed.has(stepId))
}

export function lessonProgressPercent(
  completedCount: number,
  totalOriginalSteps: number
): number {
  return totalOriginalSteps > 0
    ? Math.round((completedCount / totalOriginalSteps) * 100)
    : 0
}

export function createLessonSessionState(
  hasStarted: boolean,
  isComplete: boolean,
  initialDrafts: Readonly<Record<string, LearnerStepDraftAnswer>>,
  originalStepIds: readonly string[],
  completedStepIds: readonly string[] = []
): LessonSessionState {
  if (isComplete) {
    return {
      completion: null,
      currentStepIndex: Math.max(0, originalStepIds.length - 1),
      status: "complete",
    }
  }

  if (!hasStarted) {
    return {
      startError: null,
      status: "not-started",
    }
  }

  return createActiveLessonSession(
    initialDrafts,
    completedStepIds,
    originalStepIds
  )
}

export function transitionLessonSession(
  state: LessonSessionState,
  event: LessonSessionEvent
): LessonSessionState {
  if (event.type === "START_REQUESTED") {
    if (state.status === "starting") {
      return state
    }
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

    return createActiveLessonSession(
      event.answerPayloads,
      event.completedStepIds,
      event.originalStepIds
    )
  }

  if (state.status !== "active") {
    throw new LessonSessionTransitionError(state, event)
  }

  if (state.activity === "submitting") {
    if (
      event.type === "ANSWER_PAYLOAD_CHANGED" ||
      event.type === "DRAFT_RECONCILED" ||
      event.type === "STEP_EVALUATED" ||
      event.type === "CONTINUE_REQUESTED" ||
      event.type === "COMPLETE_LESSON_REQUESTED"
    ) {
      return state
    }
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
    if (state.checked !== false) {
      return state
    }

    const totalAttempts = state.totalAttempts + 1
    if (event.isCorrect) {
      const completedStepIds = state.completedStepIds.includes(event.stepId)
        ? state.completedStepIds
        : [...state.completedStepIds, event.stepId]
      const progressPercent = lessonProgressPercent(
        completedStepIds.length,
        event.totalOriginalSteps
      )

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
      const answerPayloads = { ...state.answerPayloads }
      if (
        nextStepId !== undefined &&
        isRequeuedStepCopy(state.stepQueue, nextQueueIndex)
      ) {
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

function createActiveLessonSession(
  answerPayloads: Readonly<Record<string, LearnerStepDraftAnswer>>,
  completedStepIds: readonly string[],
  originalStepIds: readonly string[]
): ActiveLessonSession & { readonly status: "active" } {
  return {
    activity: "idle",
    answerPayloads,
    checked: false,
    completedStepIds,
    currentQueueIndex: 0,
    mistakeCount: 0,
    progressPercent: lessonProgressPercent(
      completedStepIds.length,
      originalStepIds.length
    ),
    status: "active",
    stepQueue: remainingLessonStepIds(originalStepIds, completedStepIds),
    submitError: null,
    totalAttempts: 0,
  }
}

function isRequeuedStepCopy(
  stepQueue: readonly string[],
  nextQueueIndex: number
): boolean {
  const nextStepId = stepQueue[nextQueueIndex]
  if (nextStepId === undefined) return false
  return stepQueue.slice(0, nextQueueIndex).includes(nextStepId)
}
