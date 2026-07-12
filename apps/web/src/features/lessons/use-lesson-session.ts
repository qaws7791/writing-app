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
import {
  createLessonSessionEffects,
  type LessonSessionEffects,
} from "@/features/lessons/lesson-session-effect-adapter"
import {
  createLessonSessionState,
  transitionLessonSession,
  type LessonSessionEvent,
  type LessonSessionState,
} from "@/features/lessons/lesson-session-machine"
import {
  getLessonStepCheckedResult,
  isLessonStepCheckable,
  isLessonStepCheckedCorrect,
  isLessonStepSubmittable,
} from "@/features/lessons/lesson-step-policy"
import type { Lesson } from "@/features/lessons/lesson-types"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"

const LESSON_START_ERROR =
  "레슨 시작을 저장하지 못했습니다. 다시 시도해 주세요."
const LESSON_ANSWER_ERROR =
  "답변을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요."
const LESSON_COMPLETE_ERROR =
  "레슨 완료를 저장하지 못했습니다. 다시 시도해 주세요."
const LESSON_PROGRESS_ERROR =
  "레슨 진행을 저장하지 못했습니다. 다시 시도해 주세요."

type UseLessonSessionInput = {
  readonly api: WritingAppApi
  readonly initialProgress?: {
    readonly currentStepIndex: number
  }
  readonly lesson: Lesson
}

type LessonAnswerPayloadChange = {
  readonly payload: LessonStepAnswerPayload
  readonly stepId: string
}

type AnswerSaveOutcome = {
  readonly requestId: number
  readonly status: "error" | "ok"
  readonly stepId: string
}

type LatestAnswerSave = {
  promise: Promise<AnswerSaveOutcome>
  requestId: number
  status: "error" | "ok" | "pending"
  stepId: string
}

