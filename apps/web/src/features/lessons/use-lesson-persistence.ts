"use client"

import * as React from "react"

import type {
  LessonId,
  LessonStep,
  LessonStepId,
} from "@/features/lessons/lesson-types"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

type LessonPersistenceApi = Pick<
  WritingAppApi,
  "completeLesson" | "saveLessonAnswer" | "saveLessonProgress"
>

type WrittenStepResponses = Partial<Record<LessonStepId, string>>

export function useLessonPersistence({
  api,
  lessonId,
}: {
  api: LessonPersistenceApi
  lessonId: LessonId
}) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [writtenResponses, setWrittenResponses] =
    React.useState<WrittenStepResponses>({})

  const runBestEffort = React.useCallback(
    async (
      save: () => Promise<{
        status: "error" | "ok"
        error?: { message: string }
      }>
    ) => {
      try {
        const result = await save()

        if (result.status === "error") {
          setErrorMessage(
            result.error?.message ?? "학습 기록 저장에 실패했습니다."
          )
          return
        }

        setErrorMessage(null)
      } catch {
        setErrorMessage("학습 기록 저장에 실패했습니다.")
      }
    },
    []
  )

  const saveLessonProgress = React.useCallback(
    (step: LessonStep) => {
      void runBestEffort(() =>
        api.saveLessonProgress(lessonId, {
          currentStepId: step.id,
          stepOrder: step.order,
        })
      )
    },
    [api, lessonId, runBestEffort]
  )

  const completeLesson = React.useCallback(() => {
    void runBestEffort(() => api.completeLesson(lessonId))
  }, [api, lessonId, runBestEffort])

  const saveWrittenResponse = React.useCallback(
    (stepId: LessonStepId, text: string) => {
      setWrittenResponses((current) => ({
        ...current,
        [stepId]: text,
      }))
      void runBestEffort(() =>
        api.saveLessonAnswer(lessonId, {
          stepId,
          answer: text,
        })
      )
    },
    [api, lessonId, runBestEffort]
  )

  const resetWrittenResponses = React.useCallback(() => {
    setWrittenResponses({})
    setErrorMessage(null)
  }, [])

  return {
    errorMessage,
    completeLesson,
    resetWrittenResponses,
    saveLessonProgress,
    saveWrittenResponse,
    writtenResponses,
  }
}
