"use client"

import Link from "next/link"
import { useEffect, useMemo, useReducer, useState, useTransition } from "react"
import { lessonIdSchema, unitIdSchema } from "@workspace/contracts/content"

import {
  adminCourseEditorSchema,
  type AdminCourseDetail,
} from "@/features/courses/admin-courses-api"
import {
  courseEditorReducer,
  createCourseEditorState,
} from "@/features/courses/course-editor/state/course-editor-reducer"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { cn } from "@workspace/ui/lib/utils"

type EditorTab = "curriculum" | "info"

export function CourseEditorShell({
  course,
  loadLatestCourse,
  saveCourse,
}: {
  readonly course: AdminCourseDetail
  readonly loadLatestCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly saveCourse: (
    course: AdminCourseDetail
  ) => Promise<AdminApiResult<AdminCourseDetail>>
}) {
  const [state, dispatch] = useReducer(
    courseEditorReducer,
    course,
    createCourseEditorState
  )
  const [tab, setTab] = useState<EditorTab>("info")
  const [isPending, startTransition] = useTransition()
  const isUnsaved = [
    "conflict",
    "dirty",
    "server-error",
    "validation-error",
  ].includes(state.status)
  const lessonCount = useMemo(
    () =>
      state.draft.units.reduce((count, unit) => count + unit.lessons.length, 0),
    [state.draft.units]
  )

  useEffect(() => {
    if (!isUnsaved) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [isUnsaved])

  const changeTab = (nextTab: EditorTab) => {
    if (
      nextTab !== tab &&
      isUnsaved &&
      !window.confirm("저장하지 않은 변경이 있습니다. 편집 화면을 이동할까요?")
    ) {
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
      const result = await saveCourse(parsed.data)
      if (result.status === "ok") {
        dispatch({ document: result.value, type: "save-succeeded" })
        return
      }
      if (result.error.code !== "stale-revision") {
        dispatch({ message: result.error.message, type: "server-failed" })
        return
      }

      const latest = await loadLatestCourse(state.draft.id)
      if (latest.status === "error") {
        dispatch({ message: latest.error.message, type: "server-failed" })
        return
      }
      dispatch({ latest: latest.value, type: "conflict-detected" })
    })
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
            onClick={(event) => {
              if (
                isUnsaved &&
                !window.confirm(
                  "저장하지 않은 변경을 버리고 목록으로 이동할까요?"
                )
              ) {
                event.preventDefault()
              }
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
          <h1 className="text-[1.375rem] font-bold text-foreground">
            {state.draft.title || "제목 없음"}
          </h1>
          <Button
            disabled={isPending || state.status === "clean"}
            onClick={save}
          >
            {state.status === "saving" ? "저장 중…" : "변경 저장"}
          </Button>
        </div>
        <div className="-mb-px flex">
          <TabButton
            active={tab === "info"}
            label="강의 정보"
            onClick={() => changeTab("info")}
          />
          <TabButton
            active={tab === "curriculum"}
            label="커리큘럼"
            onClick={() => changeTab("curriculum")}
          />
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
          <div className="max-w-xl">
            <Field>
              <FieldLabel htmlFor="course-editor-title">제목</FieldLabel>
              <Input
                id="course-editor-title"
                onChange={(event) =>
                  dispatch({
                    field: "title",
                    type: "course-changed",
                    value: event.target.value,
                  })
                }
                value={state.draft.title}
              />
            </Field>
            <Field className="mt-4">
              <FieldLabel htmlFor="course-editor-description">설명</FieldLabel>
              <Textarea
                id="course-editor-description"
                onChange={(event) =>
                  dispatch({
                    field: "description",
                    type: "course-changed",
                    value: event.target.value,
                  })
                }
                value={state.draft.description}
              />
            </Field>
            <Field className="mt-4">
              <FieldLabel htmlFor="course-editor-category">카테고리</FieldLabel>
              <Input
                id="course-editor-category"
                onChange={(event) =>
                  dispatch({
                    field: "category",
                    type: "course-changed",
                    value: event.target.value,
                  })
                }
                value={state.draft.category}
              />
            </Field>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-[0.875rem] font-medium text-muted-foreground">
                유닛 {state.draft.units.length}개 · 레슨 {lessonCount}개
              </p>
              <Button
                onClick={() =>
                  dispatch({
                    type: "unit-added",
                    unitId: unitIdSchema.parse(`unit_${crypto.randomUUID()}`),
                  })
                }
                type="button"
              >
                <PlusIcon aria-hidden="true" size={15} /> 유닛 추가
              </Button>
            </div>
            <div className="flex flex-col gap-6">
              {state.draft.units.map((unit, unitIndex) => (
                <section key={unit.id}>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground">
                      UNIT {unitIndex + 1}
                    </span>
                    <div className="h-px flex-1 bg-surface-hover" />
                    <Button
                      aria-label={`${unit.title} 유닛 삭제`}
                      onClick={() =>
                        dispatch({ type: "unit-removed", unitId: unit.id })
                      }
                      size="icon"
                      variant="ghost"
                    >
                      <TrashIcon aria-hidden="true" size={15} />
                    </Button>
                  </div>
                  <Input
                    aria-label={`유닛 ${unitIndex + 1} 제목`}
                    className="mb-3 font-bold"
                    onChange={(event) =>
                      dispatch({
                        title: event.target.value,
                        type: "unit-title-changed",
                        unitId: unit.id,
                      })
                    }
                    value={unit.title}
                  />
                  <div className="flex flex-col gap-2">
                    {unit.lessons.map((lesson, lessonIndex) => (
                      <div className="flex items-center gap-2" key={lesson.id}>
                        <span className="w-6 text-sm font-bold text-muted-foreground">
                          {lessonIndex + 1}
                        </span>
                        <Input
                          aria-label={`${unit.title} 레슨 ${lessonIndex + 1} 제목`}
                          onChange={(event) =>
                            dispatch({
                              lessonId: lesson.id,
                              title: event.target.value,
                              type: "lesson-title-changed",
                              unitId: unit.id,
                            })
                          }
                          value={lesson.title}
                        />
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          스텝 {lesson.steps.length}개
                        </span>
                        <Button
                          aria-label={`${lesson.title} 레슨 삭제`}
                          onClick={() =>
                            dispatch({
                              lessonId: lesson.id,
                              type: "lesson-removed",
                              unitId: unit.id,
                            })
                          }
                          size="icon"
                          variant="ghost"
                        >
                          <TrashIcon aria-hidden="true" size={14} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      className="self-start"
                      onClick={() =>
                        dispatch({
                          lessonId: lessonIdSchema.parse(
                            `lesson_${crypto.randomUUID()}`
                          ),
                          type: "lesson-added",
                          unitId: unit.id,
                        })
                      }
                      type="button"
                      variant="ghost"
                    >
                      <PlusIcon aria-hidden="true" size={15} /> 레슨 추가
                    </Button>
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  readonly active: boolean
  readonly label: string
  readonly onClick: () => void
}) {
  return (
    <button
      className={cn(
        "border-b-2 px-5 py-3 text-[0.9375rem] font-bold transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
