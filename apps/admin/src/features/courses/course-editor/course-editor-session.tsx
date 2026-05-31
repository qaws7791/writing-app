"use client"

import * as React from "react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumDetailDto,
  AdminEditorStepType,
} from "@workspace/core/admin"

import {
  getEditorChangeKind,
  summarizeEditorChanges,
} from "@/features/courses/course-editor/editor-change-kind"
import { createCourseEditorSelection } from "@/features/courses/course-editor/editor-selectors"
import {
  addChapter,
  addLesson,
  addStep,
  archiveChapter,
  archiveLesson,
  archiveStep,
  createCourseEditorWorkingCopy,
  moveLesson,
  moveStep,
  updateChapterField,
  updateCourseField,
  updateLessonField,
  updateStepContentField,
  type CourseEditorWorkingCopy,
} from "@/features/courses/course-editor/editor-state"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import { useCourseEditorSaveCommand } from "@/features/courses/course-editor/use-course-editor-save-command"
import { useCourseEditorUrlState } from "@/features/courses/course-editor/use-course-editor-url-state"
import type { AdminApi } from "@/lib/api/admin-api"

type CourseEditorSessionState = {
  isReadOnly: boolean
  isSaving: boolean
  selectedChapter: AdminEditorCurriculumDetailDto["chapters"][number] | null
  selectedLesson:
    | AdminEditorCurriculumDetailDto["chapters"][number]["lessons"][number]
    | null
  selectedLessonId: string | null
  selectedLessonSteps: AdminEditorCurriculumDetailDto["steps"]
  selectedStep: AdminEditorCurriculumDetailDto["steps"][number] | null
  statusMessage: string | null
  urlState: CourseEditorUrlState
  workingCopy: CourseEditorWorkingCopy
}

type CourseEditorCommands = {
  addChapter: () => void
  addLesson: (chapterId: string) => void
  addStep: (lessonId: string, type: AdminEditorStepType) => void
  archiveChapter: (chapterId: string) => void
  archiveLesson: (lessonId: string) => void
  archiveStep: (stepId: string) => void
  dismissStatus: () => void
  moveLesson: (lessonId: string, targetIndex: number) => void
  moveStep: (lessonId: string, stepId: string, targetIndex: number) => void
  openPreview: (lessonId: string) => void
  save: () => Promise<void>
  selectLesson: (lessonId: string) => void
  selectStep: (lessonId: string, stepId: string) => void
  updateChapterField: (chapterId: string, field: "title", value: string) => void
  updateCourseField: (field: "description" | "title", value: string) => void
  updateLessonField: (
    lessonId: string,
    field: "description" | "title",
    value: string
  ) => void
  updateStepContent: (stepId: string, key: string, value: unknown) => void
}

type CourseEditorProviderProps = {
  adminApi: AdminApi
  children: React.ReactNode
  course: AdminCourseDetailDto
  curriculum: AdminEditorCurriculumDetailDto
  isReadOnly?: boolean
  revision: number
  urlState: CourseEditorUrlState
}

const CourseEditorStateContext =
  React.createContext<CourseEditorSessionState | null>(null)
const CourseEditorCommandsContext =
  React.createContext<CourseEditorCommands | null>(null)

