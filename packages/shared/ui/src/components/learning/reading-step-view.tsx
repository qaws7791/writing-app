import type { ReactNode } from "react"

import { MarkdownContent } from "#ui/components/learning/markdown-content"
import { Prose, ProseFigure, ProseSource } from "#ui/components/learning/prose"
import { StepHeader, StepTitle } from "#ui/components/learning/step"

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
          <h2>{title}</h2>
        </StepTitle>
      </StepHeader>
      <Prose>
        {illustration === undefined ? null : (
          <ProseFigure>{illustration}</ProseFigure>
        )}
        <MarkdownContent>{body}</MarkdownContent>
        {source === undefined ? null : (
          <ProseSource>출처: {source}</ProseSource>
        )}
      </Prose>
    </>
  )
}
