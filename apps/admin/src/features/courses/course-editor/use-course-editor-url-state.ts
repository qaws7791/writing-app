"use client"

import * as React from "react"

import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"

type UseCourseEditorUrlStateParams = {
  courseId: string
  urlState: CourseEditorUrlState
}

type CourseEditorUrlQuery =
  | {
      lessonId: string
      stepId?: never
      view: "lesson" | "preview"
    }
  | {
      lessonId: string
      stepId: string
      view: "step"
    }

export function useCourseEditorUrlState({
  courseId,
  urlState,
}: UseCourseEditorUrlStateParams) {
  const [localUrlState, setLocalUrlState] = React.useState(urlState)

  React.useEffect(() => {
    setLocalUrlState(urlState)
  }, [urlState])

  const replaceEditorUrl = React.useCallback(
    (query: CourseEditorUrlQuery) => {
      const searchParams = new URLSearchParams()

      searchParams.set("view", query.view)
      searchParams.set("lessonId", query.lessonId)
      if (query.view === "step") {
        searchParams.set("stepId", query.stepId)
      }

      const queryString = searchParams.toString()
      const nextPath =
        queryString.length > 0
          ? `/courses/${courseId}?${queryString}`
          : `/courses/${courseId}`

      setLocalUrlState({
        lessonId: query.lessonId,
        stepId: query.view === "step" ? query.stepId : null,
        view: query.view,
      })
      window.history.replaceState(window.history.state, "", nextPath)
    },
    [courseId]
  )

  return { localUrlState, replaceEditorUrl }
}
