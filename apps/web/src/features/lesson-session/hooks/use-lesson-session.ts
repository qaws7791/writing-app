"use client"

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react"
import { evaluateStepSubmission } from "@workspace/contracts/learning/step-grading"
import { learnerStepSubmissionSchema } from "@workspace/contracts/learning/learner-transition"
import type { LessonStepId } from "@workspace/contracts/content/ids"
import type {
  Lesson,
  LessonStep,
  LessonStepDraft,
  LessonStepDraftAnswer,
} from "@/features/lesson-session/model/lesson-view-model"
import {
  getLessonStep,
  type LessonStepAnswerPayload,
} from "@/features/lesson-session/model/lesson-logic"
import { useLessonDraftSync } from "@/features/lesson-session/hooks/use-lesson-draft-sync"
import { createLessonSessionEffects } from "@/features/lesson-session/api/lesson-session-effect-adapter"
import {
  createLessonSessionState,
  transitionLessonSession,
  type LessonSessionState,
} from "@/features/lesson-session/model/lesson-session-machine"
import {
  getLessonStepSubmissionMode,
  isLessonStepSubmittable,
} from "@/features/lesson-session/model/lesson-step-policy"
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
  const sessionStartTimeRef = useRef<number | null>(null)

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

  useEffect(() => {
    if (isActive && sessionStartTimeRef.current === null) {
      sessionStartTimeRef.current = Date.now()
    }
  }, [isActive])

  const currentStepId = isActive
    ? sessionState.stepQueue[sessionState.currentQueueIndex]
    : undefined
  const currentStep =
    (currentStepId !== undefined
      ? lesson.steps.find((s) => s.id === currentStepId)
      : null) ??
    (sessionState.status === "complete"
      ? getLessonStep(lesson, sessionState.currentStepIndex)
      : null)

  const currentStepIndex =
    currentStep !== null
      ? lesson.steps.findIndex((s) => s.id === currentStep.id)
      : 0

  const currentAnswerPayload =
    isActive && currentStep !== null
      ? sessionState.answerPayloads[currentStep.id]
      : undefined

  const checked = isActive ? sessionState.checked : false
  const isReady =
    currentStep !== null &&
    (checked !== false ||
      isLessonStepSubmittable(currentStep, currentAnswerPayload))

  const visibleStepNumber = isActive
    ? Math.min(sessionState.completedStepIds.length + 1, lesson.steps.length)
    : 1

  const progress =
    sessionState.status === "complete"
      ? 100
      : isActive
        ? lesson.steps.length > 0
          ? Math.round(
              (sessionState.completedStepIds.length / lesson.steps.length) * 100
            )
          : 0
        : 0

  const startLesson = useCallback(async (): Promise<void> => {
    if (sessionStateRef.current.status !== "not-started") return

    sessionStartTimeRef.current = Date.now()
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
      initialStepIds: lesson.steps.map((s) => s.id),
      progressPercent: result.learning.progressPercent,
      type: "START_SUCCEEDED",
    })
  }, [applyServerDrafts, effects, lesson.steps, send])

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

      const state = sessionStateRef.current
      if (
        state.status === "active" &&
        state.activity === "idle" &&
        state.checked === false &&
        currentStep !== null &&
        currentStep.id === stepId &&
        getLessonStepSubmissionMode(currentStep) === "instant"
      ) {
        const submission = learnerStepSubmissionSchema.safeParse(payload)
        if (submission.success) {
          const evaluation = evaluateStepSubmission(
            currentStep,
            submission.data
          )
          send({
            evaluation: evaluation ?? null,
            explanation: evaluation?.explanation,
            isCorrect: evaluation?.correct ?? true,
            stepId: currentStep.id,
            totalOriginalSteps: lesson.steps.length,
            type: "STEP_EVALUATED",
          })
        }
      }
    },
    [currentStep, lesson.steps.length, send, stageDraft]
  )

  function submitCurrentStep(): void {
    const state = sessionStateRef.current
    if (state.status !== "active" || state.activity !== "idle") return
    const step = currentStep
    if (step === null || state.checked !== false) return

    if (step.type === "READING" || step.type === "COMPARE") {
      send({
        evaluation: null,
        isCorrect: true,
        stepId: step.id,
        totalOriginalSteps: lesson.steps.length,
        type: "STEP_EVALUATED",
      })
      return
    }

    const submission = learnerStepSubmissionSchema.safeParse(
      state.answerPayloads[step.id]
    )
    if (!submission.success) return

    const evaluation = evaluateStepSubmission(step, submission.data)
    send({
      evaluation: evaluation ?? null,
      explanation: evaluation?.explanation,
      isCorrect: evaluation?.correct ?? true,
      stepId: step.id,
      totalOriginalSteps: lesson.steps.length,
      type: "STEP_EVALUATED",
    })
  }

  async function continueLessonStep(): Promise<void> {
    const state = sessionStateRef.current
    if (state.status !== "active" || state.activity !== "idle") return

    // If there are more steps in queue, advance to the next step
    if (state.currentQueueIndex + 1 < state.stepQueue.length) {
      if (currentStep !== null) {
        discardSubmittedDraft(currentStep.id)
      }
      send({ type: "CONTINUE_REQUESTED" })
      return
    }

    // All steps in queue completed! Complete the entire lesson session atomically
    if (currentStep !== null) {
      discardSubmittedDraft(currentStep.id)
    }
    await flushAll()

    send({ type: "COMPLETE_LESSON_REQUESTED" })
    const durationSeconds = calculateDurationSeconds(
      sessionStartTimeRef.current
    )

    const result = await effects.completeLesson({
      request: {
        completedStepIds: [...state.completedStepIds] as LessonStepId[],
        durationSeconds,
        expectedCurriculumVersionId: lesson.version.curriculumVersionId,
        mistakeCount: state.mistakeCount,
        totalAttempts: state.totalAttempts,
      },
    })

    if (!isMountedRef.current) return

    if (result.status === "error") {
      send({
        message: result.message || LESSON_STEP_ERROR,
        type: "COMPLETE_LESSON_FAILED",
      })
      return
    }

    send({
      completion: result.completion,
      type: "COMPLETE_LESSON_SUCCEEDED",
    })
  }

  return {
    answerError: null,
    checked,
    completeError: isActive ? sessionState.submitError : null,
    completion:
      sessionState.status === "complete" ? sessionState.completion : null,
    continueLessonStep,
    currentAnswerPayload,
    currentStep,
    currentStepIndex,
    flushCurrentDraft: () =>
      currentStep === null ? Promise.resolve() : flushStepDraft(currentStep.id),
    hasStarted: isActive || sessionState.status === "complete",
    isComplete: sessionState.status === "complete",
    isQuizStep: currentStep !== null && isEvaluatedChoiceStep(currentStep),
    isReady,
    isSavingStart: sessionState.status === "starting",
    isSubmitting: isActive && sessionState.activity === "submitting",
    prepareToLeave: flushAll,
    progress,
    renderRevision:
      currentStep === null ? 0 : (renderRevisionByStepId[currentStep.id] ?? 0),
    saveAnswer,
    startError:
      sessionState.status === "not-started" ? sessionState.startError : null,
    startLesson,
    submitCurrentStep,
    visibleStepNumber,
  }
}

