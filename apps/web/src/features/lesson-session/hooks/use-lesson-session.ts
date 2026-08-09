"use client"

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react"

import {
  getLessonStep,
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonAiFeedbackSkipOutcome,
  type LessonStepAnswerPayload,
} from "@/features/lesson-session/model/lesson-logic"
import { useLessonDraftSync } from "@/features/lesson-session/hooks/use-lesson-draft-sync"
import { createLessonSessionEffects } from "@/features/lesson-session/api/lesson-session-effect-adapter"
import {
  createLessonSessionState,
  transitionLessonSession,
  type LessonSessionState,
} from "@/features/lesson-session/model/lesson-session-machine"
import { isLessonStepSubmittable } from "@/features/lesson-session/model/lesson-step-policy"
import { learnerStepSubmissionSchema } from "@workspace/contracts/learning/learner-transition"
import type {
  Lesson,
  LessonCompleteStepBody,
  LessonStep,
  LessonStepDraft,
  LessonStepDraftAnswer,
} from "@/features/lesson-session/model/lesson-view-model"
import { useUnmountAbortSignal } from "@/shared/http/use-unmount-abort-signal"

const LESSON_START_ERROR = "잠시 후 다시 시도해 주세요."
const LESSON_STEP_ERROR =
  "작성한 내용은 그대로 있어요. 잠시 후 다시 시도해 주세요."

