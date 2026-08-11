"use client"

import { useRouter } from "next/navigation"
import { useEffect, useReducer, useRef, useState, useTransition } from "react"

import { useAdminShellChrome } from "@/app/(admin)/_views/admin-shell-chrome"
import {
  adminCourseEditorSchema,
  type AdminCourseAssets,
  type AdminCourseDetail,
  type AdminCourseEditorCommandResult,
} from "@/features/course-editor/model/admin-course-editor"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import {
  canSave,
  courseEditorReducer,
  createCourseEditorState,
  isUnsaved as isUnsavedState,
} from "@/features/course-editor/model/course-editor-reducer"
import type { UploadAdminContentAsset } from "@/features/course-editor/model/content-asset-upload"
import { shouldConfirmUnsavedNavigation } from "@/features/course-editor/model/unsaved-navigation"
import { withConflictRecovery } from "@/features/course-editor/model/with-conflict-recovery"
import type { ConfirmationIntent } from "@/features/course-editor/ui/confirmation-copy"
import { CourseCurriculumTab } from "@/features/course-editor/ui/course-curriculum-tab"
import { CourseInfoTab } from "@/features/course-editor/ui/course-info-tab"
import { EditorConfirmationDialog } from "@/features/course-editor/ui/editor-confirmation-dialog"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/ui/tabs"

export function CourseEditorShell({
  assetsResult,
  course,
  publishCourse,
  saveCourse,
  uploadAdminContentAsset,
}: {
  readonly assetsResult: AdminRequestResult<AdminCourseAssets>
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
  const editorHeadingRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const unsaved = isUnsavedState(state)
  const courseTitle = state.draft.title || "제목 없음"
  const lessonCount = state.draft.units.reduce(
    (count, unit) => count + unit.lessons.length,
    0
  )
  const coverAsset = state.draft.assets.find(
    (asset) =>
      asset.id === state.draft.coverAssetId && asset.kind === "course-cover"
  )

  useAdminShellChrome({
    breadcrumb: [{ href: "/courses", label: "콘텐츠 관리" }],
    onBreadcrumbNavigate: (href, modifiers) => {
      if (href !== "/courses") return true
      if (!shouldConfirmUnsavedNavigation({ modifiers, unsaved })) {
        return true
      }
      setConfirmationIntent({ type: "navigate-course-list" })
      return false
    },
    title: courseTitle,
  })

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
    <Tabs
      className="-mx-3 -mt-5 min-h-full gap-0 @[40rem]/admin-shell:-mx-5 @[40rem]/admin-shell:-mt-7 @[56rem]/admin-shell:-mx-6 @[56rem]/admin-shell:-mt-8"
      onValueChange={(value) => changeTab(value as "curriculum" | "info")}
      value={tab}
    >
      <div className="border-b border-border px-3 pt-5 @[40rem]/admin-shell:px-5 @[40rem]/admin-shell:pt-7 @[56rem]/admin-shell:px-6 @[56rem]/admin-shell:pt-8">
        <div
          className="mb-5 flex flex-wrap items-center justify-end gap-4"
          ref={editorHeadingRef}
          tabIndex={-1}
        >
          <div className="flex flex-wrap items-center gap-2">
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
        <TabsList className="-mb-px" variant="line">
          <TabsTrigger value="info">강의 정보</TabsTrigger>
          <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
        </TabsList>
      </div>
      <div className="flex-1 px-3 py-5 @[40rem]/admin-shell:px-5 @[40rem]/admin-shell:py-7 @[56rem]/admin-shell:px-6 @[56rem]/admin-shell:py-8">
        {state.message === null ? null : (
          <Alert
            className="mb-5"
            role="status"
            variant={state.status === "saved" ? "default" : "destructive"}
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
        <TabsContent value="info">
          <CourseInfoTab
            assetsResult={assetsResult}
            coverAsset={coverAsset}
            dispatch={dispatch}
            draft={state.draft}
            uploadAdminContentAsset={uploadAdminContentAsset}
          />
        </TabsContent>
        <TabsContent value="curriculum">
          <CourseCurriculumTab
            dispatch={dispatch}
            draft={state.draft}
            lessonCount={lessonCount}
            requestConfirmation={setConfirmationIntent}
            uploadAdminContentAsset={uploadAdminContentAsset}
          />
        </TabsContent>
      </div>
      <EditorConfirmationDialog
        intent={confirmationIntent}
        onConfirm={confirmIntent}
        onDismiss={() => setConfirmationIntent(null)}
      />
    </Tabs>
  )
}
