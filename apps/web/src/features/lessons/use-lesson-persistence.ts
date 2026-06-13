"use client"

import { useCallback, useState } from "react"

import {
  createLessonStartedAnswer,
  getFirstLessonStep,
} from "@/features/lessons/lesson-logic"
import type { Lesson } from "@/features/lessons/lesson-types"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

const LESSON_START_ERROR =
  "레슨 시작을 저장하지 못했습니다. 다시 시도해 주세요."

type UseLessonPersistenceInput = {
  readonly api: WritingAppApi
  readonly lesson: Lesson
}

export function useLessonPersistence({
  api,
  lesson,
}: UseLessonPersistenceInput) {
  const [isSavingStart, setIsSavingStart] = useState(false)
  const [startError, setStartError] = useState<null | string>(null)

  const startLesson = useCallback(async (): Promise<boolean> => {
    const firstStep = getFirstLessonStep(lesson)

    if (firstStep === null) {
      setStartError("시작할 학습 스텝이 없습니다.")
      return false
    }

    setIsSavingStart(true)
    setStartError(null)

    const result = await api.saveLessonAnswer({
      answer: createLessonStartedAnswer(),
      lessonId: lesson.id,
      stepId: firstStep.id,
    })

    setIsSavingStart(false)

    if (result.status === "error") {
      setStartError(LESSON_START_ERROR)
      return false
    }

    return true
  }, [api, lesson])

  return {
    isSavingStart,
    startError,
    startLesson,
  }
}