export function CourseEditorProvider({
  adminApi,
  children,
  course,
  curriculum,
  isReadOnly = false,
  revision,
  urlState,
}: CourseEditorProviderProps) {
  const [workingCopy, setWorkingCopy] = React.useState(() =>
    createCourseEditorWorkingCopy({ course, revision, curriculum })
  )
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const { localUrlState, replaceEditorUrl } = useCourseEditorUrlState({
    courseId: course.id,
    urlState,
  })

  React.useEffect(() => {
    setWorkingCopy(
      createCourseEditorWorkingCopy({ course, revision, curriculum })
    )
  }, [course, revision, curriculum])

  React.useEffect(() => {
    if (!workingCopy.dirty.hasChanges) {
      return
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [workingCopy.dirty.hasChanges])

  const updateWorkingCopy = React.useCallback(
    (
      updater: (current: CourseEditorWorkingCopy) => CourseEditorWorkingCopy
    ) => {
      setStatusMessage(null)
      setWorkingCopy((current) => updater(current))
    },
    []
  )

  const { isSaving, save } = useCourseEditorSaveCommand({
    adminApi,
    replaceWorkingCopy: setWorkingCopy,
    setStatusMessage,
    workingCopy,
  })

  const commands = React.useMemo<CourseEditorCommands>(
    () => ({
      addChapter() {
        updateWorkingCopy((current) =>
          addChapter(current, {
            id: createDraftId("draft-chapter"),
            title: "새 챕터",
          })
        )
      },
      addLesson(chapterId) {
        updateWorkingCopy((current) =>
          addLesson(current, chapterId, {
            id: createDraftId("draft-course-lesson"),
            lessonId: createDraftId("draft-lesson"),
            title: "새 레슨",
            description: "새 레슨 설명을 입력하세요.",
          })
        )
      },
      addStep(lessonId, type) {
        updateWorkingCopy((current) =>
          addStep(current, {
            id: createDraftId("draft-step"),
            lessonId,
            type,
            title: "새 스텝",
          })
        )
      },
      archiveChapter(chapterId) {
        if (!window.confirm("이 챕터를 보관하시겠습니까?")) {
          return
        }

        updateWorkingCopy((current) => archiveChapter(current, chapterId))
      },
      archiveLesson(lessonId) {
        if (!window.confirm("이 레슨을 보관하시겠습니까?")) {
          return
        }

        updateWorkingCopy((current) => archiveLesson(current, lessonId))
      },
      archiveStep(stepId) {
        if (!window.confirm("이 스텝을 보관하시겠습니까?")) {
          return
        }

        updateWorkingCopy((current) => archiveStep(current, stepId))
      },
      dismissStatus() {
        setStatusMessage(null)
      },
      moveLesson(lessonId, targetIndex) {
        updateWorkingCopy((current) =>
          moveLesson(current, lessonId, targetIndex)
        )
      },
      moveStep(lessonId, stepId, targetIndex) {
        updateWorkingCopy((current) =>
          moveStep(current, lessonId, stepId, targetIndex)
        )
      },
      openPreview(lessonId) {
        replaceEditorUrl({
          lessonId,
          view: "preview",
        })
      },
      save,
      selectLesson(lessonId) {
        replaceEditorUrl({
          lessonId,
          view: "lesson",
        })
      },
      selectStep(lessonId, stepId) {
        replaceEditorUrl({
          lessonId,
          stepId,
          view: "step",
        })
      },
      updateChapterField(chapterId, field, value) {
        updateWorkingCopy((current) =>
          updateChapterField(current, chapterId, field, value)
        )
      },
      updateCourseField(field, value) {
        updateWorkingCopy((current) => updateCourseField(current, field, value))
      },
      updateLessonField(lessonId, field, value) {
        updateWorkingCopy((current) =>
          updateLessonField(current, lessonId, field, value)
        )
      },
      updateStepContent(stepId, key, value) {
        updateWorkingCopy((current) =>
          updateStepContentField(current, stepId, key, value)
        )
      },
    }),
    [replaceEditorUrl, save, updateWorkingCopy]
  )

  const state = React.useMemo<CourseEditorSessionState>(() => {
    const selection = createCourseEditorSelection({
      urlState: localUrlState,
      workingCopy,
    })

    return {
      isReadOnly,
      isSaving,
      ...selection,
      statusMessage,
      urlState: localUrlState,
      workingCopy,
    }
  }, [isReadOnly, isSaving, localUrlState, statusMessage, workingCopy])

  return (
    <CourseEditorStateContext.Provider value={state}>
      <CourseEditorCommandsContext.Provider value={commands}>
        {children}
      </CourseEditorCommandsContext.Provider>
    </CourseEditorStateContext.Provider>
  )
}

export function useCourseEditorState() {
  const context = React.useContext(CourseEditorStateContext)

  if (!context) {
    throw new Error(
      "useCourseEditorState must be used within CourseEditorProvider."
    )
  }

  return context
}

export function useCourseEditorCommands() {
  const context = React.useContext(CourseEditorCommandsContext)

  if (!context) {
    throw new Error(
      "useCourseEditorCommands must be used within CourseEditorProvider."
    )
  }

  return context
}

export function useCourseEditorChangeKind() {
  const { workingCopy } = useCourseEditorState()

  return getEditorChangeKind(summarizeEditorChanges(workingCopy.dirty.changes))
}

function createDraftId(prefix: string) {
  const randomId =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12)

  return `${prefix}-${randomId}`
}
