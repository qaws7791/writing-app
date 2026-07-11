"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  createLessonStartedAnswer,
  getFirstLessonStep,
  getLessonStep,
  isLastLessonStep,
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonAnswerChange,
  type LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import {
  getLessonStepCheckedResult,
  isLessonStepCheckable,
  isLessonStepCheckedCorrect,
  isLessonStepSubmittable,
  type LessonStepCheckedState,
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

type LessonCheckedState = false | LessonStepCheckedState

type LessonAnswerPayloadChange = {
  readonly payload: LessonStepAnswerPayload
  readonly stepId: string
}

type AnswerSaveState =
  | {
      readonly status: "idle"
    }
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
  const [answerPayloads, setAnswerPayloads] = useState<
    Readonly<Record<string, LessonStepAnswerPayload>>
  >({})
  const [answerSaveState, setAnswerSaveState] = useState<AnswerSaveState>({
    status: "idle",
  })
  const [checked, setChecked] = useState<LessonCheckedState>(false)
  const [completeError, setCompleteError] = useState<null | string>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex)
  const [hasStarted, setHasStarted] = useState(initialProgress !== undefined)
  const [isComplete, setIsComplete] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isSavingProgress, setIsSavingProgress] = useState(false)
  const [isSavingStart, setIsSavingStart] = useState(false)
  const [startError, setStartError] = useState<null | string>(null)
  const answerRequestIdRef = useRef(0)
  const aiFeedbackRequestRef = useRef<{
    readonly answer: string
    readonly idempotencyKey: string
    readonly stepId: string
  } | null>(null)
  const completeInFlightRef = useRef(false)
  const isMountedRef = useRef(false)
  const latestAnswerSaveRef = useRef<LatestAnswerSave | null>(null)
  const startInFlightRef = useRef(false)
  const pendingAnswerRef = useRef<{
    readonly answer: LessonAnswerChange["answer"]
    readonly stepId: string
  } | null>(null)
  const progressInFlightRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const currentStep = getLessonStep(lesson, currentStepIndex)
  const currentAnswerPayload =
    currentStep === null ? undefined : answerPayloads[currentStep.id]
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
    currentStep !== null &&
    answerSaveState.status === "error" &&
    answerSaveState.stepId === currentStep.id
      ? answerSaveState.message
      : null
  const canStart = getFirstLessonStep(lesson) !== null

  const startLesson = useCallback(async (): Promise<void> => {
    if (startInFlightRef.current) {
      return
    }

    const firstStep = getFirstLessonStep(lesson)

    if (firstStep === null) {
      setStartError("시작할 학습 스텝이 없습니다.")
      return
    }

    startInFlightRef.current = true
    setIsSavingStart(true)
    setStartError(null)

    const result = await api.saveLessonAnswer({
      answer: createLessonStartedAnswer(),
      lessonId: lesson.id,
      stepId: firstStep.id,
    })

    if (!isMountedRef.current) {
      return
    }

    if (result.status === "error") {
      startInFlightRef.current = false
      setIsSavingStart(false)
      setStartError(LESSON_START_ERROR)
      return
    }

    const progressResult = await api.saveLessonProgress({
      currentStepIndex: 0,
      lessonId: lesson.id,
    })

    if (!isMountedRef.current) {
      return
    }

    startInFlightRef.current = false
    setIsSavingStart(false)

    if (progressResult.status === "error") {
      setStartError(LESSON_START_ERROR)
      return
    }

    setCurrentStepIndex(0)
    setChecked(false)
    setHasStarted(true)
  }, [api, lesson])

  const persistAnswerToServer = useCallback(
    async (
      stepId: string,
      answer: LessonAnswerChange["answer"]
    ): Promise<boolean> => {
      const requestId = answerRequestIdRef.current + 1
      answerRequestIdRef.current = requestId
      setAnswerSaveState({
        requestId,
        status: "pending",
        stepId,
      })

      const latestSave: LatestAnswerSave = {
        promise: Promise.resolve({
          requestId,
          status: "ok",
          stepId,
        }),
        requestId,
        status: "pending",
        stepId,
      }
      latestSave.promise = saveLessonAnswer({
        answer,
        api,
        lessonId: lesson.id,
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

      setAnswerSaveState(
        outcome.status === "error"
          ? {
              message: LESSON_ANSWER_ERROR,
              requestId,
              status: "error",
              stepId,
            }
          : {
              requestId,
              status: "ok",
              stepId,
            }
      )

      return outcome.status === "ok"
    },
    [api, lesson.id]
  )

  const saveAnswer = useCallback(
    async ({ answer, stepId }: LessonAnswerChange): Promise<void> => {
      pendingAnswerRef.current = { answer, stepId }
    },
    []
  )

  const setAnswerPayload = useCallback(
    ({ payload, stepId }: LessonAnswerPayloadChange): void => {
      setAnswerPayloads((previous) => ({
        ...previous,
        [stepId]: payload,
      }))
    },
    []
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
      const result = await api.createAiFeedback({
        answer,
        idempotencyKey,
        lessonId: lesson.id,
        stepId,
      })

      if (result.status === "error") {
        if (result.error.code !== "network-error") {
          aiFeedbackRequestRef.current = null
        }
        return {
          message: result.error.message,
          status: "error",
        }
      }

      aiFeedbackRequestRef.current = null

      const saved = await persistAnswerToServer(stepId, {
        requested: true,
        type: "AI_FEEDBACK",
      })

      if (!saved) {
        return {
          message: LESSON_ANSWER_ERROR,
          status: "error",
        }
      }

      return {
        feedback: result.value,
        status: "ok",
      }
    },
    [api, lesson.id, persistAnswerToServer]
  )

  async function submitCurrentStep(): Promise<void> {
    const step = getLessonStep(lesson, currentStepIndex)

    if (step === null) {
      return
    }

    const answerPayload = answerPayloads[step.id]

    if (checked === false && isLessonStepCheckable(step)) {
      setChecked(getLessonStepCheckedResult(step, answerPayload))

      if (
        pendingAnswerRef.current &&
        pendingAnswerRef.current.stepId === step.id
      ) {
        void persistAnswerToServer(step.id, pendingAnswerRef.current.answer)
        pendingAnswerRef.current = null
      }
      return
    }

    if (checked !== false && !isLessonStepCheckedCorrect(checked)) {
      setChecked(false)
      return
    }

    setChecked(false)

    if (
      pendingAnswerRef.current &&
      pendingAnswerRef.current.stepId === step.id
    ) {
      void persistAnswerToServer(step.id, pendingAnswerRef.current.answer)
      pendingAnswerRef.current = null
    }

    if (!isLastLessonStep(lesson, currentStepIndex)) {
      const canAdvance = await waitForLatestAnswerSave(step.id)

      if (!canAdvance) {
        return
      }

      if (progressInFlightRef.current) {
        return
      }

      const nextStepIndex = Math.min(
        lesson.steps.length - 1,
        currentStepIndex + 1
      )
      progressInFlightRef.current = true
      setCompleteError(null)
      setIsSavingProgress(true)
      const progressResult = await api.saveLessonProgress({
        currentStepIndex: nextStepIndex,
        lessonId: lesson.id,
      })

      if (!isMountedRef.current) {
        return
      }

      progressInFlightRef.current = false
      setIsSavingProgress(false)

      if (progressResult.status === "error") {
        setCompleteError(LESSON_PROGRESS_ERROR)
        return
      }

      setCurrentStepIndex(nextStepIndex)
      return
    }

    await completeCurrentLesson(step.id)
  }

  return {
    answerError,
    canStart,
    checked,
    completeError,
    currentAnswerPayload,
    currentStep,
    currentStepIndex,
    hasStarted,
    isComplete,
    isCompleting,
    isLastStep,
    isQuizStep,
    isReady,
    isSavingStart,
    isSavingProgress,
    progress,
    requestAiFeedback,
    saveAnswer,
    setAnswerPayload,
    startError,
    startLesson,
    submitCurrentStep,
    visibleStepNumber,
  }

  async function completeCurrentLesson(currentStepId: string): Promise<void> {
    if (completeInFlightRef.current) {
      return
    }

    completeInFlightRef.current = true
    setCompleteError(null)
    setIsCompleting(true)

    const canComplete = await waitForLatestAnswerSave(currentStepId)

    if (!isMountedRef.current) {
      return
    }

    if (!canComplete) {
      completeInFlightRef.current = false
      setIsCompleting(false)
      return
    }

    const result = await api.completeLesson({ lessonId: lesson.id })

    if (!isMountedRef.current) {
      return
    }

    completeInFlightRef.current = false
    setIsCompleting(false)

    if (result.status === "error") {
      setCompleteError(LESSON_COMPLETE_ERROR)
      return
    }

    setIsComplete(true)
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
        setAnswerSaveState({
          message: LESSON_ANSWER_ERROR,
          requestId: currentLatestSave.requestId,
          status: "error",
          stepId,
        })
        return false
      }

      return true
    }
  }
}

async function saveLessonAnswer({
  answer,
  api,
  lessonId,
  requestId,
  stepId,
}: {
  readonly answer: LessonAnswerChange["answer"]
  readonly api: WritingAppApi
  readonly lessonId: string
  readonly requestId: number
  readonly stepId: string
}): Promise<AnswerSaveOutcome> {
  const result = await api.saveLessonAnswer({
    answer,
    lessonId,
    stepId,
  })

  return {
    requestId,
    status: result.status === "error" ? "error" : "ok",
    stepId,
  }
}

function clampLessonStepIndex(lesson: Lesson, stepIndex: number): number {
  if (lesson.steps.length === 0) {
    return 0
  }

  return Math.min(lesson.steps.length - 1, Math.max(0, stepIndex))
}
