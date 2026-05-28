import * as React from "react"

import type { AdminEditorLessonDetailDto } from "@workspace/core/admin"

type LessonPreviewProps = {
  lessonTitle: string
  steps: AdminEditorLessonDetailDto["steps"]
}

export function LessonPreview({ lessonTitle, steps }: LessonPreviewProps) {
  const sortedSteps = [...steps].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section className="space-y-6" aria-labelledby="lesson-preview">
      <div className="space-y-2 border-b pb-4">
        <p className="text-xs font-medium text-muted-foreground">Preview</p>
        <h2 id="lesson-preview" className="text-3xl font-semibold">
          {lessonTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          저장 전 working copy 기준으로 학습 흐름을 확인합니다.
        </p>
      </div>
      <div className="space-y-3">
        {sortedSteps.map((step) => (
          <article
            key={step.id}
            className="rounded-md border bg-background p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                {step.type}
              </span>
              <span className="text-xs text-muted-foreground">
                {step.points} XP
              </span>
            </div>
            <h3 className="mt-3 text-base font-medium">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {summarizeContent(step.content)}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function summarizeContent(content: unknown) {
  if (typeof content === "string" && content.trim().length > 0) {
    return content
  }

  if (isRecord(content)) {
    const firstText = Object.values(content).find(
      (value) => typeof value === "string" && value.trim().length > 0
    )

    if (typeof firstText === "string") {
      return firstText
    }
  }

  return "콘텐츠 요약을 준비 중입니다."
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