export function useLessonSession({
  api,
  initialProgress,
  lesson,
}: UseLessonSessionInput) {
  const initialStepIndex = clampLessonStepIndex(
    lesson,
    initialProgress?.currentStepIndex ?? 0
  )
  const effects = useMemo(
    () => createLessonSessionEffects(api, lesson.id),
    [api, lesson.id]
  )
  const [sessionState, setSessionState] = useState<LessonSessionState>(() =>
    createLessonSessionState(initialStepIndex, initialProgress !== undefined)
  )
  const sessionStateRef = useRef(sessionState)
  const answerRequestIdRef = useRef(0)
  const aiFeedbackRequestRef = useRef<{
    readonly answer: string
    readonly idempotencyKey: string
    readonly stepId: string
  } | null>(null)
  const isMountedRef = useRef(false)
  const latestAnswerSaveRef = useRef<LatestAnswerSave | null>(null)
  const pendingAnswerRef = useRef<{
    readonly answer: LessonAnswerChange["answer"]
    readonly stepId: string
  } | null>(null)

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
      : initialStepIndex
  const currentStep = getLessonStep(lesson, currentStepIndex)
  const answerPayloads = isActive ? sessionState.answerPayloads : {}
  const currentAnswerPayload =
    currentStep === null ? undefined : answerPayloads[currentStep.id]
  const checked = isActive ? sessionState.checked : false
  const isLastStep = isLastLessonStep(lesson, currentStepIndex)
  const isQuizStep =
    currentStep === null ? false : isLessonStepCheckable(currentStep)
  const isReady =
    currentStep === null
      ? false
      : isLessonStepSubmittable(currentStep, currentAnswerPayload)
  const visibleStepNumber = Math.min(currentStepIndex + 1, lesson.steps.length)
  const progress = lesson.steps.length
    ? Math.min(
        100,
        Math.max(0, (visibleStepNumber / lesson.steps.length) * 100)
      )
    : 0
  const answerError =
    isActive &&
    currentStep !== null &&
    sessionState.answerSave.status === "error" &&
    sessionState.answerSave.stepId === currentStep.id
      ? sessionState.answerSave.message
      : null

  const startLesson = useCallback(async (): Promise<void> => {
    if (sessionStateRef.current.status !== "not-started") {
      return
    }

    const firstStep = getFirstLessonStep(lesson)

    if (firstStep === null) {
      send({ type: "START_REQUESTED" })
      send({ message: "시작할 학습 스텝이 없습니다.", type: "START_FAILED" })
      return
    }

    send({ type: "START_REQUESTED" })
    const result = await effects.start(firstStep.id)

    if (!isMountedRef.current) {
      return
    }

    if (result.status === "error") {
      send({ message: LESSON_START_ERROR, type: "START_FAILED" })
      return
    }

    send({ currentStepIndex: 0, type: "START_SUCCEEDED" })
  }, [effects, lesson, send])

  const persistAnswerToServer = useCallback(
    async (
      stepId: string,
      answer: LessonAnswerChange["answer"]
    ): Promise<boolean> => {
      const requestId = answerRequestIdRef.current + 1
      answerRequestIdRef.current = requestId
      send({ requestId, stepId, type: "ANSWER_SAVE_REQUESTED" })

      const latestSave: LatestAnswerSave = {
        promise: Promise.resolve({ requestId, status: "ok", stepId }),
        requestId,
        status: "pending",
        stepId,
      }
      latestSave.promise = saveLessonAnswer({
        answer,
        effects,
        requestId,
        stepId,
      })
      latestAnswerSaveRef.current = latestSave

      const outcome = await latestSave.promise
      latestSave.status = outcome.status

      if (
        !isMountedRef.current ||
        latestAnswerSaveRef.current?.requestId !== requestId
      ) {
        return outcome.status === "ok"
      }

      send(
        outcome.status === "error"
          ? {
              message: LESSON_ANSWER_ERROR,
              requestId,
              stepId,
              type: "ANSWER_SAVE_FAILED",
            }
          : { requestId, stepId, type: "ANSWER_SAVE_SUCCEEDED" }
      )

      return outcome.status === "ok"
    },
    [effects, send]
  )

  const saveAnswer = useCallback(
    async ({ answer, stepId }: LessonAnswerChange): Promise<void> => {
      pendingAnswerRef.current = { answer, stepId }
    },
    []
  )

  const setAnswerPayload = useCallback(
    ({ payload, stepId }: LessonAnswerPayloadChange): void => {
      send({ payload, stepId, type: "ANSWER_PAYLOAD_CHANGED" })
    },
    [send]
  )

  const requestAiFeedback = useCallback(
    async ({
      answer,
      stepId,
    }: LessonAiFeedbackRequest): Promise<LessonAiFeedbackOutcome> => {
      const previousRequest = aiFeedbackRequestRef.current
      const idempotencyKey =
        previousRequest?.answer === answer && previousRequest.stepId === stepId
          ? previousRequest.idempotencyKey
          : crypto.randomUUID()
      aiFeedbackRequestRef.current = { answer, idempotencyKey, stepId }
      const result = await effects.requestAiFeedback({
        answer,
        idempotencyKey,
        stepId,
      })

      if (result.status === "error") {
        if (!result.retryable) {
          aiFeedbackRequestRef.current = null
        }
        return { message: result.message, status: "error" }
      }

      aiFeedbackRequestRef.current = null
      const saved = await persistAnswerToServer(stepId, {
        requested: true,
        type: "AI_FEEDBACK",
      })

      return saved
        ? { feedback: result.feedback, status: "ok" }
        : { message: LESSON_ANSWER_ERROR, status: "error" }
    },
    [effects, persistAnswerToServer]
  )

  async function submitCurrentStep(): Promise<void> {
    const currentState = sessionStateRef.current

    if (currentState.status !== "active" || currentState.activity !== "idle") {
      return
    }

    const step = getLessonStep(lesson, currentState.currentStepIndex)

    if (step === null) {
      return
    }

    const answerPayload = currentState.answerPayloads[step.id]

    if (currentState.checked === false && isLessonStepCheckable(step)) {
      send({
        checked: getLessonStepCheckedResult(step, answerPayload),
        type: "CHECKED_CHANGED",
      })
      persistPendingAnswer(step.id)
      return
    }

    if (
      currentState.checked !== false &&
      !isLessonStepCheckedCorrect(currentState.checked)
    ) {
      send({ checked: false, type: "CHECKED_CHANGED" })
      return
    }

    send({ checked: false, type: "CHECKED_CHANGED" })
    persistPendingAnswer(step.id)

    if (!isLastLessonStep(lesson, currentState.currentStepIndex)) {
      send({ type: "PROGRESS_SAVE_REQUESTED" })
      const canAdvance = await waitForLatestAnswerSave(step.id)

      if (!canAdvance || !isMountedRef.current) {
        if (isMountedRef.current) {
          send({ type: "PROGRESS_SAVE_BLOCKED" })
        }
        return
      }

      const nextStepIndex = Math.min(
        lesson.steps.length - 1,
        currentState.currentStepIndex + 1
      )
      const progressResult = await effects.saveProgress(nextStepIndex)

      if (!isMountedRef.current) {
        return
      }

      send(
        progressResult.status === "error"
          ? { message: LESSON_PROGRESS_ERROR, type: "PROGRESS_SAVE_FAILED" }
          : {
              currentStepIndex: nextStepIndex,
              type: "PROGRESS_SAVE_SUCCEEDED",
            }
      )
      return
    }

    await completeCurrentLesson(step.id)
  }

  function persistPendingAnswer(stepId: string): void {
    if (
      pendingAnswerRef.current === null ||
      pendingAnswerRef.current.stepId !== stepId
    ) {
      return
    }

    void persistAnswerToServer(stepId, pendingAnswerRef.current.answer)
    pendingAnswerRef.current = null
  }

  async function completeCurrentLesson(currentStepId: string): Promise<void> {
    send({ type: "COMPLETE_REQUESTED" })
    const canComplete = await waitForLatestAnswerSave(currentStepId)

    if (!isMountedRef.current) {
      return
    }

    if (!canComplete) {
      send({ type: "COMPLETE_BLOCKED" })
      return
    }

    const result = await effects.complete()

    if (!isMountedRef.current) {
      return
    }

    send(
      result.status === "error"
        ? { message: LESSON_COMPLETE_ERROR, type: "COMPLETE_FAILED" }
        : { type: "COMPLETE_SUCCEEDED" }
    )
  }

  async function waitForLatestAnswerSave(stepId: string): Promise<boolean> {
    while (true) {
      const latestSave = latestAnswerSaveRef.current

      if (latestSave === null || latestSave.stepId !== stepId) {
        return true
      }

      if (latestSave.status === "pending") {
        const outcome = await latestSave.promise

        if (!isMountedRef.current) {
          return false
        }

        if (latestAnswerSaveRef.current?.requestId !== outcome.requestId) {
          continue
        }
      }

      const currentLatestSave = latestAnswerSaveRef.current

      if (currentLatestSave === null || currentLatestSave.stepId !== stepId) {
        return true
      }

      if (currentLatestSave.status === "error") {
        send({
          message: LESSON_ANSWER_ERROR,
          requestId: currentLatestSave.requestId,
          stepId,
          type: "ANSWER_SAVE_FAILED",
        })
        return false
      }

      return true
    }
  }

  return {
    answerError,
    canStart: getFirstLessonStep(lesson) !== null,
    checked,
    completeError: isActive ? sessionState.completeError : null,
    currentAnswerPayload,
    currentStep,
    currentStepIndex,
    hasStarted: isActive || sessionState.status === "complete",
    isComplete: sessionState.status === "complete",
    isCompleting: isActive && sessionState.activity === "completing",
    isLastStep,
    isQuizStep,
    isReady,
    isSavingProgress: isActive && sessionState.activity === "saving-progress",
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

async function saveLessonAnswer({
  answer,
  effects,
  requestId,
  stepId,
}: {
  readonly answer: LessonAnswerChange["answer"]
  readonly effects: LessonSessionEffects
  readonly requestId: number
  readonly stepId: string
}): Promise<AnswerSaveOutcome> {
  const result = await effects.saveAnswer({ answer, stepId })

  return {
    requestId,
    status: result.status,
    stepId,
  }
}

function clampLessonStepIndex(lesson: Lesson, stepIndex: number): number {
  if (lesson.steps.length === 0) {
    return 0
  }

  return Math.min(lesson.steps.length - 1, Math.max(0, stepIndex))
}