export function useLessonSession({ lesson }: { readonly lesson: Lesson }) {
  const initialState = resolveInitialSessionState(lesson)
  const readAbortSignal = useUnmountAbortSignal()
  const effects = useMemo(
    () =>
      createLessonSessionEffects({
        expectedCurriculumVersionId: lesson.version.curriculumVersionId,
        lessonId: lesson.id,
        readAbortSignal,
      }),
    [lesson.id, lesson.version.curriculumVersionId, readAbortSignal]
  )
  const [sessionState, send] = useReducer(transitionLessonSession, initialState)
  const sessionStateRef = useRef(sessionState)
  const applyServerDraft = useCallback(
    (stepId: string, answer: LessonStepDraftAnswer | null) => {
      if (sessionStateRef.current.status !== "active") return
      send({ payload: answer, stepId, type: "DRAFT_RECONCILED" })
    },
    [send]
  )
  const {
    applyServerDrafts,
    discardSubmittedDraft,
    flushAll,
    flushStepDraft,
    renderRevisionByStepId,
    stageDraft,
  } = useLessonDraftSync({
    expectedCurriculumVersionId: lesson.version.curriculumVersionId,
    initialDrafts: lesson.drafts,
    lessonId: lesson.id,
    onServerDraftApplied: applyServerDraft,
  })
  const aiFeedbackRequestRef = useRef<{
    readonly idempotencyKey: string
    readonly stepId: string
  } | null>(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    sessionStateRef.current = sessionState
  }, [sessionState])

  const isActive = sessionState.status === "active"
  const currentStepIndex =
    sessionState.status === "active" || sessionState.status === "complete"
      ? sessionState.currentStepIndex
      : 0
  const currentStep = getLessonStep(lesson, currentStepIndex)
  const currentAnswerPayload =
    isActive && currentStep !== null
      ? sessionState.answerPayloads[currentStep.id]
      : undefined
  const checked = isActive ? sessionState.checked : false
  const hasPendingTransition =
    isActive && sessionState.pendingTransition !== null
  const isReady =
    currentStep !== null &&
    (hasPendingTransition ||
      isLessonStepSubmittable(currentStep, currentAnswerPayload))
  const visibleStepNumber = currentStepIndex + 1
  const progress =
    sessionState.status === "active"
      ? sessionState.progressPercent
      : sessionState.status === "complete"
        ? 100
        : 0

  const startLesson = useCallback(async (): Promise<void> => {
    if (sessionStateRef.current.status !== "not-started") return

    send({ type: "START_REQUESTED" })
    const result = await effects.start()
    if (!isMountedRef.current) return

    if (result.status === "error") {
      send({
        message: result.message || LESSON_START_ERROR,
        type: "START_FAILED",
      })
      return
    }

    if (result.learning.status !== "in_progress") {
      send({ message: LESSON_START_ERROR, type: "START_FAILED" })
      return
    }

    applyServerDrafts(result.learning.drafts)
    send({
      answerPayloads: toDraftAnswerPayloads(result.learning.drafts),
      currentStepIndex: result.learning.currentStepIndex,
      progressPercent: result.learning.progressPercent,
      type: "START_SUCCEEDED",
    })
  }, [applyServerDrafts, effects, send])

  const saveAnswer = useCallback(
    ({
      payload,
      stepId,
    }: {
      readonly payload: LessonStepAnswerPayload
      readonly stepId: string
    }) => {
      send({ payload, stepId, type: "ANSWER_PAYLOAD_CHANGED" })
      stageDraft(stepId, payload)
    },
    [send, stageDraft]
  )

  const requestAiFeedback = useCallback(
    async ({
      stepId,
    }: LessonAiFeedbackRequest): Promise<LessonAiFeedbackOutcome> => {
      const previousRequest = aiFeedbackRequestRef.current
      const idempotencyKey =
        previousRequest?.stepId === stepId
          ? previousRequest.idempotencyKey
          : crypto.randomUUID()
      aiFeedbackRequestRef.current = { idempotencyKey, stepId }
      const result = await effects.requestAiFeedback({ idempotencyKey, stepId })

      if (result.status === "error") {
        if (!result.reuseIdempotencyKey) {
          aiFeedbackRequestRef.current = null
        }
        return {
          kind: result.kind,
          ...(result.retryAfterSeconds === undefined
            ? {}
            : { retryAfterSeconds: result.retryAfterSeconds }),
          status: "error",
        }
      }

      if (result.transition.status === "retry") {
        aiFeedbackRequestRef.current = null
        return {
          kind: "fatal",
          status: "error",
        }
      }

      aiFeedbackRequestRef.current = null
      send({ transition: result.transition, type: "STEP_ACCEPTED" })
      return { feedback: result.feedback, status: "ok" }
    },
    [effects, send]
  )

  const skipAiFeedback = useCallback(
    async ({
      stepId,
    }: LessonAiFeedbackRequest): Promise<LessonAiFeedbackSkipOutcome> => {
      const state = sessionStateRef.current
      const step =
        state.status === "active"
          ? getLessonStep(lesson, state.currentStepIndex)
          : null
      if (
        state.status !== "active" ||
        state.activity !== "idle" ||
        state.pendingTransition !== null ||
        step?.type !== "AI_FEEDBACK" ||
        step.id !== stepId
      ) {
        return { status: "error" }
      }

      send({ type: "SUBMIT_REQUESTED" })
      const result = await effects.completeStep({
        request: { kind: "skip-ai-feedback" },
        stepId,
      })
      if (!isMountedRef.current) {
        return { status: "error" }
      }
      if (result.status === "error" || result.transition.status === "retry") {
        const message =
          result.status === "error"
            ? result.message || LESSON_STEP_ERROR
            : LESSON_STEP_ERROR
        send({ message, type: "SUBMIT_FAILED" })
        return { status: "error" }
      }

      send({ transition: result.transition, type: "STEP_ACCEPTED" })
      send({ type: "ACCEPTED_CONTINUE_REQUESTED" })
      return { status: "ok" }
    },
    [effects, lesson, send]
  )

  async function submitCurrentStep(): Promise<void> {
    const state = sessionStateRef.current
    if (state.status !== "active" || state.activity !== "idle") return
    const step = getLessonStep(lesson, state.currentStepIndex)
    if (step === null) return

    if (state.pendingTransition !== null) {
      send({ type: "ACCEPTED_CONTINUE_REQUESTED" })
      return
    }

    if (state.checked !== false) {
      send({ stepId: step.id, type: "RETRY_EDIT_REQUESTED" })
      return
    }

    if (step.type === "AI_FEEDBACK") return

    const request = createCompleteStepRequest(
      step,
      state.answerPayloads[step.id]
    )
    if (request === null) return

    await flushStepDraft(step.id)
    send({ type: "SUBMIT_REQUESTED" })
    const result = await effects.completeStep({ request, stepId: step.id })
    if (!isMountedRef.current) return

    if (result.status === "error") {
      send({
        message: result.message || LESSON_STEP_ERROR,
        type: "SUBMIT_FAILED",
      })
      return
    }

    if (result.transition.status === "retry") {
      send({ evaluation: result.transition.evaluation, type: "STEP_RETRY" })
      return
    }

    discardSubmittedDraft(step.id)
    send({ transition: result.transition, type: "STEP_ACCEPTED" })
    if (result.transition.evaluation === null) {
      send({ type: "ACCEPTED_CONTINUE_REQUESTED" })
    }
  }

  return {
    answerError: null,
    aiFeedbackDraftText: getAiFeedbackDraftText(
      currentStep,
      sessionState.status === "active" ? sessionState.answerPayloads : {}
    ),
    checked,
    completeError: isActive ? sessionState.submitError : null,
    completion:
      sessionState.status === "complete" ? sessionState.completion : null,
    currentAnswerPayload,
    currentStep,
    currentStepIndex,
    flushCurrentDraft: () =>
      currentStep === null ? Promise.resolve() : flushStepDraft(currentStep.id),
    hasStarted: isActive || sessionState.status === "complete",
    isComplete: sessionState.status === "complete",
    isSubmitting: isActive && sessionState.activity === "submitting",
    isQuizStep: currentStep !== null && isEvaluatedChoiceStep(currentStep),
    isReady,
    isSavingStart: sessionState.status === "starting",
    progress,
    prepareToLeave: flushAll,
    renderRevision:
      currentStep === null ? 0 : (renderRevisionByStepId[currentStep.id] ?? 0),
    requestAiFeedback,
    saveAnswer,
    skipAiFeedback,
    startError:
      sessionState.status === "not-started" ? sessionState.startError : null,
    startLesson,
    submitCurrentStep,
    visibleStepNumber,
  }
}

