import type { ReactNode } from "react"

import { MarkdownContent } from "#ui/components/lesson/markdown-content"
import { Prose, ProseFigure, ProseSource } from "#ui/components/ui/prose"
import { StepHeader, StepTitle } from "#ui/components/ui/step"

export function ReadingStepView({
  body,
  guide,
  illustration,
  source,
  title,
}: {
  readonly body: string
  readonly guide: string
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
        {guide === "" ? null : (
          <MarkdownContent className="text-sm leading-6 text-muted-foreground [&_p]:leading-6">
            {guide}
          </MarkdownContent>
        )}
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
