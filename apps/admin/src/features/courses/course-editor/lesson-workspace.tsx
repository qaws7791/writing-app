"use client"

import * as React from "react"
import { Eye, Plus, Settings } from "lucide-react"

import type { AdminEditorCurriculumVersionDetailDto } from "@workspace/core/admin"
import { Button } from "@workspace/ui/components/ui/button"

import type { EditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"

type LessonSummary =
  AdminEditorCurriculumVersionDetailDto["chapters"][number]["lessons"][number]

type LessonWorkspaceProps = {
  changeKind: EditorChangeKind
  lesson: LessonSummary | null
  selectedStepId: string | null
  steps: AdminEditorCurriculumVersionDetailDto["steps"]
  onSelectStep?: (stepId: string) => void
}

export function LessonWorkspace({
  changeKind,
  lesson,
  selectedStepId,
  steps,
  onSelectStep,
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

  return (
    <section className="flex flex-col gap-8" aria-labelledby="lesson-workspace">
      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {lesson.status} · {changeKind}
            </p>
            <h2 id="lesson-workspace" className="text-3xl font-semibold">
              {lesson.title}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {lesson.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline">
              <Eye aria-hidden="true" />
              학습 화면 미리보기
            </Button>
            <Button type="button" variant="outline">
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
            LEARNING SEQUENCE
          </h3>
          <Button type="button" variant="outline">
            <Plus aria-hidden="true" />
            스텝 추가
          </Button>
        </div>
        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              aria-current={step.id === selectedStepId ? "true" : undefined}
              className="grid w-full grid-cols-[96px_1fr_auto] items-center gap-4 rounded-md border bg-background px-4 py-3 text-left text-sm transition hover:bg-muted aria-current:border-foreground"
              onClick={() => onSelectStep?.(step.id)}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {step.type}
              </span>
              <span className="font-medium">{step.title}</span>
              <span className="text-xs text-muted-foreground">
                {step.points} XP
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