function resolveInitialSessionState(lesson: Lesson): LessonSessionState {
  switch (lesson.learning.status) {
    case "not_started":
      return createLessonSessionState(0, false)
    case "in_progress":
      return createLessonSessionState(
        lesson.learning.currentStepIndex,
        true,
        false,
        toDraftAnswerPayloads(lesson.drafts),
        lesson.learning.progressPercent
      )
    case "completed":
      return createLessonSessionState(lesson.steps.length - 1, true, true)
    case "locked":
      return createLessonSessionState(0, false)
  }
}

function createCompleteStepRequest(
  step: LessonStep,
  answer: LessonStepAnswerPayload | undefined
): LessonCompleteStepBody | null {
  if (step.type === "READING" || step.type === "COMPARE") {
    return { kind: "acknowledge" as const }
  }

  const submission = learnerStepSubmissionSchema.safeParse(answer)
  if (!submission.success) return null
  return { answer: submission.data, kind: "answer" as const }
}

function toDraftAnswerPayloads(
  drafts: readonly LessonStepDraft[]
): Readonly<Record<string, LessonStepDraftAnswer>> {
  return Object.fromEntries(drafts.map((draft) => [draft.stepId, draft.answer]))
}

function getAiFeedbackDraftText(
  step: LessonStep | null,
  answerPayloads: Readonly<Record<string, LessonStepDraftAnswer>>
): string {
  if (step?.type !== "AI_FEEDBACK") return ""
  const targetAnswer = answerPayloads[step.target]
  return targetAnswer?.type === "WRITE" ? targetAnswer.text : ""
}

function isEvaluatedChoiceStep(step: LessonStep): boolean {
  return (
    step.type === "CATEGORIZE" ||
    step.type === "FILL_BLANK" ||
    step.type === "MATCH" ||
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "ORDER" ||
    step.type === "SELECT"
  )
}
