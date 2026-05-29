"use client"

import * as React from "react"
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Settings,
} from "lucide-react"

import type { AdminEditorCurriculumVersionDetailDto } from "@workspace/core/admin"
import { Button } from "@workspace/ui/components/ui/button"

import type { EditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import {
  formatPointLabel,
  getChangeKindLabel,
  getNodeStatusLabel,
  getStepDisplayTitle,
  getStepTypeLabel,
} from "@/features/courses/course-editor/editor-labels"

type LessonSummary =
  AdminEditorCurriculumVersionDetailDto["chapters"][number]["lessons"][number]

type LessonWorkspaceProps = {
  changeKind: EditorChangeKind
  isReadOnly?: boolean
  lesson: LessonSummary | null
  onAddStep?: () => void
  onArchiveStep?: (stepId: string) => void
  onMoveStep?: (stepId: string, targetIndex: number) => void
  onOpenPreview?: () => void
  onOpenSettings?: () => void
  selectedStepId: string | null
  steps: AdminEditorCurriculumVersionDetailDto["steps"]
  onSelectStep?: (stepId: string) => void
  onUpdateLessonField?: (
    lessonId: string,
    field: "description" | "title",
    value: string
  ) => void
}

export function LessonWorkspace({
  changeKind,
  isReadOnly = false,
  lesson,
  onAddStep,
  onArchiveStep,
  onMoveStep,
  onOpenPreview,
  onOpenSettings,
  selectedStepId,
  steps,
  onSelectStep,
  onUpdateLessonField,
}: LessonWorkspaceProps) {
  if (!lesson) {
    return (
      <section className="rounded-md border bg-background p-6">
        <p className="text-sm text-muted-foreground">
          왼쪽 커리큘럼에서 레슨을 선택하세요.
        </p>
      </section>
    )
  }

  const sortedSteps = [...steps].sort(
    (left, right) => left.sortOrder - right.sortOrder
  )

  return (
    <section className="flex flex-col gap-8" aria-labelledby="lesson-workspace">
      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {getNodeStatusLabel(lesson.status)} ·{" "}
              {getChangeKindLabel(changeKind)}
            </p>
            <label className="grid gap-2 text-sm">
              레슨 제목
              <input
                id="lesson-workspace"
                className="rounded-md border bg-background px-3 py-2 text-2xl font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isReadOnly}
                value={lesson.title}
                onChange={(event) =>
                  onUpdateLessonField?.(
                    lesson.lessonId,
                    "title",
                    event.currentTarget.value
                  )
                }
              />
            </label>
            <label className="grid max-w-2xl gap-2 text-sm">
              레슨 설명
              <textarea
                className="min-h-20 rounded-md border bg-background px-3 py-2 leading-6 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isReadOnly}
                value={lesson.description}
                onChange={(event) =>
                  onUpdateLessonField?.(
                    lesson.lessonId,
                    "description",
                    event.currentTarget.value
                  )
                }
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onOpenPreview}>
              <Eye aria-hidden="true" />
              학습 화면 미리보기
            </Button>
            <Button type="button" variant="outline" onClick={onOpenSettings}>
              <Settings aria-hidden="true" />
              레슨 설정
            </Button>
          </div>
        </div>
        <div className="rounded-md border bg-background p-4">
          <h3 className="text-sm font-medium">학습 의도</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            이 레슨은 학습자가 {lesson.title} 흐름을 따라 직접 문장을 조립하도록
            설계됩니다.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
            학습 흐름
          </h3>
          <Button
            type="button"
            disabled={isReadOnly}
            variant="outline"
            onClick={onAddStep}
          >
            <Plus aria-hidden="true" />
            스텝 추가
          </Button>
        </div>
        <div className="space-y-2">
          {sortedSteps.map((step, index) => {
            const stepTitle = getStepDisplayTitle(step)

            return (
              <div
                key={step.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1"
              >
                <button
                  type="button"
                  aria-label={`${stepTitle} 스텝 열기`}
                  aria-current={step.id === selectedStepId ? "true" : undefined}
                  className="grid min-w-0 grid-cols-[104px_1fr_auto] items-center gap-4 rounded-md border bg-background px-4 py-3 text-left text-sm transition hover:bg-muted aria-current:border-foreground"
                  onClick={() => onSelectStep?.(step.id)}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {getStepTypeLabel(step.type)}
                  </span>
                  <span className="min-w-0 truncate font-medium">
                    {stepTitle}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatPointLabel(step.points)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`${stepTitle} 위로 이동`}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                  disabled={isReadOnly || index === 0}
                  onClick={() => onMoveStep?.(step.id, index - 1)}
                >
                  <ChevronUp aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`${stepTitle} 아래로 이동`}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                  disabled={isReadOnly || index === sortedSteps.length - 1}
                  onClick={() => onMoveStep?.(step.id, index + 1)}
                >
                  <ChevronDown aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`${stepTitle} 스텝 보관`}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                  disabled={isReadOnly}
                  onClick={() => onArchiveStep?.(step.id)}
                >
                  <Archive aria-hidden="true" className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
