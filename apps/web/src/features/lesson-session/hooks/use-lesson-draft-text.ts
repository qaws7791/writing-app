"use client"

import { useCallback, useSyncExternalStore } from "react"

import {
  readLessonDraftText,
  subscribeToLessonDraftText,
} from "@/features/lesson-session/api/lesson-draft-storage"

export function useLessonDraftText(learnerId: string, stepId: string): string {
  const subscribe = useCallback(
    (listener: () => void) =>
      subscribeToLessonDraftText(learnerId, stepId, listener),
    [learnerId, stepId]
  )
  const getSnapshot = useCallback(
    () => readLessonDraftText(learnerId, stepId),
    [learnerId, stepId]
  )

  return useSyncExternalStore(subscribe, getSnapshot, readEmptyLessonDraftText)
}

function readEmptyLessonDraftText(): string {
  return ""
}