function resolveInitialSessionState(lesson: Lesson): LessonSessionState {
  const stepIds = lesson.steps.map((s) => s.id)
  switch (lesson.learning.status) {
    case "not_started":
      return createLessonSessionState(0, false, false, {}, 0, stepIds)
    case "in_progress":
      return createLessonSessionState(
        lesson.learning.currentStepIndex,
        true,
        false,
        toDraftAnswerPayloads(lesson.drafts),
        lesson.learning.progressPercent,
        stepIds
      )
    case "completed":
      return createLessonSessionState(
        lesson.steps.length - 1,
        true,
        true,
        {},
        100,
        stepIds
      )
    case "locked":
      return createLessonSessionState(0, false, false, {}, 0, stepIds)
  }
}

function toDraftAnswerPayloads(
  drafts: readonly LessonStepDraft[]
): Readonly<Record<string, LessonStepDraftAnswer>> {
  return Object.fromEntries(drafts.map((draft) => [draft.stepId, draft.answer]))
}

function isEvaluatedChoiceStep(step: LessonStep): boolean {
  return (
    step.type === "CATEGORIZE" ||
    step.type === "ERROR_CORRECT" ||
    step.type === "FILL_BLANK" ||
    step.type === "MATCH" ||
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "ORDER" ||
    step.type === "SELECT" ||
    step.type === "SENTENCE_BUILD" ||
    step.type === "TRUE_FALSE"
  )
}

function calculateDurationSeconds(startTime: number | null): number {
  if (startTime === null) return 1
  return Math.max(1, Math.round((Date.now() - startTime) / 1000))
}
