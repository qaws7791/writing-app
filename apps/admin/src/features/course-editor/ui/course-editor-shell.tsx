"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useReducer, useRef, useState, useTransition } from "react"

import {
  adminCourseEditorSchema,
  type AdminCourseDetail,
  type AdminCourseEditorCommandResult,
} from "@/features/course-editor/model/admin-course-editor"
import {
  canSave,
  courseEditorReducer,
  createCourseEditorState,
  isUnsaved as isUnsavedState,
} from "@/features/course-editor/model/course-editor-reducer"
import type { UploadAdminContentAsset } from "@/features/course-editor/model/content-asset-upload"
import { withConflictRecovery } from "@/features/course-editor/model/with-conflict-recovery"
import type { ConfirmationIntent } from "@/features/course-editor/ui/confirmation-copy"
import { CourseCurriculumTab } from "@/features/course-editor/ui/course-curriculum-tab"
import { CourseInfoTab } from "@/features/course-editor/ui/course-info-tab"
import { EditorConfirmationDialog } from "@/features/course-editor/ui/editor-confirmation-dialog"
import { ChevronRightIcon } from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"

export function CourseEditorShell({
  course,
  publishCourse,
  saveCourse,
  uploadAdminContentAsset,
}: {
  readonly course: AdminCourseDetail
  readonly publishCourse: (
    course: AdminCourseDetail
  ) => Promise<AdminCourseEditorCommandResult>
  readonly saveCourse: (
    course: AdminCourseDetail
  ) => Promise<AdminCourseEditorCommandResult>
  readonly uploadAdminContentAsset: UploadAdminContentAsset
}) {
  const router = useRouter()
  const [state, dispatch] = useReducer(
    courseEditorReducer,
    course,
    createCourseEditorState
  )
  const [tab, setTab] = useState<"curriculum" | "info">("info")
  const [confirmationIntent, setConfirmationIntent] =
    useState<ConfirmationIntent | null>(null)
  const editorHeadingRef = useRef<HTMLHeadingElement>(null)
  const [isPending, startTransition] = useTransition()
  const unsaved = isUnsavedState(state)
  const lessonCount = state.draft.units.reduce(
    (count, unit) => count + unit.lessons.length,
    0
  )
  const coverAsset = state.draft.assets.find(
    (asset) =>
      asset.id === state.draft.coverAssetId && asset.kind === "course-cover"
  )

  useEffect(() => {
    if (!unsaved) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [unsaved])

  const changeTab = (nextTab: "curriculum" | "info") => {
    if (nextTab === tab) return
    if (unsaved) {
      setConfirmationIntent({ tab: nextTab, type: "change-tab" })
      return
    }
    setTab(nextTab)
  }

  const save = () => {
    const parsed = adminCourseEditorSchema.safeParse(state.draft)
    if (!parsed.success) {
      dispatch({
        message:
          parsed.error.issues[0]?.message ?? "입력 내용을 확인해 주세요.",
        type: "validation-failed",
      })
      return
    }
    dispatch({ type: "save-started" })
    startTransition(async () => {
      await withConflictRecovery({
        dispatch,
        onSuccess: async (document) => {
          dispatch({ document, type: "save-succeeded" })
        },
        operation: () => saveCourse(parsed.data),
      })
    })
  }

  const publish = () => {
    dispatch({ type: "publish-started" })
    startTransition(async () => {
      await withConflictRecovery({
        dispatch,
        onSuccess: async (document) => {
          dispatch({ document, type: "publish-succeeded" })
        },
        operation: () => publishCourse(state.draft),
      })
    })
  }

  const confirmIntent = () => {
    if (confirmationIntent === null) return
    const intent = confirmationIntent
    setConfirmationIntent(null)
    requestAnimationFrame(() => editorHeadingRef.current?.focus())
    switch (intent.type) {
      case "change-tab":
        setTab(intent.tab)
        return
      case "navigate-course-list":
        router.push("/courses")
        return
      case "publish":
        publish()
        return
      case "remove-lesson":
        dispatch({
          lessonId: intent.lessonId,
          type: "lesson-removed",
          unitId: intent.unitId,
        })
        return
      case "remove-unit":
        dispatch({ type: "unit-removed", unitId: intent.unitId })
    }
  }

  return (
    <div className="-mx-5 -mt-8 flex min-h-full flex-col md:-mx-10">
      <div className="border-b border-surface-hover px-6 pb-0 pt-8 md:px-10">
        <nav
          aria-label="코스 편집 경로"
          className="mb-4 flex items-center gap-1.5 text-[0.8125rem]"
        >
          <Link
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="/courses"
            prefetch={false}
            onClick={(event) => {
              if (
                !unsaved ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey
              )
                return
              event.preventDefault()
              setConfirmationIntent({ type: "navigate-course-list" })
            }}
          >
            콘텐츠 관리
          </Link>
          <ChevronRightIcon aria-hidden="true" size={13} />
          <span className="font-medium text-foreground">
            {state.draft.title || "제목 없음"}
          </span>
        </nav>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h1
            ref={editorHeadingRef}
            className="text-[1.375rem] font-bold text-foreground"
            tabIndex={-1}
          >
            {state.draft.title || "제목 없음"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              disabled={isPending || !canSave(state)}
              onClick={save}
              variant="outline"
            >
              {state.status === "saving" ? "저장 중…" : "변경 저장"}
            </Button>
            <Button
              disabled={isPending || unsaved}
              onClick={() => setConfirmationIntent({ type: "publish" })}
            >
              {state.status === "publishing" ? "발행 중…" : "초안 발행"}
            </Button>
          </div>
        </div>
        <div className="-mb-px flex">
          <button
            className={tabClassName(tab === "info")}
            onClick={() => changeTab("info")}
            type="button"
          >
            강의 정보
          </button>
          <button
            className={tabClassName(tab === "curriculum")}
            onClick={() => changeTab("curriculum")}
            type="button"
          >
            커리큘럼
          </button>
        </div>
      </div>
      <div className="flex-1 px-6 py-8 md:px-10">
        {state.message === null ? null : (
          <Alert
            className="mb-5"
            role="status"
            tone={state.status === "saved" ? "success" : "danger"}
          >
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        {state.status === "conflict" ? (
          <div
            className="mb-5 flex flex-wrap gap-2"
            role="group"
            aria-label="충돌 해결"
          >
            <Button
              onClick={() => dispatch({ type: "latest-selected" })}
              variant="outline"
            >
              최신본으로 교체
            </Button>
            <Button
              onClick={() => dispatch({ type: "local-rebased" })}
              variant="outline"
            >
              로컬 초안 유지
            </Button>
          </div>
        ) : null}
        {tab === "info" ? (
          <CourseInfoTab
            coverAsset={coverAsset}
            dispatch={dispatch}
            draft={state.draft}
            uploadAdminContentAsset={uploadAdminContentAsset}
          />
        ) : (
          <CourseCurriculumTab
            dispatch={dispatch}
            draft={state.draft}
            lessonCount={lessonCount}
            requestConfirmation={setConfirmationIntent}
            uploadAdminContentAsset={uploadAdminContentAsset}
          />
        )}
      </div>
      <EditorConfirmationDialog
        intent={confirmationIntent}
        onConfirm={confirmIntent}
        onDismiss={() => setConfirmationIntent(null)}
      />
    </div>
  )
}

function tabClassName(active: boolean): string {
  return cn(
    "border-b-2 px-5 py-3 text-[0.9375rem] font-bold transition-colors",
    active
      ? "border-foreground text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground"
  )
}
