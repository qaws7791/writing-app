import type {
  LearnerCompleteStepResultDto,
  LearnerStepDraftAnswerDto,
  LearnerStepEvaluationDto,
} from "@/shared/http/learner-api-client"

type PendingAcceptedTransition = Exclude<
  LearnerCompleteStepResultDto,
  { readonly status: "retry" }
>

type ActiveLessonSession = {
  readonly activity: "idle" | "submitting"
  readonly answerPayloads: Readonly<Record<string, LearnerStepDraftAnswerDto>>
  readonly checked: false | NonNullable<LearnerStepEvaluationDto>
  readonly currentStepIndex: number
  readonly pendingTransition: PendingAcceptedTransition | null
  readonly progressPercent: number
  readonly submitError: null | string
}

export type LessonSessionState =
  | { readonly startError: null | string; readonly status: "not-started" }
  | { readonly status: "starting" }
  | (ActiveLessonSession & { readonly status: "active" })
  | {
      readonly completion: Extract<
        LearnerCompleteStepResultDto,
        { readonly status: "lesson_completed" }
      > | null
      readonly currentStepIndex: number
      readonly status: "complete"
    }

export type LessonSessionEvent =
  | { readonly type: "START_REQUESTED" }
  | {
      readonly answerPayloads: Readonly<
        Record<string, LearnerStepDraftAnswerDto>
      >
      readonly currentStepIndex: number
      readonly progressPercent: number
      readonly type: "START_SUCCEEDED"
    }
  | { readonly message: string; readonly type: "START_FAILED" }
  | {
      readonly payload: LearnerStepDraftAnswerDto
      readonly stepId: string
      readonly type: "ANSWER_PAYLOAD_CHANGED"
    }
  | {
      readonly payload: LearnerStepDraftAnswerDto | null
      readonly stepId: string
      readonly type: "DRAFT_RECONCILED"
    }
  | { readonly type: "SUBMIT_REQUESTED" }
  | { readonly message: string; readonly type: "SUBMIT_FAILED" }
  | {
      readonly evaluation: NonNullable<LearnerStepEvaluationDto>
      readonly type: "STEP_RETRY"
    }
  | {
      readonly transition: PendingAcceptedTransition
      readonly type: "STEP_ACCEPTED"
    }
  | { readonly stepId: string; readonly type: "RETRY_EDIT_REQUESTED" }
  | { readonly type: "ACCEPTED_CONTINUE_REQUESTED" }

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
  isComplete = false,
  initialAnswerPayloads: Readonly<
    Record<string, LearnerStepDraftAnswerDto>
  > = {},
  initialProgressPercent = 0
): LessonSessionState {
  if (isComplete) {
    return { completion: null, currentStepIndex, status: "complete" }
  }
  return hasStarted
    ? createActiveLessonSession(
        currentStepIndex,
        initialAnswerPayloads,
        initialProgressPercent
      )
    : { startError: null, status: "not-started" }
}

export function transitionLessonSession(
  state: LessonSessionState,
  event: LessonSessionEvent
): LessonSessionState {
  if (state.status === "not-started") {
    if (event.type === "START_REQUESTED") return { status: "starting" }
    throw new LessonSessionTransitionError(state, event)
  }

  if (state.status === "starting") {
    if (event.type === "START_SUCCEEDED") {
      return createActiveLessonSession(
        event.currentStepIndex,
        event.answerPayloads,
        event.progressPercent
      )
    }
    if (event.type === "START_FAILED") {
      return { startError: event.message, status: "not-started" }
    }
    throw new LessonSessionTransitionError(state, event)
  }

  if (state.status === "complete") {
    throw new LessonSessionTransitionError(state, event)
  }

  if (event.type === "ANSWER_PAYLOAD_CHANGED" && state.activity === "idle") {
    return {
      ...state,
      answerPayloads: {
        ...state.answerPayloads,
        [event.stepId]: event.payload,
      },
      checked: false,
      submitError: null,
    }
  }

  if (event.type === "DRAFT_RECONCILED") {
    const answerPayloads =
      event.payload === null
        ? Object.fromEntries(
            Object.entries(state.answerPayloads).filter(
              ([stepId]) => stepId !== event.stepId
            )
          )
        : {
            ...state.answerPayloads,
            [event.stepId]: event.payload,
          }

    return { ...state, answerPayloads }
  }

  if (event.type === "SUBMIT_REQUESTED" && state.activity === "idle") {
    return { ...state, activity: "submitting", submitError: null }
  }

  if (event.type === "SUBMIT_FAILED" && state.activity === "submitting") {
    return { ...state, activity: "idle", submitError: event.message }
  }

  if (event.type === "STEP_RETRY" && state.activity === "submitting") {
    return {
      ...state,
      activity: "idle",
      checked: event.evaluation,
      pendingTransition: null,
    }
  }

  if (event.type === "STEP_ACCEPTED") {
    return {
      ...state,
      activity: "idle",
      checked: event.transition.evaluation ?? false,
      pendingTransition: event.transition,
      progressPercent:
        event.transition.status === "lesson_completed"
          ? 100
          : event.transition.learning.progressPercent,
      submitError: null,
    }
  }

  if (event.type === "RETRY_EDIT_REQUESTED" && state.checked !== false) {
    return {
      ...state,
      answerPayloads: Object.fromEntries(
        Object.entries(state.answerPayloads).filter(
          ([stepId]) => stepId !== event.stepId
        )
      ),
      checked: false,
      submitError: null,
    }
  }

  if (
    event.type === "ACCEPTED_CONTINUE_REQUESTED" &&
    state.pendingTransition !== null
  ) {
    if (state.pendingTransition.status === "lesson_completed") {
      return {
        completion: state.pendingTransition,
        currentStepIndex: state.currentStepIndex,
        status: "complete",
      }
    }

    return createActiveLessonSession(
      state.pendingTransition.learning.currentStepIndex,
      state.answerPayloads,
      state.progressPercent
    )
  }

  throw new LessonSessionTransitionError(state, event)
}

function createActiveLessonSession(
  currentStepIndex: number,
  answerPayloads: Readonly<Record<string, LearnerStepDraftAnswerDto>>,
  progressPercent: number
): Extract<LessonSessionState, { readonly status: "active" }> {
  return {
    activity: "idle",
    answerPayloads,
    checked: false,
    currentStepIndex,
    pendingTransition: null,
    progressPercent,
    status: "active",
    submitError: null,
  }
}
