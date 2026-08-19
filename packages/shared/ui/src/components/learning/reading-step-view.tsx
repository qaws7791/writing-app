import type { ReactNode } from "react"

import { MarkdownContent } from "#ui/components/learning/markdown-content"
import { Prose, ProseFigure, ProseSource } from "#ui/components/learning/prose"
import { StepHeader, StepTitle } from "#ui/components/learning/step"

function isVisibleReadingSource(source: string | undefined): source is string {
  if (source === undefined) return false
  const trimmed = source.trim()
  return trimmed !== "" && trimmed !== "자체 집필"
}

export function ReadingStepView({
  body,
  illustration,
  source,
  title,
}: {
  readonly body: string
  readonly illustration?: ReactNode
  readonly source?: string
  readonly title: string
}) {
  return (
    <>
      <StepHeader>
        <StepTitle>
          <h1>{title}</h1>
        </StepTitle>
      </StepHeader>
      <Prose>
        {illustration === undefined ? null : (
          <ProseFigure>{illustration}</ProseFigure>
        )}
        <MarkdownContent>{body}</MarkdownContent>
        {isVisibleReadingSource(source) ? (
          <ProseSource>출처: {source}</ProseSource>
        ) : null}
      </Prose>
    </>
  )
}
