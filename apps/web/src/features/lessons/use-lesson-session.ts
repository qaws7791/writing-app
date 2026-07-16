"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  getFirstLessonStep,
  getLessonStep,
  isLastLessonStep,
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonAnswerChange,
  type LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import { createLessonSessionEffects } from "@/features/lessons/lesson-session-effect-adapter"
import {
  createLessonSessionState,
  transitionLessonSession,
  type LessonSessionEvent,
  type LessonSessionState,
} from "@/features/lessons/lesson-session-machine"
import { isLessonStepSubmittable } from "@/features/lessons/lesson-step-policy"
import type {
  LearnerLesson as Lesson,
  LearnerLessonStep as LessonStep,
} from "@workspace/contracts/learning"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"

const LESSON_START_ERROR =
  "레슨 시작을 저장하지 못했습니다. 다시 시도해 주세요."
const LESSON_STEP_ERROR =
  "학습 단계를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요."

export function useLessonSession({
  api,
  lesson,
}: {
  readonly api: WritingAppApi
  readonly lesson: Lesson
}) {
  const initialState = resolveInitialSessionState(lesson)
  const effects = useMemo(
    () =>
      createLessonSessionEffects(api, {
        expectedCurriculumVersionId: lesson.version.curriculumVersionId,
        lessonId: lesson.id,
      }),
    [api, lesson.id, lesson.version.curriculumVersionId]
  )
  const [sessionState, setSessionState] =
    useState<LessonSessionState>(initialState)
  const sessionStateRef = useRef(sessionState)
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

  const send = useCallback((event: LessonSessionEvent): void => {
    const nextState = transitionLessonSession(sessionStateRef.current, event)
    sessionStateRef.current = nextState
    setSessionState(nextState)
  }, [])

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
  const progress = (visibleStepNumber / lesson.steps.length) * 100

  const startLesson = useCallback(async (): Promise<void> => {
    if (sessionStateRef.current.status !== "not-started") return
    if (getFirstLessonStep(lesson) === null) {
      send({ type: "START_REQUESTED" })
      send({ message: "시작할 학습 스텝이 없습니다.", type: "START_FAILED" })
      return
    }

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

    send({
      currentStepIndex: result.learning.currentStepIndex,
      type: "START_SUCCEEDED",
    })
  }, [effects, lesson, send])

  const saveAnswer = useCallback(
    async ({ answer, stepId }: LessonAnswerChange): Promise<void> => {
      send({ payload: answer, stepId, type: "ANSWER_PAYLOAD_CHANGED" })
    },
    [send]
  )

  const setAnswerPayload = useCallback(
    ({
      payload,
      stepId,
    }: {
      readonly payload: LessonStepAnswerPayload
      readonly stepId: string
    }) => {
      send({ payload, stepId, type: "ANSWER_PAYLOAD_CHANGED" })
    },
    [send]
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
        if (!result.retryable) aiFeedbackRequestRef.current = null
        return { message: result.message, status: "error" }
      }

      if (result.transition.status === "retry") {
        aiFeedbackRequestRef.current = null
        return { message: LESSON_STEP_ERROR, status: "error" }
      }

      aiFeedbackRequestRef.current = null
      send({ transition: result.transition, type: "STEP_ACCEPTED" })
      return { feedback: result.feedback, status: "ok" }
    },
    [effects, send]
  )

  async function submitCurrentStep(): Promise<void> {
    const state = sessionStateRef.current
    if (state.status !== "active" || state.activity !== "idle") return

    if (state.pendingTransition !== null) {
      send({ type: "ACCEPTED_CONTINUE_REQUESTED" })
      return
    }

    if (state.checked !== false) {
      send({ type: "RETRY_EDIT_REQUESTED" })
      return
    }

    const step = getLessonStep(lesson, state.currentStepIndex)
    if (step === null || step.type === "AI_FEEDBACK") return

    const request = createCompleteStepRequest(
      step,
      state.answerPayloads[step.id]
    )
    if (request === null) return

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

    send({ transition: result.transition, type: "STEP_ACCEPTED" })
    if (result.transition.evaluation === null) {
      send({ type: "ACCEPTED_CONTINUE_REQUESTED" })
    }
  }

  return {
    answerError: null,
    canStart: getFirstLessonStep(lesson) !== null,
    checked,
    completeError: isActive ? sessionState.submitError : null,
    completion:
      sessionState.status === "complete" ? sessionState.completion : null,
    currentAnswerPayload,
    currentStep,
    currentStepIndex,
    hasStarted: isActive || sessionState.status === "complete",
    isComplete: sessionState.status === "complete",
    isCompleting:
      isActive &&
      sessionState.activity === "submitting" &&
      isLastLessonStep(lesson, currentStepIndex),
    isLastStep: isLastLessonStep(lesson, currentStepIndex),
    isQuizStep: currentStep !== null && isEvaluatedChoiceStep(currentStep),
    isReady,
    isSavingProgress:
      isActive &&
      sessionState.activity === "submitting" &&
      !isLastLessonStep(lesson, currentStepIndex),
    isSavingStart: sessionState.status === "starting",
    progress,
    requestAiFeedback,
    saveAnswer,
    setAnswerPayload,
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
      return createLessonSessionState(lesson.learning.currentStepIndex, true)
    case "completed":
      return createLessonSessionState(lesson.steps.length - 1, true, true)
    case "locked":
      return createLessonSessionState(0, false)
  }
}

function createCompleteStepRequest(
  step: LessonStep,
  answer: LessonStepAnswerPayload | undefined
) {
  if (step.type === "READING" || step.type === "COMPARE") {
    return { kind: "acknowledge" as const }
  }

  if (answer === undefined) return null
  return { answer, kind: "answer" as const }
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
